import Image from "next/image"
import DashboardMenu from "@/components/DashboardMenu"
import Rooms from "@/components/Rooms"
import AddRoomButton from "@/components/AddRoomModal"
import { getServerSession } from "next-auth"
import controller from "@/db/controller"
import authOptions from "@/auth/authOptions"
import Header from "@/components/Header"


const rooms = ["Sala 1", "Sala 2"]

const tasks = [
    { title: "Tarefa 1", date: "28/03" },
    { title: "Tarefa 2", date: "02/04" },
    { title: "Tarefa 3", date: "05/05" },
]


export default async function Page() {
    let rooms: Array<any> = [];
    try {
        const session = await getServerSession(authOptions);
        const query = `SELECT id, nome, icone_url FROM salas WHERE lider_id = $1`
        //@ts-ignore
        const roomsData = await controller.runQuery(query, [session?.user?.id]);
        rooms = roomsData;
    }

    finally {

        return (
            <div className="min-h-screen bg-white dark:bg-[#1D1D1D]">
                <Header />

                <main className="px-4 py-6 lg:px-10 lg:max-w-5xl lg:mx-auto">
                    <h1 className="text-2xl font-semibold mb-6 text-black dark:text-white">Início</h1>

                    <div className="lg:grid lg:grid-cols-2 lg:gap-10">
                        <section>
                            <div className="flex items-baseline justify-between">
                                <span className="text-xs font-medium text-black/50 dark:text-white/50 uppercase tracking-wide">Salas</span>
                                <span className="text-xs text-black/50 dark:text-white/50">{rooms.length}</span>
                            </div>
                            <h2 className="text-lg font-semibold mb-3 text-black dark:text-white">Salas recentes</h2>

                            <div className="flex flex-col gap-3">
                                <Rooms rooms={rooms} />
                                <AddRoomButton />
                            </div>
                        </section>

                        <section className="mt-8 lg:mt-0 flex flex-col justify-between">
                            <div>
                                <span className="text-xs font-medium text-black/50 dark:text-white/50 uppercase tracking-wide">Agenda</span>
                                <h2 className="text-lg font-semibold mb-3 text-black dark:text-white">Próximos eventos</h2>

                                <div className="flex flex-col gap-3">
                                    {tasks.map((task) => (
                                        <div
                                            key={task.title}
                                            className="flex items-center gap-3 bg-[#E2E2E2] dark:bg-[#303030] rounded-xl p-3"
                                        >
                                            <Image src={"/Task.svg"} width={24} height={24} alt="" className="dark:invert shrink-0"></Image>
                                            <span className="flex-1 font-medium text-black dark:text-white">{task.title}</span>
                                            <span className="text-sm text-black/50 dark:text-white/50">{task.date}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button className="mt-4 self-end bg-teal-400 text-white rounded-full pl-5 pr-4 py-3 flex items-center gap-1 font-semibold shadow-lg hover:scale-105 duration-200 cursor-pointer">
                                Calendário
                                <Image src={"/ChevronRight.svg"} width={18} height={18} alt="" className="invert"></Image>
                            </button>
                        </section>
                    </div>
                </main>

                <DashboardMenu />
            </div>
        )
    }
}

