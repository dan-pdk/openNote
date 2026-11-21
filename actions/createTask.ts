"use server";
import controller from "@/db/controller";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import authOptions from "@/auth/authOptions";


export default async function createTask(roomId: string, formData: FormData) {
    const session = await getServerSession(authOptions);
    const taskName = formData.get("taskName");
    const description = formData.get("description");
    const date = formData.get("date") as string

    function formatDate(date: string) {
        const [year, month, day] = date.split('-');
        const newDate = new Date(Number(year), Number(month), Number(day));
        return newDate.toISOString();
    }

    const valuesData = {
        nome: taskName,
        dataEntrega: formatDate(date),
        dataCriacao: (new Date()).toISOString(),
        tarefa_description: description,
    }

    /*function validadeAuthorization() {
        const user = session?.user;
        const DBuser = await controller.runQuery("SELECT FROM SALAS")
    }
        TODO: When users are able to join someone else's room, add the logic the validate their authorization to create a task    
    
    */
    
    const userId = session?.user.id

    const room = await controller.runQuery("SELECT lider_id FROM salas WHERE id = $1 ", [roomId])
    const isUserAuthorized  = room[0].lider_id == userId

    if (session && isUserAuthorized) {
        const queryCommand = controller.createQueryCommand();
        const query = queryCommand.insert("tarefas").values(valuesData).resolve();
        const result = await controller.runQuery(query);
    }

    revalidatePath(`/rooms/${roomId}`)
}