'use client'

import deleteRoom from "@/actions/deleteRoom";
import leaveRoom from "@/actions/leaveRoom";
import AddRoomButton from "@/components/AddRoomModal";
import { ArrowLeft, Check, Copy, Lock, LockOpen, LogOut, Search, SlidersHorizontal, Trash2, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

type RoomType = "livre" | "restrita";
type RoomTypeFilter = "todas" | RoomType;

type Room = {
    nome: string;
    id: string;
    icone_url: string | null;
    tipo: RoomType;
    isLeader: boolean;
};

export default function RoomsRoomsPage({ rooms }: { rooms: Array<Room> }) {
    const router = useRouter();
    const filterMenuRef = useRef<HTMLDivElement | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedType, setSelectedType] = useState<RoomTypeFilter>("todas");
    const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
    const [roomPendingDeletion, setRoomPendingDeletion] = useState<Room | null>(null);
    const [isDeletingRoom, setIsDeletingRoom] = useState(false);
    const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);
    const [roomPendingLeave, setRoomPendingLeave] = useState<Room | null>(null);
    const [isLeavingRoom, setIsLeavingRoom] = useState(false);
    const [leaveErrorMessage, setLeaveErrorMessage] = useState<string | null>(null);
    const [copiedRoomIdentifier, setCopiedRoomIdentifier] = useState<string | null>(null);

    const safeRooms = useMemo(() => (Array.isArray(rooms) ? rooms : []), [rooms]);

    const roomCounts = useMemo(() => {
        let freeCount = 0;
        let restrictedCount = 0;

        for (const room of safeRooms) {
            if (room.tipo === "livre") {
                freeCount += 1;
            } else {
                restrictedCount += 1;
            }
        }

        return {
            todas: safeRooms.length,
            livre: freeCount,
            restrita: restrictedCount,
        };
    }, [safeRooms]);

    const filteredRooms = useMemo(() => {
        const normalizedQuery = searchQuery.trim().toLowerCase();

        return safeRooms.filter((room) => {
            const matchesType = selectedType === "todas" || room.tipo === selectedType;
            const matchesName = normalizedQuery.length === 0 || room.nome.toLowerCase().includes(normalizedQuery);
            return matchesType && matchesName;
        });
    }, [safeRooms, searchQuery, selectedType]);

    useEffect(() => {
        if (!isFilterMenuOpen) {
            return;
        }

        function handleClickOutside(event: MouseEvent) {
            if (filterMenuRef.current && !filterMenuRef.current.contains(event.target as Node)) {
                setIsFilterMenuOpen(false);
            }
        }

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") {
                setIsFilterMenuOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isFilterMenuOpen]);

    function handleClearFilters() {
        setSearchQuery("");
        setSelectedType("todas");
    }

    function handleSelectFilterType(type: RoomTypeFilter) {
        setSelectedType(type);
        setIsFilterMenuOpen(false);
    }

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
        const roomInviteLink = `${window.location.origin}/rooms/${roomIdentifier}`;
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

    const hasActiveFilters = searchQuery.trim().length > 0 || selectedType !== "todas";

    return (
        <>
            <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <Link
                            href="/dashboard"
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white transition-colors mb-2"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            <span>Voltar ao início</span>
                        </Link>
                        <div className="flex items-baseline gap-3">
                            <h1 className="text-2xl font-semibold text-black dark:text-white">Salas</h1>
                            <span className="text-xs font-medium text-black/50 dark:text-white/50">
                                {filteredRooms.length} de {safeRooms.length}
                            </span>
                        </div>
                        <p className="text-sm text-black/60 dark:text-white/60 mt-1">
                            Gerencie suas salas, filtre por tipo ou busque pelo nome.
                        </p>
                    </div>

                    <div className="flex flex-col sm:shrink-0">
                        <AddRoomButton />
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                        <Search className="w-4 h-4 text-black/50 dark:text-white/50 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(event) => setSearchQuery(event.target.value)}
                            placeholder="Buscar sala por nome..."
                            aria-label="Buscar sala por nome"
                            className="w-full bg-[#E2E2E2] dark:bg-[#303030] rounded-xl py-3 pl-10 pr-10 text-sm text-black dark:text-white placeholder:text-black/50 dark:placeholder:text-white/65 focus:outline-none focus:ring-2 focus:ring-teal-400"
                        />
                        {searchQuery.length > 0 && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery("")}
                                aria-label="Limpar busca"
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-black/50 hover:text-black hover:bg-black/10 dark:text-white/50 dark:hover:text-white dark:hover:bg-white/10 transition-colors cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    <div ref={filterMenuRef} className="relative shrink-0">
                        <button
                            type="button"
                            onClick={() => setIsFilterMenuOpen((previous) => !previous)}
                            aria-expanded={isFilterMenuOpen}
                            aria-haspopup="menu"
                            aria-label="Filtrar por tipo de sala"
                            title="Filtrar por tipo de sala"
                            className={`relative p-3 rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center ${
                                selectedType === "livre"
                                    ? "bg-[#139C1A]/20 text-[#139C1A] dark:bg-[#139C1A]/25 dark:text-green-400 ring-1 ring-[#139C1A]/40"
                                    : selectedType === "restrita"
                                      ? "bg-[#E60000]/20 text-[#E60000] dark:bg-[#E60000]/25 dark:text-red-400 ring-1 ring-[#E60000]/40"
                                      : "bg-[#E2E2E2] dark:bg-[#303030] text-black/70 dark:text-white/70 hover:scale-[1.02]"
                            }`}
                        >
                            <SlidersHorizontal className="w-5 h-5" />
                            {selectedType !== "todas" && (
                                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-current" />
                            )}
                        </button>

                        {isFilterMenuOpen && (
                            <div
                                role="menu"
                                aria-label="Opções de filtro por tipo de sala"
                                className="absolute right-0 mt-2 w-56 rounded-xl bg-white dark:bg-[#1D1D1D] border border-black/10 dark:border-white/10 shadow-xl p-1.5 z-20 flex flex-col gap-1"
                            >
                                <button
                                    type="button"
                                    role="menuitemradio"
                                    aria-checked={selectedType === "todas"}
                                    onClick={() => handleSelectFilterType("todas")}
                                    className={`w-full px-3 py-2.5 rounded-lg text-sm font-medium flex items-center justify-between transition-colors cursor-pointer ${
                                        selectedType === "todas"
                                            ? "bg-teal-400/20 text-black dark:text-white"
                                            : "text-black/75 dark:text-white/75 hover:bg-black/5 dark:hover:bg-white/10"
                                    }`}
                                >
                                    <span className="flex items-center gap-2">
                                        <span>Todas</span>
                                        <span className="text-xs opacity-65">({roomCounts.todas})</span>
                                    </span>
                                    {selectedType === "todas" && <Check className="w-4 h-4 text-teal-500" />}
                                </button>

                                <button
                                    type="button"
                                    role="menuitemradio"
                                    aria-checked={selectedType === "livre"}
                                    onClick={() => handleSelectFilterType("livre")}
                                    className={`w-full px-3 py-2.5 rounded-lg text-sm font-medium flex items-center justify-between transition-colors cursor-pointer ${
                                        selectedType === "livre"
                                            ? "bg-[#139C1A]/15 text-[#139C1A] dark:bg-[#139C1A]/20 dark:text-green-400"
                                            : "text-black/75 dark:text-white/75 hover:bg-black/5 dark:hover:bg-white/10"
                                    }`}
                                >
                                    <span className="flex items-center gap-2">
                                        <LockOpen className="w-4 h-4" />
                                        <span>Livre</span>
                                        <span className="text-xs opacity-65">({roomCounts.livre})</span>
                                    </span>
                                    {selectedType === "livre" && <Check className="w-4 h-4" />}
                                </button>

                                <button
                                    type="button"
                                    role="menuitemradio"
                                    aria-checked={selectedType === "restrita"}
                                    onClick={() => handleSelectFilterType("restrita")}
                                    className={`w-full px-3 py-2.5 rounded-lg text-sm font-medium flex items-center justify-between transition-colors cursor-pointer ${
                                        selectedType === "restrita"
                                            ? "bg-[#E60000]/15 text-[#E60000] dark:bg-[#E60000]/20 dark:text-red-400"
                                            : "text-black/75 dark:text-white/75 hover:bg-black/5 dark:hover:bg-white/10"
                                    }`}
                                >
                                    <span className="flex items-center gap-2">
                                        <Lock className="w-4 h-4" />
                                        <span>Restrita</span>
                                        <span className="text-xs opacity-65">({roomCounts.restrita})</span>
                                    </span>
                                    {selectedType === "restrita" && <Check className="w-4 h-4" />}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {filteredRooms.length > 0 ? (
                    <div className="flex flex-col gap-3">
                        {filteredRooms.map((room: Room) => {
                            const isRoomLinkCopied = copiedRoomIdentifier === room.id;
                            const isRestricted = room.tipo === "restrita";

                            return (
                                <div
                                    key={room.id}
                                    className="flex items-center gap-3 bg-[#E2E2E2] dark:bg-[#303030] rounded-xl p-3 text-left hover:scale-[1.01] duration-200"
                                >
                                    <Link
                                        href={`/rooms/${room.id}`}
                                        className="flex flex-1 items-center gap-3 min-w-0 cursor-pointer"
                                    >
                                        {!room.icone_url ? (
                                            <div className="w-10 h-10 rounded-full bg-black/10 dark:bg-white/15 flex items-center justify-center font-medium text-black dark:text-white shrink-0">
                                                {room.nome.charAt(0).toUpperCase()}
                                            </div>
                                        ) : (
                                            <Image
                                                width={40}
                                                height={40}
                                                src={room.icone_url}
                                                className="w-10 h-10 rounded-full object-cover shrink-0"
                                                alt={room.nome}
                                            />
                                        )}

                                        <div className="flex flex-col min-w-0">
                                            <span className="font-medium text-black dark:text-white truncate">
                                                {room.nome}
                                            </span>
                                            <span className="text-xs text-black/50 dark:text-white/50">
                                                {room.isLeader ? "Líder" : "Membro"}
                                            </span>
                                        </div>
                                    </Link>

                                    <span
                                        title={isRestricted ? "Sala restrita" : "Sala livre"}
                                        aria-label={isRestricted ? "Restrita" : "Livre"}
                                        className={`px-2.5 py-1 text-xs font-medium flex items-center gap-1.5 rounded-full shrink-0 ${
                                            isRestricted
                                                ? "bg-[#E60000]/15 text-[#E60000] dark:bg-[#E60000]/20 dark:text-red-400"
                                                : "bg-[#139C1A]/15 text-[#139C1A] dark:bg-[#139C1A]/20 dark:text-green-400"
                                        }`}
                                    >
                                        {isRestricted ? <Lock className="w-3.5 h-3.5" /> : <LockOpen className="w-3.5 h-3.5" />}
                                        <span className="hidden sm:inline">{isRestricted ? "Restrita" : "Livre"}</span>
                                    </span>

                                    <button
                                        type="button"
                                        onClick={() => handleCopyRoomLink(room.id)}
                                        title={isRoomLinkCopied ? "Link copiado!" : "Copiar link da sala"}
                                        aria-label={`Copiar link da sala ${room.nome}`}
                                        className="p-1.5 rounded-lg text-black/60 hover:text-black hover:bg-black/10 dark:text-white/60 dark:hover:text-white dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0"
                                    >
                                        {isRoomLinkCopied ? (
                                            <Check className="w-4 h-4 text-[#139C1A] dark:text-green-400" />
                                        ) : (
                                            <Copy className="w-4 h-4" />
                                        )}
                                    </button>

                                    {room.isLeader ? (
                                        <button
                                            type="button"
                                            onClick={() => handleOpenDeletePrompt(room)}
                                            title="Deletar sala"
                                            aria-label={`Deletar sala ${room.nome}`}
                                            className="p-1.5 rounded-lg text-black/60 hover:text-[#E60000] hover:bg-[#E60000]/10 dark:text-white/60 dark:hover:text-red-400 dark:hover:bg-[#E60000]/20 transition-colors cursor-pointer shrink-0"
                                        >
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
                ) : (
                    <div className="bg-[#E2E2E2]/60 dark:bg-[#303030]/60 rounded-xl p-8 flex flex-col items-center justify-center text-center gap-3">
                        <p className="font-medium text-black dark:text-white">
                            {hasActiveFilters
                                ? "Nenhuma sala corresponde aos filtros aplicados"
                                : "Você ainda não participa de nenhuma sala"}
                        </p>
                        <p className="text-sm text-black/60 dark:text-white/60 max-w-md">
                            {hasActiveFilters
                                ? "Tente buscar por outro nome ou altere o filtro de tipo de sala."
                                : "Crie uma nova sala ou entre em uma existente usando o código UUID."}
                        </p>
                        {hasActiveFilters && (
                            <button
                                type="button"
                                onClick={handleClearFilters}
                                className="mt-1 px-4 py-2 rounded-xl bg-teal-400 text-black text-sm font-medium hover:scale-[1.02] duration-200 cursor-pointer"
                            >
                                Limpar filtros
                            </button>
                        )}
                    </div>
                )}
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
                            <button
                                type="button"
                                onClick={handleCancelDelete}
                                disabled={isDeletingRoom}
                                className="border-2 border-black/20 dark:border-white/20 px-4 py-2 rounded-lg text-sm font-medium text-black dark:text-white hover:scale-105 duration-200 cursor-pointer disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmDelete}
                                disabled={isDeletingRoom}
                                className="bg-[#E60000] px-4 py-2 rounded-lg text-sm font-medium text-white hover:scale-105 duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
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
