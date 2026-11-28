'use client'

import AddRoomForm from '@/components/AddRoomForm'
import DeleteAccountModal from '@/components/DeleteAccountModal'
import SettingsPopup, { MouseAnchorPosition } from '@/components/SettingsPopup'
import { FolderKanban, PlusCircle, Trash2 } from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'
import { useTheme } from 'next-themes'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { MouseEvent, useCallback, useEffect, useState } from 'react'

export default function DashboardMenu() {
    const { resolvedTheme, setTheme } = useTheme()
    const searchParams = useSearchParams()
    const router = useRouter()
    const pathname = usePathname()
    const { data: session } = useSession()

    const isOpen = searchParams.get('isMenuOpen') === 'true'
    const [isAddRoomModalOpen, setIsAddRoomModalOpen] = useState(false)
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)
    const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] = useState(false)
    const [settingsAnchor, setSettingsAnchor] = useState<MouseAnchorPosition>(null)

    const onClose = useCallback(() => {
        setIsSettingsOpen(false)
        const nextParams = new URLSearchParams(searchParams.toString())
        nextParams.delete('isMenuOpen')
        nextParams.delete('openSettings')
        const queryString = nextParams.toString()
        router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
            scroll: false,
        })
    }, [pathname, router, searchParams])

    useEffect(() => {
        if (searchParams.get('openSettings') === 'true') {
            setSettingsAnchor(null)
            setIsSettingsOpen(true)
            const nextParams = new URLSearchParams(searchParams.toString())
            nextParams.delete('openSettings')
            const queryString = nextParams.toString()
            router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
                scroll: false,
            })
        }
    }, [pathname, router, searchParams])

    useEffect(() => {
        if (!isOpen) {
            return
        }

        function handleKeyDown(event: KeyboardEvent) {
            if (
                event.key === 'Escape' &&
                !isAddRoomModalOpen &&
                !isSettingsOpen &&
                !isDeleteAccountModalOpen
            ) {
                onClose()
            }
        }

        document.addEventListener('keydown', handleKeyDown)
        return () => {
            document.removeEventListener('keydown', handleKeyDown)
        }
    }, [isOpen, isAddRoomModalOpen, isSettingsOpen, isDeleteAccountModalOpen, onClose])

    function handleOpenAddRoomModal() {
        onClose()
        setIsAddRoomModalOpen(true)
    }

    function handleOpenDeleteAccountModal() {
        onClose()
        setIsDeleteAccountModalOpen(true)
    }

    function handleOpenSettingsPopup(event: MouseEvent<HTMLButtonElement>) {
        if (isSettingsOpen) {
            setIsSettingsOpen(false)
            return
        }

        if (event.clientX > 0 || event.clientY > 0) {
            setSettingsAnchor({ x: event.clientX, y: event.clientY })
        } else {
            const rect = event.currentTarget.getBoundingClientRect()
            setSettingsAnchor({ x: rect.left, y: rect.top })
        }
        setIsSettingsOpen(true)
    }

    return (
        <>
            <div className={`fixed inset-0 z-50 ${isOpen ? '' : 'pointer-events-none'}`}>
                <div
                    className={`absolute inset-0 bg-black/30 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
                    onClick={() => {
                        if (isSettingsOpen) {
                            setIsSettingsOpen(false)
                            return
                        }
                        onClose()
                    }}
                ></div>

                <div
                    className={`absolute right-0 top-0 h-full w-72 lg:w-80 bg-white dark:bg-[#1D1D1D] flex flex-col p-5 transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
                >
                    <div className="flex items-center justify-between mb-6">
                        <span className="font-semibold text-black/50 dark:text-white/50 tracking-wide">MENU</span>
                        <button type="button" onClick={onClose} aria-label="Fechar menu" className="cursor-pointer">
                            <Image src="/Close.svg" width={20} height={20} alt="" className="dark:invert"></Image>
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={handleOpenAddRoomModal}
                        className="flex items-center gap-4 py-3 text-left hover:scale-105 duration-200 cursor-pointer origin-left"
                    >
                        <PlusCircle className="w-5.5 h-5.5 text-teal-600 dark:text-teal-400 shrink-0" />
                        <span className="text-black dark:text-white font-medium">Criar sala</span>
                    </button>

                    <Link
                        href="/rooms"
                        onClick={onClose}
                        className="flex items-center gap-4 py-3 text-left hover:scale-105 duration-200 origin-left"
                    >
                        <FolderKanban className="w-5.5 h-5.5 text-black dark:text-white shrink-0" />
                        <span className="text-black dark:text-white">Ver salas</span>
                    </Link>

                    <div className="h-px bg-black/10 dark:bg-white/10 my-2"></div>

                    <button
                        type="button"
                        className="flex items-center gap-4 py-3 text-left hover:scale-105 duration-200 cursor-pointer origin-left"
                        onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                    >
                        <Image src="/Theme.svg" width={22} height={22} alt="" className="dark:invert"></Image>
                        <span className="text-black dark:text-white">Alternar tema</span>
                    </button>

                    <button
                        type="button"
                        data-settings-trigger="true"
                        onClick={handleOpenSettingsPopup}
                        className="flex items-center gap-4 py-3 text-left hover:scale-105 duration-200 cursor-pointer origin-left"
                    >
                        <Image src="/Settings.svg" width={22} height={22} alt="" className="dark:invert"></Image>
                        <span className="text-black dark:text-white">Configurações</span>
                    </button>

                    <button
                        type="button"
                        className="flex items-center gap-4 py-3 text-left hover:scale-105 duration-200 cursor-pointer origin-left"
                        onClick={() => signOut({ callbackUrl: '/login' })}
                    >
                        <Image src="/Logout.svg" width={22} height={22} alt=""></Image>
                        <span className="text-[#FF005E]">Sair</span>
                    </button>

                    <button
                        type="button"
                        className="flex items-center gap-4 py-3 text-left hover:scale-105 duration-200 cursor-pointer origin-left"
                        onClick={handleOpenDeleteAccountModal}
                    >
                        <Trash2 className="w-5.5 h-5.5 text-[#E60000] shrink-0" />
                        <span className="text-[#E60000]">Deletar conta</span>
                    </button>

                    {session?.user ? (
                        <Link
                            href="/profile"
                            onClick={onClose}
                            className="mt-auto flex items-center gap-3 pt-5 hover:opacity-80 transition-opacity"
                        >
                            <div className="w-10 h-10 rounded-full bg-black/10 dark:bg-white/10 shrink-0 overflow-hidden flex items-center justify-center">
                                {session.user.image ? (
                                    <Image
                                        src={session.user.image}
                                        loading="eager"
                                        alt=""
                                        unoptimized={session.user.image.startsWith('/uploads/')}
                                        className="w-full h-full object-cover"
                                        width={100}
                                        height={100}
                                    />
                                ) : (
                                    <span className="text-sm font-medium text-black dark:text-white">
                                        {session.user.name?.[0] ?? '?'}
                                    </span>
                                )}
                            </div>
                            <div className="overflow-hidden">
                                <p className="font-medium truncate text-black dark:text-white">{session.user.name}</p>
                                <p className="text-sm text-black/50 dark:text-white/50 truncate">{session.user.email}</p>
                            </div>
                        </Link>
                    ) : null}
                </div>
            </div>

            <AddRoomForm visible={isAddRoomModalOpen} closeModal={() => setIsAddRoomModalOpen(false)} />

            <SettingsPopup
                isOpen={isSettingsOpen}
                anchorPosition={settingsAnchor}
                onClose={() => setIsSettingsOpen(false)}
            />

            <DeleteAccountModal
                isOpen={isDeleteAccountModalOpen}
                onClose={() => setIsDeleteAccountModalOpen(false)}
            />
        </>
    )
}