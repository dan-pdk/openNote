'use client'
import Image from "next/image"
import { useState } from "react"
import { useSession } from "next-auth/react"
import DashboardMenu from "@/components/DashboardMenu"

const rooms = ["Sala 1", "Sala 2"]

const tasks = [
    { title: "Tarefa 1", date: "28/03" },
    { title: "Tarefa 2", date: "02/04" },
    { title: "Tarefa 3", date: "05/05" },
]

export default function Page() {
    const { data: session } = useSession()
    const [menuOpen, setMenuOpen] = useState(false)

    return (
        <div className="min-h-screen bg-white dark:bg-[#1D1D1D]">
            <header className="flex items-center justify-between px-4 py-4 lg:px-10">
                <div className="w-32 lg:w-44">
                    <Image src={"/LogoDesktopLight.svg"} width={180} height={38} alt="openNote" className="dark:hidden"></Image>
                    <Image src={"/LogoDesktop.svg"} width={180} height={38} alt="openNote" className="hidden dark:block"></Image>
                </div>
                <div className="flex items-center gap-6 lg:gap-8">
                    <button aria-label="Buscar" className="cursor-pointer">
                        <Image src={"/Search.svg"} width={24} height={24} alt="" className="dark:invert"></Image>
                    </button>
                    <button aria-label="Adicionar" className="cursor-pointer">
                        <Image src={"/Plus.svg"} width={24} height={24} alt="" className="dark:invert"></Image>
                    </button>
                    <button aria-label="Abrir menu" className="cursor-pointer" onClick={() => setMenuOpen(true)}>
                        <Image src={"/Menu.svg"} width={24} height={24} alt="" className="dark:invert"></Image>
                    </button>
                </div>
            </header>

            <div className="h-px bg-black/15 dark:bg-white/15 mx-4 lg:mx-10"></div>

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
                            {rooms.map((room) => (
                                <button
                                    key={room}
                                    className="flex items-center gap-3 bg-[#E2E2E2] dark:bg-[#303030] rounded-xl p-3 text-left hover:scale-[1.02] duration-200 cursor-pointer"
                                >
                                    <div className="w-10 h-10 rounded-full bg-black/10 dark:bg-white/15 flex items-center justify-center font-medium text-black dark:text-white shrink-0">
                                        {room.split(" ")[1]}
                                    </div>
                                    <span className="flex-1 font-medium text-black dark:text-white">{room}</span>
                                    <Image src={"/ChevronRight.svg"} width={20} height={20} alt="" className="dark:invert"></Image>
                                </button>
                            ))}

                            <button className="bg-[#E2E2E2] dark:bg-[#303030] rounded-xl p-3 text-center text-black/60 dark:text-white/60 hover:scale-[1.02] duration-200 cursor-pointer">
                                + Adicionar Sala
                            </button>
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

            <DashboardMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} session={session} />
        </div>
    )
}