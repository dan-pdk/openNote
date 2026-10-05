"use server";
import controller from "@/db/controller";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import authOptions from "@/auth/authOptions";
import path from "path";
import { writeFile } from "fs";

export default async function createRoom(formData: FormData) {
    const session = await getServerSession(authOptions);
    const lider_id = session?.user?.id;
    const roomName = formData.get("roomName");
    const file: File = formData.get("image") as File;

    async function createImageFileURL(file: File) {
        if (validateImageFile(file)) {
            await addFileToPublic(file);
            return `/${file.name}`    
        }
        return "";
    }

    function validateImageFile(file: File) {
        function bytesToMegaBytes(bytes: number) { return bytes / 1000000 }
        if (!!file && bytesToMegaBytes(file.size) <= 25 && file.type.includes("image")) {
            return true;
        }
    }

    async function addFileToPublic(file: File) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const filePath = path.join(process.cwd(), "public", file.name)
        await writeFile(filePath, buffer, 'utf-8', () => {});
    }

    const iconeURL = await createImageFileURL(file)

    const valuesData = {
        nome: roomName,
        lider_id: lider_id,
        tipo: "default",
        icone_url: iconeURL
    }

    if (session) {
        const queryCommand = controller.createQueryCommand();
        const query = queryCommand.insert("salas").values(valuesData).resolve();
        const result = await controller.runQuery(query);
    }

    revalidatePath("/dashboard")
}