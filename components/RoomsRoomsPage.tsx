'use client'

import deleteRoom from "@/actions/deleteRoom";
import leaveRoom from "@/actions/leaveRoom";
import { Check, Copy, LogOut, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Room = {
    nome: string;
    id: string;
    icone_url: string | null;
    isLeader: boolean;
};

export default function RoomsRoomsPage({ rooms }: { rooms: Array<Room> }) {
    const router = useRouter();
    const [roomPendingDeletion, setRoomPendingDeletion] = useState<Room | null>(null);
    const [isDeletingRoom, setIsDeletingRoom] = useState(false);
    const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);
    const [roomPendingLeave, setRoomPendingLeave] = useState<Room | null>(null);
    const [isLeavingRoom, setIsLeavingRoom] = useState(false);
    const [leaveErrorMessage, setLeaveErrorMessage] = useState<string | null>(null);
    const [copiedRoomIdentifier, setCopiedRoomIdentifier] = useState<string | null>(null);

    function handleOpenDeletePrompt(room: Room) {
        setDeleteErrorMessage(null);
        setRoomPendingDeletion(room);
    }

    function handleCancelDelete() {
        if (isDeletingRoom) {
            return;
        }
        setDeleteErrorMessage(null);
        setRoomPendingDeletion(null);
    }

    async function handleConfirmDelete() {
        if (!roomPendingDeletion || isDeletingRoom) {
            return;
        }

        setIsDeletingRoom(true);
        setDeleteErrorMessage(null);

        const result = await deleteRoom(roomPendingDeletion.id);

        setIsDeletingRoom(false);

        if (result?.error) {
            setDeleteErrorMessage(result.error);
            return;
        }

        if (result?.success) {
            setRoomPendingDeletion(null);
            router.refresh();
        }
    }

    function handleOpenLeavePrompt(room: Room) {
        setLeaveErrorMessage(null);
        setRoomPendingLeave(room);
    }

    function handleCancelLeave() {
        if (isLeavingRoom) {
            return;
        }
        setLeaveErrorMessage(null);
        setRoomPendingLeave(null);
    }

    async function handleConfirmLeave() {
        if (!roomPendingLeave || isLeavingRoom) {
            return;
        }

        setIsLeavingRoom(true);
        setLeaveErrorMessage(null);

        const result = await leaveRoom(roomPendingLeave.id);

        setIsLeavingRoom(false);

        if (result?.error) {
            setLeaveErrorMessage(result.error);
            return;
        }

        if (result?.success) {
            setRoomPendingLeave(null);
            router.refresh();
        }
    }

    async function handleCopyRoomLink(roomIdentifier: string) {
        const roomInviteLink = `https://${window.location.host}/rooms/${roomIdentifier}`;
        try {
            await navigator.clipboard.writeText(roomInviteLink);
            setCopiedRoomIdentifier(roomIdentifier);
            setTimeout(() => {
                setCopiedRoomIdentifier((currentIdentifier) =>
                    currentIdentifier === roomIdentifier ? null : currentIdentifier
                );
            }, 2067);
        } catch (clipboardError) {
            console.error("Erro ao copiar link da sala. ", clipboardError);
        }
    }

    if (Array.isArray(rooms) && rooms.length > 0) {
        const orderedRooms = [...rooms].reverse();

        return (
            <>
                <div className="flex flex-col gap-3">
                    {orderedRooms.map((room: Room) => {
                        const isRoomLinkCopied = copiedRoomIdentifier === room.id;

                        return (
                            <div key={room.id}
                                className="flex items-center gap-3 bg-[#E2E2E2] dark:bg-[#303030] rounded-xl p-3 text-left hover:scale-[1.02] duration-200">
                                <Link
                                    href={`/rooms/${room.id}`}
                                    className="flex flex-1 items-center gap-3 min-w-0 cursor-pointer">
                                    {!room.icone_url ? (
                                        <div className="w-10 h-10 rounded-full bg-black/10 dark:bg-white/15 flex items-center justify-center font-medium text-black dark:text-white shrink-0">
                                            {room.nome.charAt(0).toUpperCase()}
                                        </div>
                                    ) : (
                                        <Image width={40} height={40} src={room.icone_url} className="w-10 h-10 rounded-full object-cover shrink-0" alt={room.nome} />
                                    )}

                                    <span className="flex-1 font-medium text-black dark:text-white truncate">{room.nome}</span>
                                </Link>

                                <button
                                    type="button"
                                    onClick={() => handleCopyRoomLink(room.id)}
                                    title={isRoomLinkCopied ? "Link copiado!" : "Copiar link da sala"}
                                    aria-label={`Copiar link da sala ${room.nome}`}
                                    className="p-1.5 rounded-lg text-black/60 hover:text-black hover:bg-black/10 dark:text-white/60 dark:hover:text-white dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0">
                                    {isRoomLinkCopied ? (
                                        <Check className="w-4 h-4 text-[#139C1A] dark:text-green-400" />
                                    ) : (
                                        <Copy className="w-4 h-4" />
                                    )}
                                </button>

                                {room.isLeader ? (
                                    <button
                                        type="button" onClick={() => handleOpenDeletePrompt(room)} title="Deletar sala" aria-label={`Deletar sala ${room.nome}`} className="p-1.5 rounded-lg text-black/60 hover:text-[#E60000] hover:bg-[#E60000]/10 dark:text-white/60 dark:hover:text-red-400 dark:hover:bg-[#E60000]/20 transition-colors cursor-pointer shrink-0">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => handleOpenLeavePrompt(room)}
                                        title="Sair da sala"
                                        aria-label={`Sair da sala ${room.nome}`}
                                        className="p-1.5 rounded-lg text-black/60 hover:text-[#E60000] hover:bg-[#E60000]/10 dark:text-white/60 dark:hover:text-red-400 dark:hover:bg-[#E60000]/20 transition-colors cursor-pointer shrink-0"
                                    >
                                        <LogOut className="w-4 h-4" />
                                    </button>
                                )}

                                <Link href={`/rooms/${room.id}`} aria-label={`Abrir sala ${room.nome}`} className="shrink-0 cursor-pointer">
                                    <Image src={"/ChevronRight.svg"} width={20} height={20} alt="" className="dark:invert" />
                                </Link>
                            </div>
                        );
                    })}
                </div>

                {roomPendingDeletion && (
                    <div
                        className="fixed inset-0 z-30 bg-black/40 flex items-center justify-center p-4"
                        onClick={(event) => {
                            if (event.target === event.currentTarget) {
                                handleCancelDelete();
                            }
                        }}
                    >
                        <div
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="delete-room-title"
                            className="bg-white dark:bg-[#1D1D1D] rounded-xl p-6 w-full max-w-sm shadow-xl flex flex-col gap-4 border border-black/10 dark:border-white/10"
                        >
                            <h2 id="delete-room-title" className="text-lg font-semibold text-black dark:text-white">
                                Deletar sala
                            </h2>
                            <p className="text-sm text-black/70 dark:text-white/70">
                                Tem certeza que deseja excluir a sala &ldquo;{roomPendingDeletion.nome}&rdquo;? Todas as tarefas, comentários e membros vinculados serão removidos permanentemente.
                            </p>
                            {deleteErrorMessage && (
                                <p role="alert" className="text-sm text-[#E60000] dark:text-red-400">
                                    {deleteErrorMessage}
                                </p>
                            )}
                            <div className="flex justify-end gap-3 mt-1">
                                <button type="button" onClick={handleCancelDelete}
                                    disabled={isDeletingRoom}
                                    className="border-2 border-black/20 dark:border-white/20 px-4 py-2 rounded-lg text-sm font-medium text-black dark:text-white hover:scale-105 duration-200 cursor-pointer disabled:opacity-50"
                                >
                                    Cancelar
                                </button>
                                <button type="button" onClick={handleConfirmDelete} disabled={isDeletingRoom} className="bg-[#E60000] px-4 py-2 rounded-lg text-sm font-medium text-white hover:scale-105 duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                                    {isDeletingRoom ? "Deletando..." : "Deletar"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {roomPendingLeave && (
                    <div
                        className="fixed inset-0 z-30 bg-black/40 flex items-center justify-center p-4"
                        onClick={(event) => {
                            if (event.target === event.currentTarget) {
                                handleCancelLeave();
                            }
                        }}
                    >
                        <div
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="leave-room-title"
                            className="bg-white dark:bg-[#1D1D1D] rounded-xl p-6 w-full max-w-sm shadow-xl flex flex-col gap-4 border border-black/10 dark:border-white/10"
                        >
                            <h2 id="leave-room-title" className="text-lg font-semibold text-black dark:text-white">
                                Sair da sala
                            </h2>
                            <p className="text-sm text-black/70 dark:text-white/70">
                                Tem certeza que deseja sair de &ldquo;{roomPendingLeave.nome}&rdquo;? Você poderá entrar novamente depois usando o UUID ou o link da sala.
                            </p>
                            {leaveErrorMessage && (
                                <p role="alert" className="text-sm text-[#E60000] dark:text-red-400">
                                    {leaveErrorMessage}
                                </p>
                            )}
                            <div className="flex justify-end gap-3 mt-1">
                                <button
                                    type="button"
                                    onClick={handleCancelLeave}
                                    disabled={isLeavingRoom}
                                    className="border-2 border-black/20 dark:border-white/20 px-4 py-2 rounded-lg text-sm font-medium text-black dark:text-white hover:scale-105 duration-200 cursor-pointer disabled:opacity-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    onClick={handleConfirmLeave}
                                    disabled={isLeavingRoom}
                                    className="bg-[#E60000] px-4 py-2 rounded-lg text-sm font-medium text-white hover:scale-105 duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLeavingRoom ? "Saindo..." : "Sair"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </>
        );
    }

    return (
        <p className="dark:text-white">Nada para ver aqui</p>
    );
}
