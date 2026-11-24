"use server";

import authOptions from "@/auth/authOptions";
import controller from "@/db/controller";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";

type DeleteRoomResult = {
    success?: boolean;
    error?: string;
};

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function deleteRoom(roomId: string): Promise<DeleteRoomResult> {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!session || !userId || !uuidPattern.test(userId)) {
        return { error: "Usuário não autenticado." };
    }

    const trimmedRoomId = typeof roomId === "string" ? roomId.trim() : "";

    if (!uuidPattern.test(trimmedRoomId)) {
        return { error: "Identificador de sala inválido." };
    }

    const parsedRoomId = trimmedRoomId.toLowerCase();

    try {
        const existingRooms = await controller.runQuery<{ lider_id: string }>(
            "SELECT lider_id FROM salas WHERE id = $1;",
            [parsedRoomId]
        );

        if (existingRooms.length === 0) {
            return { error: "Sala não encontrada." };
        }

        if (existingRooms[0].lider_id !== userId) {
            return { error: "Apenas o líder pode deletar esta sala." };
        }

        const deletedRooms = await controller.runQuery<{ id: string }>(
            "DELETE FROM salas WHERE id = $1 AND lider_id = $2 RETURNING id;",
            [parsedRoomId, userId]
        );

        if (deletedRooms.length === 0) {
            return { error: "Não foi possível deletar a sala." };
        }

        revalidatePath("/dashboard");
        revalidatePath("/rooms");

        return { success: true };
    } catch {
        return { error: "Não foi possível deletar a sala." };
    }
}
