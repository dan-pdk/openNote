"use server";
import controller from "@/db/controller";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";

export default async function createRoom(formData: FormData) {
    const session = await getServerSession();
    const email = session?.user?.email
    const roomName = formData.get("roomName")

    const valuesData = {
        nome: roomName,
        email_do_dono: email,
        tipo: "default"
    }

    if (session) {
        const queryCommand = controller.createQueryCommand()
        const query = queryCommand.insert("salas").values(valuesData).resolve();
        const result = await controller.runQuery(query);
    }

    revalidatePath("/dashboard")
}