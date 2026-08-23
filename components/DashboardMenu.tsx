'use client'
import Image from "next/image"
import { signOut } from "next-auth/react"
import type { Session } from "next-auth"

type DashboardMenuProps = {
    isOpen: boolean
    onClose: () => void
    session: Session | null
}

export default function DashboardMenu({ isOpen, onClose, session }: DashboardMenuProps) {
    return (
        <div className={`fixed inset-0 z-50 ${isOpen ? "" : "pointer-events-none"}`}>
            <div
                className={`absolute inset-0 bg-black/30 transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0"}`}
                onClick={onClose}
            ></div>

            <div
                className={`absolute right-0 top-0 h-full w-72 lg:w-80 bg-white dark:bg-[#1D1D1D] flex flex-col p-5 transition-transform duration-300 ${isOpen ? "translate-x-0" : "translate-x-full"}`}
            >
                <div className="flex items-center justify-between mb-8">
                    <span className="font-semibold text-black/50 dark:text-white/50 tracking-wide">MENU</span>
                    <button onClick={onClose} aria-label="Fechar menu" className="cursor-pointer">
                        <Image src={"/Close.svg"} width={20} height={20} alt="" className="dark:invert"></Image>
                    </button>
                </div>

                <button
                    className="flex items-center gap-4 py-3 text-left hover:scale-105 duration-200 cursor-pointer origin-left"
                    onClick={() => document.documentElement.classList.toggle("dark")}
                >
                    <Image src={"/Theme.svg"} width={22} height={22} alt="" className="dark:invert"></Image>
                    <span className="text-black dark:text-white">Alternar tema</span>
                </button>

                <button className="flex items-center gap-4 py-3 text-left hover:scale-105 duration-200 cursor-pointer origin-left">
                    <Image src={"/Settings.svg"} width={22} height={22} alt="" className="dark:invert"></Image>
                    <span className="text-black dark:text-white">Configurações</span>
                </button>

                <div className="h-px bg-black/10 dark:bg-white/10 my-3"></div>

                <button
                    className="flex items-center gap-4 py-3 text-left hover:scale-105 duration-200 cursor-pointer origin-left"
                    onClick={() => signOut({ callbackUrl: "/login" })}
                >
                    <Image src={"/Logout.svg"} width={22} height={22} alt=""></Image>
                    <span className="text-[#FF005E]">Sair</span>
                </button>

                {session?.user ? (
                    <div className="mt-auto flex items-center gap-3 pt-5 border-t border-black/10 dark:border-white/10">
                        <div className="w-10 h-10 rounded-full bg-black/10 dark:bg-white/10 shrink-0 overflow-hidden flex items-center justify-center">
                            {session.user.image ? (
                                <img src={session.user.image} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-sm font-medium text-black dark:text-white">{session.user.name?.[0] ?? "?"}</span>
                            )}
                        </div>
                        <div className="overflow-hidden">
                            <p className="font-medium truncate text-black dark:text-white">{session.user.name}</p>
                            <p className="text-sm text-black/50 dark:text-white/50 truncate">{session.user.email}</p>
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    )
}
