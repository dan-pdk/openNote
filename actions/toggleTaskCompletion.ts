"use server";

import authOptions from "@/auth/authOptions";
import controller from "@/db/controller";
import { isValidUuid, normalizeUuid } from "@/lib/tasks";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";

type ToggleTaskCompletionResult = {
    success?: boolean;
    error?: string;
    concluida?: boolean;
};

export default async function toggleTaskCompletion(
    targetRoomIdentifier: string,
    targetTaskIdentifier: string
): Promise<ToggleTaskCompletionResult> {
    const userSession = await getServerSession(authOptions);
    const authenticatedUserId = userSession?.user?.id;

    if (!userSession || !isValidUuid(authenticatedUserId)) {
        return { error: "Usuário não autenticado." };
    }

    if (!isValidUuid(targetRoomIdentifier) || !isValidUuid(targetTaskIdentifier)) {
        return { error: "Identificador inválido." };
    }

    const normalizedUserId = normalizeUuid(authenticatedUserId);
    const normalizedRoomIdentifier = normalizeUuid(targetRoomIdentifier);
    const normalizedTaskIdentifier = normalizeUuid(targetTaskIdentifier);

    try {
        const taskRows = await controller.runQuery<{
            id: string;
            lider_id: string;
        }>(
            `SELECT t.id, s.lider_id
             FROM tarefas t
             INNER JOIN salas s ON s.id = t.id_sala
             WHERE t.id = $1 AND t.id_sala = $2;`,
            [normalizedTaskIdentifier, normalizedRoomIdentifier]
        );

        if (taskRows.length === 0) {
            return { error: "Tarefa não encontrada." };
        }

        const targetTask = taskRows[0];
        const isRoomLeader =
            targetTask.lider_id.toLowerCase() === normalizedUserId;

        if (!isRoomLeader) {
            const membershipRows = await controller.runQuery<{ id_sala: string }>(
                "SELECT id_sala FROM sala_membros WHERE id_usuario = $1 AND id_sala = $2;",
                [normalizedUserId, normalizedRoomIdentifier]
            );

            if (membershipRows.length === 0) {
                return { error: "Você não tem acesso a esta sala." };
            }
        }

        const isCompletedForUser = await controller.runInTransaction(
            async (executeQuery) => {
                const deletedCompletions = await executeQuery<{ id_tarefa: string }>(
                    `DELETE FROM tarefa_conclusoes
                     WHERE id_usuario = $1 AND id_tarefa = $2
                     RETURNING id_tarefa;`,
                    [normalizedUserId, normalizedTaskIdentifier]
                );

                if (deletedCompletions.length > 0) {
                    return false;
                }

                await executeQuery(
                    `INSERT INTO tarefa_conclusoes (id_usuario, id_tarefa)
                     VALUES ($1, $2)
                     ON CONFLICT (id_usuario, id_tarefa) DO NOTHING;`,
                    [normalizedUserId, normalizedTaskIdentifier]
                );

                return true;
            }
        );

        revalidatePath(`/rooms/${normalizedRoomIdentifier}`);
        revalidatePath("/dashboard");

        return { success: true, concluida: isCompletedForUser };
    } catch (databaseOperationError) {
        console.error("Erro ao atualizar status da tarefa:", databaseOperationError);
        return { error: "Não foi possível atualizar a tarefa." };
    }
}
