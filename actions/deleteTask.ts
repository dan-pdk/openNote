"use server";

import authOptions from "@/auth/authOptions";
import controller from "@/db/controller";
import { isValidUuid, normalizeUuid } from "@/lib/tasks";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";

type DeleteTaskResult = {
    success?: boolean;
    error?: string;
};

export default async function deleteTask(
    targetRoomIdentifier: string,
    targetTaskIdentifier: string
): Promise<DeleteTaskResult> {
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
            criador_id: string | null;
            lider_id: string;
        }>(
            `SELECT t.id, t.criador_id, s.lider_id
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

            const isTaskCreator =
                targetTask.criador_id !== null &&
                targetTask.criador_id.toLowerCase() === normalizedUserId;

            if (!isTaskCreator) {
                return { error: "Você só pode remover suas próprias tarefas." };
            }
        }

        const deletedTasks = await controller.runQuery<{ id: string }>(
            "DELETE FROM tarefas WHERE id = $1 AND id_sala = $2 RETURNING id;",
            [normalizedTaskIdentifier, normalizedRoomIdentifier]
        );

        if (deletedTasks.length === 0) {
            return { error: "Tarefa não encontrada." };
        }

        revalidatePath(`/rooms/${normalizedRoomIdentifier}`);
        revalidatePath("/dashboard");

        return { success: true };
    } catch (databaseOperationError) {
        console.error("Erro ao remover tarefa:", databaseOperationError);
        return { error: "Não foi possível remover a tarefa." };
    }
}
