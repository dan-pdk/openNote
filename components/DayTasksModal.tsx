"use client";

import deleteTask from "@/actions/deleteTask";
import toggleTaskCompletion from "@/actions/toggleTaskCompletion";
import AddTaskForm from "@/components/AddTaskForm";
import { formatPortugueseDateHeading, RoomTaskItem } from "@/lib/tasks";
import {
    CheckCircle2,
    Circle,
    ExternalLink,
    MessageSquare,
    Pencil,
    Plus,
    Trash2,
    User,
    X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type DayTasksModalProps = {
    isOpen: boolean;
    selectedDateString: string;
    roomId: string;
    tasksForDay: RoomTaskItem[];
    currentUserId: string;
    currentUserName: string;
    isRoomLeader: boolean;
    canCreateTasks: boolean;
    onOpenTaskChat: (task: RoomTaskItem) => void;
    onClose: () => void;
};

export default function DayTasksModal({
    isOpen,
    selectedDateString,
    roomId,
    tasksForDay,
    currentUserId,
    currentUserName,
    isRoomLeader,
    canCreateTasks,
    onOpenTaskChat,
    onClose,
}: DayTasksModalProps) {
    const router = useRouter();
    const [isCreatingNewTask, setIsCreatingNewTask] = useState(false);
    const [editingTask, setEditingTask] = useState<RoomTaskItem | null>(null);
    const [taskIdPendingDelete, setTaskIdPendingDelete] = useState<string | null>(
        null
    );
    const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
    const [togglingTaskId, setTogglingTaskId] = useState<string | null>(null);
    const [actionErrorMessage, setActionErrorMessage] = useState<string | null>(
        null
    );

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape" && !deletingTaskId && !togglingTaskId) {
                onClose();
            }
        }

        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen, deletingTaskId, togglingTaskId, onClose]);

    if (!isOpen) {
        return null;
    }

    async function handleDeleteTask(targetTaskId: string) {
        if (deletingTaskId) {
            return;
        }

        setDeletingTaskId(targetTaskId);
        setActionErrorMessage(null);

        const deleteResult = await deleteTask(roomId, targetTaskId);

        setDeletingTaskId(null);

        if (deleteResult?.error) {
            setActionErrorMessage(deleteResult.error);
            return;
        }

        if (deleteResult?.success) {
            setTaskIdPendingDelete(null);
            router.refresh();
        }
    }

    async function handleToggleTask(targetTaskId: string) {
        if (togglingTaskId) {
            return;
        }

        setTogglingTaskId(targetTaskId);
        setActionErrorMessage(null);

        const toggleResult = await toggleTaskCompletion(roomId, targetTaskId);

        setTogglingTaskId(null);

        if (toggleResult?.error) {
            setActionErrorMessage(toggleResult.error);
            return;
        }

        if (toggleResult?.success) {
            router.refresh();
        }
    }

    const formattedDateHeading = formatPortugueseDateHeading(selectedDateString);
    const taskCountLabel =
        tasksForDay.length === 0
            ? ""
            : tasksForDay.length === 1
              ? "1 tarefa"
              : `${tasksForDay.length} tarefas`;

    const isFormActive =
        (isCreatingNewTask && canCreateTasks) || editingTask !== null;

    const modalTitle = editingTask
        ? "Editar Tarefa"
        : isCreatingNewTask
          ? "Nova Tarefa"
          : formattedDateHeading;

    const modalSubtitle = isFormActive ? formattedDateHeading : taskCountLabel;

    return (
        <div
            className="fixed inset-0 z-30 bg-black/40 flex items-center justify-center p-4"
            onClick={(event) => {
                if (event.target === event.currentTarget && !deletingTaskId) {
                    onClose();
                }
            }}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="day-tasks-modal-title"
                className="bg-white dark:bg-[#1D1D1D] rounded-xl w-full max-w-lg max-h-[90vh] shadow-xl flex flex-col overflow-hidden"
            >
                <div className="flex items-start justify-between gap-4 px-6 py-4">
                    <div className="flex flex-col min-w-0">
                        <h2
                            id="day-tasks-modal-title"
                            className="text-lg font-semibold text-black dark:text-white truncate"
                        >
                            {modalTitle}
                        </h2>
                        <span className="text-xs text-black/50 dark:text-white/50">
                            {modalSubtitle}
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Fechar modal"
                        className="p-1.5 rounded-lg text-black/60 hover:text-black hover:bg-black/10 dark:text-white/60 dark:hover:text-white dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="px-6 py-4 overflow-y-auto flex-1">
                    {editingTask ? (
                        <AddTaskForm
                            key={editingTask.id}
                            roomId={roomId}
                            initialDate={editingTask.dataEntrega}
                            currentUserName={currentUserName}
                            initialTask={editingTask}
                            onCancel={() => setEditingTask(null)}
                            onSuccess={() => setEditingTask(null)}
                        />
                    ) : isCreatingNewTask && canCreateTasks ? (
                        <AddTaskForm
                            roomId={roomId}
                            initialDate={selectedDateString}
                            currentUserName={currentUserName}
                            onCancel={() => setIsCreatingNewTask(false)}
                            onSuccess={() => setIsCreatingNewTask(false)}
                        />
                    ) : (
                        <div className="flex flex-col gap-3">
                            {actionErrorMessage && (
                                <p
                                    role="alert"
                                    className="text-sm text-[#E60000] dark:text-red-400"
                                >
                                    {actionErrorMessage}
                                </p>
                            )}

                            {tasksForDay.length > 0 ? (
                                tasksForDay.map((taskItem) => {
                                    const canManageTask =
                                        isRoomLeader ||
                                        (taskItem.criadorId !== null &&
                                            taskItem.criadorId === currentUserId);
                                    const isConfirmingDelete =
                                        taskIdPendingDelete === taskItem.id;
                                    const isDeletingThisTask =
                                        deletingTaskId === taskItem.id;
                                    const isTogglingThisTask =
                                        togglingTaskId === taskItem.id;

                                    return (
                                        <div
                                            key={taskItem.id}
                                            onClick={(event) => {
                                                const targetElement =
                                                    event.target as HTMLElement;
                                                if (
                                                    targetElement.closest(
                                                        "button, a"
                                                    )
                                                ) {
                                                    return;
                                                }
                                                onOpenTaskChat(taskItem);
                                            }}
                                            className="bg-[#E2E2E2] dark:bg-[#303030] hover:bg-[#DADADA] dark:hover:bg-[#383838] transition-colors rounded-xl p-4 flex flex-col gap-2.5 cursor-pointer"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                                    <span
                                                        className="w-3 h-3 rounded-full shrink-0"
                                                        style={{
                                                            backgroundColor:
                                                                taskItem.cor,
                                                        }}
                                                    />

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleToggleTask(
                                                                taskItem.id
                                                            )
                                                        }
                                                        disabled={
                                                            isTogglingThisTask
                                                        }
                                                        title={
                                                            taskItem.concluida
                                                                ? "Marcar como pendente"
                                                                : "Marcar como concluída"
                                                        }
                                                        aria-label={
                                                            taskItem.concluida
                                                                ? `Marcar ${taskItem.nome} como pendente`
                                                                : `Marcar ${taskItem.nome} como concluída`
                                                        }
                                                        className="text-black/60 hover:text-teal-600 dark:text-white/60 dark:hover:text-teal-400 transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                                                    >
                                                        {taskItem.concluida ? (
                                                            <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                                                        ) : (
                                                            <Circle className="w-4 h-4" />
                                                        )}
                                                    </button>

                                                    <h3
                                                        className={`font-semibold text-black dark:text-white wrap-break-word ${
                                                            taskItem.concluida
                                                                ? "line-through opacity-60"
                                                                : ""
                                                        }`}
                                                    >
                                                        {taskItem.nome}
                                                    </h3>
                                                </div>

                                                <div className="flex items-center gap-1 shrink-0">
                                                    {canManageTask ? (
                                                        isConfirmingDelete ? (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        setTaskIdPendingDelete(
                                                                            null
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        isDeletingThisTask
                                                                    }
                                                                    className="px-2 py-1 rounded-md text-xs font-medium text-black/70 dark:text-white/70 hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer"
                                                                >
                                                                    Cancelar
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        handleDeleteTask(
                                                                            taskItem.id
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        isDeletingThisTask
                                                                    }
                                                                    className="px-2.5 py-1 rounded-md text-xs font-medium bg-[#E60000] text-white hover:opacity-90 cursor-pointer disabled:opacity-50"
                                                                >
                                                                    {isDeletingThisTask
                                                                        ? "Removendo..."
                                                                        : "Remover"}
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        onOpenTaskChat(
                                                                            taskItem
                                                                        )
                                                                    }
                                                                    title="Abrir chat da tarefa"
                                                                    aria-label={`Abrir chat da tarefa ${taskItem.nome}`}
                                                                    className="relative p-1.5 rounded-lg text-black/60 hover:text-teal-600 hover:bg-teal-500/10 dark:text-white/60 dark:hover:text-teal-400 dark:hover:bg-teal-500/20 transition-colors cursor-pointer"
                                                                >
                                                                    <MessageSquare className="w-4 h-4" />
                                                                    {taskItem.hasUnreadMessages && (
                                                                        <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#E60000]" />
                                                                    )}
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setActionErrorMessage(
                                                                            null
                                                                        );
                                                                        setTaskIdPendingDelete(
                                                                            null
                                                                        );
                                                                        setEditingTask(
                                                                            taskItem
                                                                        );
                                                                    }}
                                                                    title="Editar tarefa"
                                                                    aria-label={`Editar tarefa ${taskItem.nome}`}
                                                                    className="p-1.5 rounded-lg text-black/60 hover:text-teal-600 hover:bg-teal-500/10 dark:text-white/60 dark:hover:text-teal-400 dark:hover:bg-teal-500/20 transition-colors cursor-pointer"
                                                                >
                                                                    <Pencil className="w-4 h-4" />
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setActionErrorMessage(
                                                                            null
                                                                        );
                                                                        setTaskIdPendingDelete(
                                                                            taskItem.id
                                                                        );
                                                                    }}
                                                                    title="Remover tarefa"
                                                                    aria-label={`Remover tarefa ${taskItem.nome}`}
                                                                    className="p-1.5 rounded-lg text-black/60 hover:text-[#E60000] hover:bg-[#E60000]/10 dark:text-white/60 dark:hover:text-red-400 dark:hover:bg-[#E60000]/20 transition-colors cursor-pointer"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </>
                                                        )
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                onOpenTaskChat(
                                                                    taskItem
                                                                )
                                                            }
                                                            title="Abrir chat da tarefa"
                                                            aria-label={`Abrir chat da tarefa ${taskItem.nome}`}
                                                            className="relative p-1.5 rounded-lg text-black/60 hover:text-teal-600 hover:bg-teal-500/10 dark:text-white/60 dark:hover:text-teal-400 dark:hover:bg-teal-500/20 transition-colors cursor-pointer"
                                                        >
                                                            <MessageSquare className="w-4 h-4" />
                                                            {taskItem.hasUnreadMessages && (
                                                                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#E60000]" />
                                                            )}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1.5 text-xs text-black/60 dark:text-white/60">
                                                <User className="w-3.5 h-3.5 shrink-0" />
                                                <span>Por</span>
                                                {taskItem.criadorId ? (
                                                    <Link
                                                        href={`/profile/${taskItem.criadorId}`}
                                                        className="font-medium text-black/80 dark:text-white/80 hover:underline truncate"
                                                    >
                                                        {taskItem.autorNome}
                                                    </Link>
                                                ) : (
                                                    <span className="font-medium text-black/80 dark:text-white/80 truncate">
                                                        {taskItem.autorNome}
                                                    </span>
                                                )}
                                            </div>

                                            {taskItem.descricao && (
                                                <p className="text-sm text-black/80 dark:text-white/80 whitespace-pre-wrap">
                                                    {taskItem.descricao}
                                                </p>
                                            )}

                                            {taskItem.links.length > 0 && (
                                                <div className="flex flex-wrap gap-2 pt-1">
                                                    {taskItem.links.map((linkItem) => (
                                                        <a
                                                            key={linkItem.id}
                                                            href={linkItem.url_anexo}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/70 dark:bg-[#1D1D1D]/70 text-xs font-medium text-teal-700 dark:text-teal-300 hover:bg-white dark:hover:bg-[#1D1D1D] transition-colors max-w-full"
                                                        >
                                                            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                                                            <span className="truncate max-w-52">
                                                                {linkItem.nome}
                                                            </span>
                                                        </a>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="bg-[#E2E2E2]/60 dark:bg-[#303030]/60 rounded-xl p-6 text-center">
                                    <p className="text-sm text-black dark:text-white">
                                        Nenhuma tarefa agendada para este dia.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {!isFormActive && (
                    <div className="px-6 py-4 flex items-center justify-between gap-3">
                        {canCreateTasks ? (
                            <button
                                type="button"
                                onClick={() => {
                                    setActionErrorMessage(null);
                                    setTaskIdPendingDelete(null);
                                    setIsCreatingNewTask(true);
                                }}
                                className="w-full bg-teal-500 text-white rounded-xl py-2.5 px-4 text-sm font-medium hover:scale-[1.02] duration-200 cursor-pointer flex items-center justify-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Nova Tarefa</span>
                            </button>
                        ) : (
                            <p className="text-xs text-black dark:text-white w-full text-center">
                                Você não tem permissão para adicionar tarefas
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}