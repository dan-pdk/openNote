"use server";

import authOptions from "@/auth/authOptions";
import controller from "@/db/controller";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";

type DeleteRoomResult = {
    success?: boolean;
    error?: string;
};

const uuidValidationRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function deleteRoom(targetRoomIdentifier: string): Promise<DeleteRoomResult> {
    const userSession = await getServerSession(authOptions);
    const authenticatedUserId = userSession?.user?.id;

    if (!userSession || !authenticatedUserId || typeof authenticatedUserId !== "string" || authenticatedUserId.length !== 36 || !uuidValidationRegex.test(authenticatedUserId)) {
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
        const deletedRoomsList = await controller.runQuery<{ id: string }>(
            "DELETE FROM salas WHERE id = $1 AND lider_id = $2 RETURNING id;",
            [normalizedRoomIdentifier, authenticatedUserId]
        );

        if (deletedRoomsList.length === 0) {
            return { error: "Sala não encontrada ou você não tem permissão para deletá-la." };
        }

        revalidatePath("/dashboard");
        revalidatePath("/rooms");
        revalidatePath(`/rooms/${normalizedRoomIdentifier}`);

        return { success: true };
    } catch (databaseOperationError) {
        console.error("Erro ao deletar sala:", databaseOperationError);
        return { error: "Não foi possível deletar a sala." };
    }
}
