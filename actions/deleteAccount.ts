"use server";

import authOptions from "@/auth/authOptions";
import controller from "@/db/controller";
import { ensureTaskReadsTable } from "@/lib/taskReads";
import { isValidUuid, normalizeUuid } from "@/lib/tasks";
import { del } from "@vercel/blob";
import { unlink } from "fs/promises";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import path from "path";

type DeleteAccountResult = {
    success?: boolean;
    error?: string;
};

async function cleanupStoredFiles(fileUrls: Array<string | null>) {
    const validUrls = fileUrls.filter(
        (url): url is string => typeof url === "string" && url.length > 0
    );

    for (const fileUrl of validUrls) {
        if (
            process.env.BLOB_READ_WRITE_TOKEN &&
            fileUrl.includes(".blob.vercel-storage.com/")
        ) {
            await del(fileUrl).catch(() => {});
        } else if (fileUrl.startsWith("/uploads/")) {
            const diskFilePath = path.join(
                process.cwd(),
                "public",
                fileUrl.replace(/^\//, "")
            );
            await unlink(diskFilePath).catch(() => {});
        }
    }
}

export default async function deleteAccount(): Promise<DeleteAccountResult> {
    const userSession = await getServerSession(authOptions);
    const authenticatedUserId = userSession?.user?.id;

    if (!userSession || !isValidUuid(authenticatedUserId)) {
        return { error: "Usuário não autenticado." };
    }

    const normalizedUserId = normalizeUuid(authenticatedUserId);

    try {
        await ensureTaskReadsTable();

        const { filesToCleanup } = await controller.runInTransaction(
            async (executeQuery) => {
                const userRows = await executeQuery<{
                    id: string;
                    mirror_foto: string | null;
                }>("SELECT id, mirror_foto FROM usuarios WHERE id = $1;", [
                    normalizedUserId,
                ]);

                if (userRows.length === 0) {
                    throw new Error("USER_NOT_FOUND");
                }

                const ownedRoomRows = await executeQuery<{
                    icone_url: string | null;
                }>(
                    "SELECT icone_url FROM salas WHERE lider_id = $1 AND icone_url IS NOT NULL;",
                    [normalizedUserId]
                );

                await executeQuery(
                    "DELETE FROM comentarios WHERE autor_id = $1;",
                    [normalizedUserId]
                );

                await executeQuery(
                    "DELETE FROM sala_mensagens WHERE autor_id = $1;",
                    [normalizedUserId]
                );

                await executeQuery(
                    "DELETE FROM tarefas WHERE criador_id = $1;",
                    [normalizedUserId]
                );

                await executeQuery(
                    "DELETE FROM usuarios WHERE id = $1 RETURNING id;",
                    [normalizedUserId]
                );

                return {
                    filesToCleanup: [
                        userRows[0].mirror_foto,
                        ...ownedRoomRows.map((room) => room.icone_url),
                    ],
                };
            }
        );

        await cleanupStoredFiles(filesToCleanup);

        revalidatePath("/dashboard");
        revalidatePath("/rooms");
        revalidatePath("/profile");
        revalidatePath(`/profile/${normalizedUserId}`);

        return { success: true };
    } catch (error) {
        if (error instanceof Error && error.message === "USER_NOT_FOUND") {
            return { error: "Usuário não encontrado." };
        }
        console.error("Erro ao deletar conta:", error);
        return { error: "Não foi possível deletar a conta." };
    }
}