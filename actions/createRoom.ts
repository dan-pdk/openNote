"use server";
import controller from "@/db/controller";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import authOptions from "@/auth/authOptions";

export default async function createRoom(formData: FormData) {
    const session = await getServerSession(authOptions);
    const lider_id = session?.user?.id
    const roomName = formData.get("roomName")

    const valuesData = {
        nome: roomName,
        lider_id: lider_id,
        tipo: "default"
    }

    if (session) {
        const queryCommand = controller.createQueryCommand()
        const query = queryCommand.insert("salas").values(valuesData).resolve();
        const result = await controller.runQuery(query);
    }

    revalidatePath("/dashboard")
}