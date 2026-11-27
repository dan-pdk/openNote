"use server";

import authOptions from "@/auth/authOptions";
import controller from "@/db/controller";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";

type JoinRoomResult = {
    success?: boolean;
    error?: string;
    roomId?: string;
};

const uuidValidationRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function joinRoom(formDataPayload: FormData): Promise<JoinRoomResult> {
    const userSession = await getServerSession(authOptions);
    const authenticatedUserId = userSession?.user?.id;

    if (!userSession || !authenticatedUserId || typeof authenticatedUserId !== "string" || authenticatedUserId.length !== 36 || !uuidValidationRegex.test(authenticatedUserId)) {
        return { error: "Usuário não autenticado." };
    }

    if (!formDataPayload || typeof formDataPayload.get !== "function") {
        return { error: "Dados de requisição inválidos." };
    }

    const roomIdentifierEntry = formDataPayload.get("roomId");

    if (typeof roomIdentifierEntry !== "string") {
        return { error: "Código UUID inválido." };
    }

    const trimmedRoomIdentifier = roomIdentifierEntry.trim();

    if (trimmedRoomIdentifier.length !== 36 || !uuidValidationRegex.test(trimmedRoomIdentifier)) {
        return { error: "Código UUID inválido." };
    }

    const normalizedRoomIdentifier = trimmedRoomIdentifier.toLowerCase();

    try {
        const targetRoomsList = await controller.runQuery<{ id: string; lider_id: string }>(
            "SELECT id, lider_id FROM salas WHERE id = $1;",
            [normalizedRoomIdentifier]
        );

        if (targetRoomsList.length === 0) {
            return { error: "Sala não encontrada." };
        }

        const targetRoom = targetRoomsList[0];

        if (targetRoom.lider_id.toLowerCase() === authenticatedUserId.toLowerCase()) {
            return { error: "Você já é o líder desta sala." };
        }

        const existingMembershipsList = await controller.runQuery<{ id_sala: string }>(
            "SELECT id_sala FROM sala_membros WHERE id_usuario = $1 AND id_sala = $2;",
            [authenticatedUserId, normalizedRoomIdentifier]
        );

        if (existingMembershipsList.length > 0) {
            return { error: "Você já participa desta sala." };
        }

        const insertedMembershipsList = await controller.runQuery<{ id_sala: string }>(
            "INSERT INTO sala_membros (id_usuario, id_sala) VALUES ($1, $2) ON CONFLICT (id_usuario, id_sala) DO NOTHING RETURNING id_sala;",
            [authenticatedUserId, normalizedRoomIdentifier]
        );

        if (insertedMembershipsList.length === 0) {
            return { error: "Você já participa desta sala." };
        }

        revalidatePath("/dashboard");
        revalidatePath("/rooms");
        revalidatePath(`/rooms/${normalizedRoomIdentifier}`);

        return { success: true, roomId: normalizedRoomIdentifier };
    } catch (databaseOperationError) {
        console.error("Erro ao processar ingresso na sala:", databaseOperationError);
        return { error: "Não foi possível processar a entrada na sala." };
    }
}
