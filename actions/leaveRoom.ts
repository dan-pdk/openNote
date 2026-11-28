"use server";

import authOptions from "@/auth/authOptions";
import controller from "@/db/controller";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";

type LeaveRoomResult = {
    success?: boolean;
    error?: string;
};

const uuidValidationRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function leaveRoom(targetRoomIdentifier: string): Promise<LeaveRoomResult> {
    const userSession = await getServerSession(authOptions);
    const authenticatedUserId = userSession?.user?.id;

    if (!userSession || !authenticatedUserId || typeof authenticatedUserId !== "string" || authenticatedUserId.length !== 36 || !uuidValidationRegex.test(authenticatedUserId)
    ) {
        return { error: "Usuário não autenticado." };
    }

    if (typeof targetRoomIdentifier !== "string") {
        return { error: "Identificador de sala inválido." };
    }

    const trimmedRoomIdentifier = targetRoomIdentifier.trim();

    if (trimmedRoomIdentifier.length !== 36 || !uuidValidationRegex.test(trimmedRoomIdentifier)) {
        return { error: "Identificador de sala inválido." };
    }

    const normalizedRoomIdentifier = trimmedRoomIdentifier.toLowerCase();

    try {
        const deletedMembershipsList = await controller.runQuery<{ id_sala: string }>(
            "DELETE FROM sala_membros WHERE id_usuario = $1 AND id_sala = $2 AND EXISTS (SELECT 1 FROM salas WHERE id = $2 AND lider_id <> $1) RETURNING id_sala;",
            [authenticatedUserId, normalizedRoomIdentifier]
        );

        if (deletedMembershipsList.length === 0) {
            return { error: "Sala não encontrada ou você não pode sair dela." };
        }

        revalidatePath("/dashboard");
        revalidatePath("/rooms");
        revalidatePath(`/rooms/${normalizedRoomIdentifier}`);

        return { success: true };
    } catch (databaseOperationError) {
        console.error("Erro ao sair da sala:", databaseOperationError);
        return { error: "Não foi possível sair da sala." };
    }
}
