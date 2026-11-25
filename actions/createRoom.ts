"use server";
import controller from "@/db/controller";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import authOptions from "@/auth/authOptions";
import path from "path";
import { writeFile } from "fs/promises";

type CreateRoomResult = {
    success?: boolean;
    error?: string;
    roomId?: string;
};

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

    function validateImageFile(file: File | null) {
        if (!file || file.size === 0) return false;
        const sizeInMB = file.size / 1000000;
        return sizeInMB <= 25 && file.type.includes("image");
    }

    async function createImageFileURL(file: File | null) {
        if (file && validateImageFile(file)) {
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);
            const filePath = path.join(process.cwd(), "public", file.name);
            await writeFile(filePath, buffer);
            return `/${file.name}`;
        }
        return null;
    }

    try {
        const iconeURL = await createImageFileURL(file);

        const valuesData = {
            nome: roomName,
            lider_id: lider_id,
            tipo: tipo,
            icone_url: iconeURL
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
                    id_sala: novaSala.id
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
