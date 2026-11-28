"use server";

import authOptions from "@/auth/authOptions";
import controller from "@/db/controller";
import { isValidUuid, normalizeUuid } from "@/lib/tasks";
import { del, put } from "@vercel/blob";
import { mkdir, unlink, writeFile } from "fs/promises";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import path from "path";

type UpdateUserSettingsResult = {
    success?: boolean;
    error?: string;
    username?: string;
    image?: string | null;
    showEmail?: boolean;
};

const ALLOWED_IMAGE_EXTENSIONS: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
};

const MAX_AVATAR_BYTES = 4 * 1024 * 1024; // 4 MB

let hasEnsuredShowEmailColumn = false;

export async function ensureShowEmailColumn() {
    if (hasEnsuredShowEmailColumn) {
        return;
    }

    await controller.runQuery(
        `ALTER TABLE usuarios
         ADD COLUMN IF NOT EXISTS show_email BOOLEAN NOT NULL DEFAULT FALSE;`
    );
    hasEnsuredShowEmailColumn = true;
}

export async function updateUsername(
    rawUsername: string
): Promise<UpdateUserSettingsResult> {
    const session = await getServerSession(authOptions);
    const rawUserId = session?.user?.id;

    if (!session || !isValidUuid(rawUserId)) {
        return { error: "Usuário não autenticado." };
    }

    if (typeof rawUsername !== "string") {
        return { error: "Informe um nome de usuário válido." };
    }

    const trimmedUsername = rawUsername.trim();
    if (trimmedUsername.length < 2) {
        return { error: "O nome deve ter pelo menos 2 caracteres." };
    }

    if (trimmedUsername.length > 128) {
        return { error: "O nome deve ter no máximo 128 caracteres." };
    }

    const normalizedUserId = normalizeUuid(rawUserId);

    try {
        const duplicateRows = await controller.runQuery<{ id: string }>(
            `SELECT id FROM usuarios WHERE LOWER(username) = LOWER($1) AND id <> $2;`,
            [trimmedUsername, normalizedUserId]
        );

        if (duplicateRows.length > 0) {
            return { error: "Este nome de usuário já está em uso." };
        }

        const updatedRows = await controller.runQuery<{
            username: string;
            mirror_foto: string | null;
        }>(
            `UPDATE usuarios
             SET username = $1
             WHERE id = $2
             RETURNING username, mirror_foto;`,
            [trimmedUsername, normalizedUserId]
        );

        if (updatedRows.length === 0) {
            return { error: "Usuário não encontrado." };
        }

        revalidatePath("/dashboard");
        revalidatePath("/rooms");
        revalidatePath("/profile");
        revalidatePath(`/profile/${normalizedUserId}`);

        return {
            success: true,
            username: updatedRows[0].username,
            image: updatedRows[0].mirror_foto,
        };
    } catch (error: unknown) {
        const pgError = error as { code?: string };
        if (pgError?.code === "23505") {
            return { error: "Este nome de usuário já está em uso." };
        }
        console.error("Erro ao atualizar nome de usuário:", error);
        return { error: "Não foi possível atualizar o nome de usuário." };
    }
}

export async function updateUserAvatar(
    formData: FormData
): Promise<UpdateUserSettingsResult> {
    const session = await getServerSession(authOptions);
    const rawUserId = session?.user?.id;

    if (!session || !isValidUuid(rawUserId)) {
        return { error: "Usuário não autenticado." };
    }

    const fileEntry = formData.get("avatar");
    if (!(fileEntry instanceof File) || fileEntry.size === 0) {
        return { error: "Selecione uma imagem válida." };
    }

    if (fileEntry.size > MAX_AVATAR_BYTES) {
        return { error: "A imagem deve ter no máximo 4 MB." };
    }

    const extension = ALLOWED_IMAGE_EXTENSIONS[fileEntry.type];
    if (!extension) {
        return { error: "Formato inválido. Use PNG, JPG, WEBP ou GIF." };
    }

    const normalizedUserId = normalizeUuid(rawUserId);

    try {
        const currentUserRows = await controller.runQuery<{
            mirror_foto: string | null;
        }>(`SELECT mirror_foto FROM usuarios WHERE id = $1;`, [normalizedUserId]);

        if (currentUserRows.length === 0) {
            return { error: "Usuário não encontrado." };
        }

        const previousPhoto = currentUserRows[0].mirror_foto;
        const fileName = `${normalizedUserId}-${Date.now()}.${extension}`;
        let publicUrlPath: string;

        if (process.env.BLOB_READ_WRITE_TOKEN) {
            const blob = await put(`avatars/${fileName}`, fileEntry, {
                access: "public",
            });
            publicUrlPath = blob.url;
        } else {
            const uploadDir = path.join(process.cwd(), "public", "uploads", "avatars");
            await mkdir(uploadDir, { recursive: true });
            const diskFilePath = path.join(uploadDir, fileName);
            publicUrlPath = `/uploads/avatars/${fileName}`;

            const bytes = await fileEntry.arrayBuffer();
            await writeFile(diskFilePath, Buffer.from(bytes));
        }

        const updatedRows = await controller.runQuery<{
            username: string;
            mirror_foto: string | null;
        }>(
            `UPDATE usuarios
             SET mirror_foto = $1
             WHERE id = $2
             RETURNING username, mirror_foto;`,
            [publicUrlPath, normalizedUserId]
        );

        if (previousPhoto && previousPhoto !== publicUrlPath) {
            if (
                process.env.BLOB_READ_WRITE_TOKEN &&
                previousPhoto.includes(".blob.vercel-storage.com/")
            ) {
                del(previousPhoto).catch(() => {});
            } else if (previousPhoto.startsWith("/uploads/avatars/")) {
                const oldFilePath = path.join(
                    process.cwd(),
                    "public",
                    previousPhoto.replace(/^\//, "")
                );
                unlink(oldFilePath).catch(() => {});
            }
        }

        revalidatePath("/dashboard");
        revalidatePath("/rooms");
        revalidatePath("/profile");
        revalidatePath(`/profile/${normalizedUserId}`);

        return {
            success: true,
            username: updatedRows[0].username,
            image: updatedRows[0].mirror_foto,
        };
    } catch (error) {
        console.error("Erro ao atualizar foto de perfil:", error);
        return { error: "Não foi possível salvar a foto de perfil." };
    }
}

export async function updateShowEmail(
    showEmail: boolean
): Promise<UpdateUserSettingsResult> {
    const session = await getServerSession(authOptions);
    const rawUserId = session?.user?.id;

    if (!session || !isValidUuid(rawUserId)) {
        return { error: "Usuário não autenticado." };
    }

    if (typeof showEmail !== "boolean") {
        return { error: "Valor inválido." };
    }

    const normalizedUserId = normalizeUuid(rawUserId);

    try {
        await ensureShowEmailColumn();

        const updatedRows = await controller.runQuery<{
            show_email: boolean;
        }>(
            `UPDATE usuarios
             SET show_email = $1
             WHERE id = $2
             RETURNING show_email;`,
            [showEmail, normalizedUserId]
        );

        if (updatedRows.length === 0) {
            return { error: "Usuário não encontrado." };
        }

        revalidatePath("/profile");
        revalidatePath(`/profile/${normalizedUserId}`);

        return {
            success: true,
            showEmail: Boolean(updatedRows[0].show_email),
        };
    } catch (error) {
        console.error("Erro ao atualizar visibilidade do e-mail:", error);
        return { error: "Não foi possível atualizar a privacidade do e-mail." };
    }
}