"use server";
import controller from "@/db/controller";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import authOptions from "@/auth/authOptions";
import path from "path";
import { mkdir, writeFile } from "fs/promises";
import { put } from "@vercel/blob";

type CreateRoomResult = {
    success?: boolean;
    error?: string;
    roomId?: string;
};

const ALLOWED_IMAGE_EXTENSIONS: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
};

const MAX_ROOM_ICON_BYTES = 4 * 1024 * 1024; // 4 MB

export default async function createRoom(formData: FormData): Promise<CreateRoomResult> {
    const session = await getServerSession(authOptions);
    const lider_id = session?.user?.id;
    const roomName = formData.get("roomName")?.toString().trim();
    const rawTipo = formData.get("tipo")?.toString();
    const tipo = rawTipo === "livre" ? "livre" : "restrita";
    const file = formData.get("image") as File | null;

    if (!session || !lider_id) {
        return { error: "Usuário não autenticado." };
    }

    if (!roomName) {
        return { error: "Informe o nome da sala." };
    }

    let iconeURL: string | null = null;

    if (file && file.size > 0) {
        if (file.size > MAX_ROOM_ICON_BYTES) {
            return { error: "O ícone da sala deve ter no máximo 4 MB." };
        }

        const extension = ALLOWED_IMAGE_EXTENSIONS[file.type];
        if (!extension) {
            return { error: "Formato inválido. Use PNG, JPG, WEBP ou GIF." };
        }

        try {
            const uniqueFileName = `${lider_id}-${Date.now()}.${extension}`;

            if (process.env.BLOB_READ_WRITE_TOKEN) {
                const blob = await put(`rooms/${uniqueFileName}`, file, {
                    access: "public",
                });
                iconeURL = blob.url;
            } else {
                const bytes = await file.arrayBuffer();
                const uploadDir = path.join(process.cwd(), "public", "uploads", "rooms");
                await mkdir(uploadDir, { recursive: true });
                await writeFile(path.join(uploadDir, uniqueFileName), Buffer.from(bytes));
                iconeURL = `/uploads/rooms/${uniqueFileName}`;
            }
        } catch (uploadError) {
            console.error("Erro ao enviar ícone da sala:", uploadError);
            return { error: "Não foi possível salvar o ícone da sala." };
        }
    }

    try {
        const valuesData = {
            nome: roomName,
            lider_id: lider_id,
            tipo: tipo,
            icone_url: iconeURL,
        };

        const querySala = controller
            .createQueryCommand()
            .insert("salas")
            .values(valuesData)
            .returning("id")
            .resolve();

        const [novaSala] = await controller.runQuery<{ id: string }>(querySala);

        if (novaSala?.id) {
            const queryMembro = controller
                .createQueryCommand()
                .insert("sala_membros")
                .values({
                    id_usuario: lider_id,
                    id_sala: novaSala.id,
                })
                .resolve();

            await controller.runQuery(queryMembro);
        }

        revalidatePath("/dashboard");
        revalidatePath("/rooms");

        return { success: true, roomId: novaSala?.id };
    } catch (error) {
        console.error("Erro ao criar sala:", error);
        return { error: "Não foi possível criar a sala." };
    }
}