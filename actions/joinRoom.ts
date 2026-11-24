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

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function joinRoom(formData: FormData): Promise<JoinRoomResult> {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!session || !userId || !uuidPattern.test(userId)) {
        return { error: "Usuário não autenticado." };
    }

    const rawRoomId = formData.get("roomId")?.toString().trim() ?? "";

    if (!uuidPattern.test(rawRoomId)) {
        return { error: "Código UUID inválido." };
    }

    const parsedRoomId = rawRoomId.toLowerCase();

    try {
        const existingRooms = await controller.runQuery<{ id: string }>(
            "SELECT id FROM salas WHERE id = $1;",
            [parsedRoomId]
        );

        if (existingRooms.length === 0) {
            return { error: "Sala não encontrada." };
        }

        const insertedMemberships = await controller.runQuery<{ id_sala: string }>(
            "INSERT INTO sala_membros (id_usuario, id_sala) VALUES ($1, $2) ON CONFLICT (id_usuario, id_sala) DO NOTHING RETURNING id_sala;",
            [userId, parsedRoomId]
        );

        if (insertedMemberships.length === 0) {
            return { error: "Você já participa desta sala." };
        }

        revalidatePath("/dashboard");
        revalidatePath("/rooms");

        return { success: true, roomId: parsedRoomId };
    } catch {
        return { error: "Não foi possível entrar na sala. Faz o L." };
    }
}
