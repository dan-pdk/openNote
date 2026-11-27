"use server";

import authOptions from "@/auth/authOptions";
import controller from "@/db/controller";
import { isValidUuid, normalizeUuid } from "@/lib/tasks";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";

type MemberActionResult = {
    success?: boolean;
    error?: string;
};

type MemberPermissionField = "pode_criar_tarefas" | "pode_comentar";

export async function updateMemberPermission(
    targetRoomIdentifier: string,
    targetMemberIdentifier: string,
    permissionField: MemberPermissionField,
    nextValue: boolean
): Promise<MemberActionResult> {
    const userSession = await getServerSession(authOptions);
    const authenticatedUserId = userSession?.user?.id;

    if (!userSession || !isValidUuid(authenticatedUserId)) {
        return { error: "Usuário não autenticado." };
    }

    if (
        !isValidUuid(targetRoomIdentifier) ||
        !isValidUuid(targetMemberIdentifier)
    ) {
        return { error: "Identificador inválido." };
    }

    if (
        permissionField !== "pode_criar_tarefas" &&
        permissionField !== "pode_comentar"
    ) {
        return { error: "Permissão inválida." };
    }

    if (typeof nextValue !== "boolean") {
        return { error: "Valor de permissão inválido." };
    }

    const normalizedLeaderId = normalizeUuid(authenticatedUserId);
    const normalizedRoomId = normalizeUuid(targetRoomIdentifier);
    const normalizedMemberId = normalizeUuid(targetMemberIdentifier);

    if (normalizedLeaderId === normalizedMemberId) {
        return { error: "Não é possível alterar as permissões do líder." };
    }

    try {
        const roomRows = await controller.runQuery<{ lider_id: string }>(
            "SELECT lider_id FROM salas WHERE id = $1;",
            [normalizedRoomId]
        );

        if (roomRows.length === 0) {
            return { error: "Sala não encontrada." };
        }

        if (roomRows[0].lider_id.toLowerCase() !== normalizedLeaderId) {
            return { error: "Apenas o líder pode alterar permissões." };
        }

        const updateQuery =
            permissionField === "pode_criar_tarefas"
                ? `UPDATE sala_membros
                   SET pode_criar_tarefas = $1
                   WHERE id_sala = $2 AND id_usuario = $3
                   RETURNING id_usuario;`
                : `UPDATE sala_membros
                   SET pode_comentar = $1
                   WHERE id_sala = $2 AND id_usuario = $3
                   RETURNING id_usuario;`;

        const updatedRows = await controller.runQuery<{ id_usuario: string }>(
            updateQuery,
            [nextValue, normalizedRoomId, normalizedMemberId]
        );

        if (updatedRows.length === 0) {
            return { error: "Membro não encontrado nesta sala." };
        }

        revalidatePath(`/rooms/${normalizedRoomId}`);
        return { success: true };
    } catch (databaseOperationError) {
        console.error(
            "Erro ao atualizar permissão de membro:",
            databaseOperationError
        );
        return { error: "Não foi possível atualizar a permissão." };
    }
}

export async function removeRoomMember(
    targetRoomIdentifier: string,
    targetMemberIdentifier: string
): Promise<MemberActionResult> {
    const userSession = await getServerSession(authOptions);
    const authenticatedUserId = userSession?.user?.id;

    if (!userSession || !isValidUuid(authenticatedUserId)) {
        return { error: "Usuário não autenticado." };
    }

    if (
        !isValidUuid(targetRoomIdentifier) ||
        !isValidUuid(targetMemberIdentifier)
    ) {
        return { error: "Identificador inválido." };
    }

    const normalizedLeaderId = normalizeUuid(authenticatedUserId);
    const normalizedRoomId = normalizeUuid(targetRoomIdentifier);
    const normalizedMemberId = normalizeUuid(targetMemberIdentifier);

    if (normalizedLeaderId === normalizedMemberId) {
        return { error: "O líder não pode ser removido da própria sala." };
    }

    try {
        const roomRows = await controller.runQuery<{ lider_id: string }>(
            "SELECT lider_id FROM salas WHERE id = $1;",
            [normalizedRoomId]
        );

        if (roomRows.length === 0) {
            return { error: "Sala não encontrada." };
        }

        if (roomRows[0].lider_id.toLowerCase() !== normalizedLeaderId) {
            return { error: "Apenas o líder pode remover membros." };
        }

        const deletedRows = await controller.runQuery<{ id_usuario: string }>(
            `DELETE FROM sala_membros
             WHERE id_sala = $1 AND id_usuario = $2
             RETURNING id_usuario;`,
            [normalizedRoomId, normalizedMemberId]
        );

        if (deletedRows.length === 0) {
            return { error: "Membro não encontrado nesta sala." };
        }

        revalidatePath(`/rooms/${normalizedRoomId}`);
        return { success: true };
    } catch (databaseOperationError) {
        console.error("Erro ao remover membro da sala:", databaseOperationError);
        return { error: "Não foi possível remover o membro." };
    }
}