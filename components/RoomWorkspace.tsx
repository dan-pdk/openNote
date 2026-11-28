"use client";

import Calendar, { CalendarDateJumpRequest } from "@/components/Calendar";
import ChatModal from "@/components/ChatModal";
import RoomMembersPanel, {
    RoomMemberItem,
} from "@/components/RoomMembersPanel";
import RoomUpcomingTasksPanel from "@/components/RoomUpcomingTasksPanel";
import { ChatTarget } from "@/lib/chat";
import { RoomTaskItem } from "@/lib/tasks";
import { ArrowLeft, Crown, Lock, LockOpen, MessageSquare } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type RoomWorkspaceProps = {
    roomId: string;
    roomName: string;
    roomIconUrl: string | null;
    roomType: "livre" | "restrita";
    leaderUsername: string;
    tasks: RoomTaskItem[];
    members: RoomMemberItem[];
    currentUserId: string;
    currentUserName: string;
    isRoomLeader: boolean;
    canCreateTasks: boolean;
    canSendMessages: boolean;
};

export default function RoomWorkspace({
    roomId,
    roomName,
    roomIconUrl,
    roomType,
    leaderUsername,
    tasks,
    members,
    currentUserId,
    currentUserName,
    isRoomLeader,
    canCreateTasks,
    canSendMessages,
}: RoomWorkspaceProps) {
    const router = useRouter();
    const [selectedDateString, setSelectedDateString] = useState<string | null>(
        null
    );
    const [navigateToDateRequest, setNavigateToDateRequest] =
        useState<CalendarDateJumpRequest | null>(null);
    const [activeChatTarget, setActiveChatTarget] = useState<ChatTarget | null>(
        null
    );
    const [locallyReadTaskIds, setLocallyReadTaskIds] = useState<string[]>([]);

    const isRestrictedRoom = roomType === "restrita";

    const resolvedTasks = useMemo(() => {
        if (locallyReadTaskIds.length === 0) {
            return tasks;
        }
        const readSet = new Set(locallyReadTaskIds);
        return tasks.map((task) =>
            readSet.has(task.id) ? { ...task, hasUnreadMessages: false } : task
        );
    }, [tasks, locallyReadTaskIds]);

    function handleSelectUpcomingTaskDate(targetDateString: string) {
        setNavigateToDateRequest((previous) => ({
            dateString: targetDateString,
            nonce: (previous?.nonce ?? 0) + 1,
        }));
        setSelectedDateString(targetDateString);
    }

    function handleOpenTaskChat(task: RoomTaskItem) {
        setLocallyReadTaskIds((previous) =>
            previous.includes(task.id) ? previous : [...previous, task.id]
        );
        setActiveChatTarget({
            type: "task",
            roomId,
            taskId: task.id,
            title: task.nome,
            color: task.cor,
        });
    }

    function handleOpenRoomChat() {
        setActiveChatTarget({
            type: "room",
            roomId,
            title: "Chat da Sala",
        });
    }

    function handleCloseChatModal() {
        const wasTaskChat = activeChatTarget?.type === "task";
        setActiveChatTarget(null);
        if (wasTaskChat) {
            router.refresh();
        }
    }

    return (
        <>
            <div>
                <Link
                    href="/rooms"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white transition-colors mb-4"
                >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Voltar</span>
                </Link>

                <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-4 sm:gap-5 min-w-0">
                        {!roomIconUrl ? (
                            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#E2E2E2] dark:bg-[#303030] flex items-center justify-center text-3xl sm:text-4xl font-bold text-black dark:text-white shrink-0 shadow-sm">
                                {roomName.charAt(0).toUpperCase()}
                            </div>
                        ) : (
                            <Image
                                width={192}
                                height={192}
                                quality={95}
                                src={roomIconUrl}
                                alt={roomName}
                                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover shrink-0 shadow-sm"
                            />
                        )}

                        <div className="flex flex-col gap-1 min-w-0">
                            <h1 className="text-2xl sm:text-3xl font-bold text-black dark:text-white truncate">
                                {roomName}
                            </h1>
                            <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-black/55 dark:text-white/55">
                                {isRoomLeader && (
                                    <Crown
                                        strokeWidth={1.75}
                                        className="w-3.5 h-3.5 text-black/55 dark:text-white/55"
                                    />
                                )}
                                <span>
                                    {isRoomLeader
                                        ? "Você é o líder desta sala"
                                        : `Líder: ${leaderUsername}`}
                                </span>
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5 flex-wrap shrink-0">
                        <button
                            type="button"
                            onClick={handleOpenRoomChat}
                            className="px-3.5 py-1.5 text-xs font-semibold inline-flex items-center gap-1.5 rounded-full bg-teal-500/15 text-teal-700 dark:bg-teal-400/20 dark:text-teal-300 hover:bg-teal-500/25 dark:hover:bg-teal-400/30 transition-colors cursor-pointer shrink-0"
                        >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Chat da Sala</span>
                        </button>

                        <span
                            title={
                                isRestrictedRoom ? "Sala restrita" : "Sala livre"
                            }
                            className={`px-3.5 py-1.5 text-xs font-semibold flex items-center gap-1.5 rounded-full shrink-0 ${
                                isRestrictedRoom
                                    ? "bg-[#E60000]/15 text-[#E60000] dark:bg-[#E60000]/20 dark:text-red-400"
                                    : "bg-[#139C1A]/15 text-[#139C1A] dark:bg-[#139C1A]/20 dark:text-green-400"
                            }`}
                        >
                            {isRestrictedRoom ? (
                                <Lock className="w-3.5 h-3.5" />
                            ) : (
                                <LockOpen className="w-3.5 h-3.5" />
                            )}
                            <span>
                                {isRestrictedRoom ? "Restrita" : "Livre"}
                            </span>
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-8 items-start">
                <div className="w-full flex justify-center">
                    <Calendar
                        roomId={roomId}
                        tasks={resolvedTasks}
                        currentUserId={currentUserId}
                        currentUserName={currentUserName}
                        isRoomLeader={isRoomLeader}
                        canCreateTasks={canCreateTasks}
                        selectedDateString={selectedDateString}
                        onSelectDateString={setSelectedDateString}
                        onOpenTaskChat={handleOpenTaskChat}
                        navigateToDateRequest={navigateToDateRequest}
                    />
                </div>

                <div className="flex flex-col gap-6">
                    <RoomMembersPanel
                        roomId={roomId}
                        roomType={roomType}
                        members={members}
                        currentUserId={currentUserId}
                        isRoomLeader={isRoomLeader}
                    />

                    <RoomUpcomingTasksPanel
                        tasks={resolvedTasks}
                        onSelectTaskDate={handleSelectUpcomingTaskDate}
                    />
                </div>
            </div>

            <ChatModal
                target={activeChatTarget}
                currentUserId={currentUserId}
                initialCanSendMessages={canSendMessages}
                initialIsRoomLeader={isRoomLeader}
                onClose={handleCloseChatModal}
            />
        </>
    );
}