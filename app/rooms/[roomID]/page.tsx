import Calendar from "@/components/Calendar";
import DashboardMenu from "@/components/DashboardMenu"
import Header from "@/components/Header"
import controller from "@/db/controller";

type taskType = {
    id: string,
    name : string,
    dueDate: string,
}

export default async function Page({ params } : { params : Promise<{ roomID: string }> }) {
    const { roomID } = await params;
    const tasks : Array<taskType> = await controller.runQuery(`SELECT FROM tarefas WHERE id_sala = $1`, [roomID]);

    return (
        <div className="dark:bg-[#1D1D1D] min-h-screen">
            <Header />
            <DashboardMenu />
            <div className="flex mx-auto items-center flex-col min-h-full ">
                <Calendar tasks={tasks}/>
            </div>
        </div>
    )
}