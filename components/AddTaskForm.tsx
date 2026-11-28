"use client";

import createTask from "@/actions/createTask";
import updateTask from "@/actions/updateTask";
import {
    DEFAULT_TASK_COLOR,
    RoomTaskItem,
    TASK_COLOR_OPTIONS,
    TASK_DESCRIPTION_MAX_LENGTH,
    TASK_LINK_LIMIT,
    TASK_LINK_NAME_MAX_LENGTH,
    TASK_NAME_MAX_LENGTH,
    TaskLinkDraft,
    validateAndNormalizeExternalUrl,
} from "@/lib/tasks";
import { Check, Link2, Plus, Save, User, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type AddTaskFormProps = {
    roomId: string;
    initialDate: string;
    currentUserName: string;
    initialTask?: RoomTaskItem;
    onCancel: () => void;
    onSuccess: () => void;
};

export default function AddTaskForm({
    roomId,
    initialDate,
    currentUserName,
    initialTask,
    onCancel,
    onSuccess,
}: AddTaskFormProps) {
    const router = useRouter();
    const isEditing = Boolean(initialTask);

    const [taskName, setTaskName] = useState(initialTask?.nome ?? "");
    const [taskDate, setTaskDate] = useState(
        initialTask?.dataEntrega ?? initialDate
    );
    const [description, setDescription] = useState(
        initialTask?.descricao ?? ""
    );
    const [selectedColor, setSelectedColor] = useState(
        initialTask?.cor ?? DEFAULT_TASK_COLOR
    );
    const [linkDrafts, setLinkDrafts] = useState<TaskLinkDraft[]>(() => {
        if (initialTask && initialTask.links.length > 0) {
            return initialTask.links.map((link) => ({
                nome: link.nome,
                url: link.url_anexo,
            }));
        }
        return [{ nome: "", url: "" }];
    });
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    function handleAddLinkRow() {
        if (linkDrafts.length >= TASK_LINK_LIMIT) {
            return;
        }
        setLinkDrafts((previousDrafts) => [
            ...previousDrafts,
            { nome: "", url: "" },
        ]);
    }

    function handleRemoveLinkRow(targetIndex: number) {
        setLinkDrafts((previousDrafts) =>
            previousDrafts.filter((_, currentIndex) => currentIndex !== targetIndex)
        );
    }

    function handleUpdateLinkDraft(
        targetIndex: number,
        fieldKey: keyof TaskLinkDraft,
        updatedValue: string
    ) {
        setLinkDrafts((previousDrafts) =>
            previousDrafts.map((currentDraft, currentIndex) =>
                currentIndex === targetIndex
                    ? { ...currentDraft, [fieldKey]: updatedValue }
                    : currentDraft
            )
        );
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (isSubmitting) {
            return;
        }

        const trimmedTaskName = taskName.trim();
        if (trimmedTaskName.length === 0) {
            setErrorMessage("Informe o nome da tarefa.");
            return;
        }

        if (!taskDate) {
            setErrorMessage("Informe a data da tarefa.");
            return;
        }

        const nonEmptyLinks = linkDrafts.filter(
            (linkDraft) =>
                linkDraft.url.trim().length > 0 ||
                linkDraft.nome.trim().length > 0
        );

        for (const linkDraft of nonEmptyLinks) {
            if (linkDraft.url.trim().length === 0) {
                setErrorMessage("Informe a URL para todos os links preenchidos.");
                return;
            }
            if (!validateAndNormalizeExternalUrl(linkDraft.url)) {
                setErrorMessage(
                    "Um ou mais links são inválidos. Utilize URLs com http:// ou https://."
                );
                return;
            }
        }

        setIsSubmitting(true);
        setErrorMessage(null);

        const formDataPayload = new FormData();
        formDataPayload.set("taskName", trimmedTaskName);
        formDataPayload.set("date", taskDate);
        formDataPayload.set("description", description);
        formDataPayload.set("color", selectedColor);
        formDataPayload.set("links", JSON.stringify(nonEmptyLinks));

        const actionResult = initialTask
            ? await updateTask(roomId, initialTask.id, formDataPayload)
            : await createTask(roomId, formDataPayload);

        setIsSubmitting(false);

        if (actionResult?.error) {
            setErrorMessage(actionResult.error);
            return;
        }

        if (actionResult?.success) {
            router.refresh();
            onSuccess();
        }
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-[#E2E2E2]/70 dark:bg-[#303030]/70 text-xs text-black/70 dark:text-white/70">
                <span className="inline-flex items-center gap-1.5 font-medium">
                    <User className="w-3.5 h-3.5" />
                    Autor:
                </span>
                <span className="font-semibold text-black dark:text-white truncate">
                    {initialTask ? initialTask.autorNome : currentUserName}
                </span>
            </div>

            <div className="flex flex-col gap-1.5">
                <label
                    htmlFor="task-name-input"
                    className="text-xs font-medium text-black/60 dark:text-white/60 uppercase tracking-wide"
                >
                    Nome da tarefa
                </label>
                <input
                    id="task-name-input"
                    name="taskName"
                    type="text"
                    value={taskName}
                    onChange={(event) => setTaskName(event.target.value)}
                    maxLength={TASK_NAME_MAX_LENGTH}
                    placeholder="Nome da tarefa..."
                    required
                    className="bg-[#E2E2E2] dark:bg-[#303030] w-full h-11 rounded-lg px-4 text-sm text-black dark:text-white placeholder:text-black/50 dark:placeholder:text-white/65 focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
            </div>

            <div className="flex flex-col gap-1.5">
                <label
                    htmlFor="task-date-input"
                    className="text-xs font-medium text-black/60 dark:text-white/60 uppercase tracking-wide"
                >
                    Data
                </label>
                <input
                    id="task-date-input"
                    name="date"
                    type="date"
                    value={taskDate}
                    onChange={(event) => setTaskDate(event.target.value)}
                    required
                    className="bg-[#E2E2E2] dark:bg-[#303030] w-full h-11 rounded-lg px-4 text-sm text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
            </div>

            <div className="flex flex-col gap-2">
                <span className="text-xs font-medium text-black/60 dark:text-white/60 uppercase tracking-wide">
                    Cor
                </span>
                <div className="grid grid-cols-8 gap-2">
                    {TASK_COLOR_OPTIONS.map((colorOption) => {
                        const isSelected = selectedColor === colorOption.hexCode;
                        return (
                            <button
                                key={colorOption.hexCode}
                                type="button"
                                onClick={() => setSelectedColor(colorOption.hexCode)}
                                title={colorOption.label}
                                aria-label={`Selecionar cor ${colorOption.label}`}
                                aria-pressed={isSelected}
                                style={{ backgroundColor: colorOption.hexCode }}
                                className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-transform duration-150 hover:scale-110 ${
                                    isSelected
                                        ? "ring-2 ring-offset-2 ring-black dark:ring-white dark:ring-offset-[#1D1D1D] scale-110"
                                        : ""
                                }`}
                            >
                                {isSelected && (
                                    <Check className="w-4 h-4 text-white drop-shadow" />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="flex flex-col gap-1.5">
                <label
                    htmlFor="task-description-input"
                    className="text-xs font-medium text-black/60 dark:text-white/60 tracking-wide"
                >
                    Descrição
                </label>
                <textarea
                    id="task-description-input"
                    name="description"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    maxLength={TASK_DESCRIPTION_MAX_LENGTH}
                    rows={3}
                    placeholder="Detalhes da tarefa..."
                    className="bg-[#E2E2E2] dark:bg-[#303030] rounded-lg w-full text-sm p-3 text-black dark:text-white placeholder:text-black/50 dark:placeholder:text-white/65 focus:outline-none focus:ring-2 focus:ring-teal-400 resize-y"
                />
            </div>

            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-black/60 dark:text-white/60 uppercase tracking-wide inline-flex items-center gap-1.5">
                        <Link2 className="w-3.5 h-3.5" />
                        Links
                    </span>
                    {linkDrafts.length < TASK_LINK_LIMIT && (
                        <button
                            type="button"
                            onClick={handleAddLinkRow}
                            className="inline-flex items-center gap-1 text-xs font-medium text-teal-600 dark:text-teal-400 hover:underline cursor-pointer"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            Adicionar link
                        </button>
                    )}
                </div>

                {linkDrafts.length === 0 ? (
                    <p className="text-xs text-black/50 dark:text-white/50">
                        Nenhum link adicionado.
                    </p>
                ) : (
                    <div className="flex flex-col gap-2">
                        {linkDrafts.map((linkDraft, rowIndex) => (
                            <div
                                key={rowIndex}
                                className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
                            >
                                <input
                                    type="text"
                                    inputMode="url"
                                    value={linkDraft.url}
                                    onChange={(event) =>
                                        handleUpdateLinkDraft(
                                            rowIndex,
                                            "url",
                                            event.target.value
                                        )
                                    }
                                    placeholder="https://exemplo.com"
                                    aria-label={`URL do link ${rowIndex + 1}`}
                                    className="bg-[#E2E2E2] dark:bg-[#303030] flex-1 h-10 rounded-lg px-3 text-sm text-black dark:text-white placeholder:text-black/50 dark:placeholder:text-white/65 focus:outline-none focus:ring-2 focus:ring-teal-400"
                                />
                                <input
                                    type="text"
                                    value={linkDraft.nome}
                                    onChange={(event) =>
                                        handleUpdateLinkDraft(
                                            rowIndex,
                                            "nome",
                                            event.target.value
                                        )
                                    }
                                    maxLength={TASK_LINK_NAME_MAX_LENGTH}
                                    placeholder="Rótulo (opcional)"
                                    aria-label={`Rótulo do link ${rowIndex + 1}`}
                                    className="bg-[#E2E2E2] dark:bg-[#303030] sm:w-40 h-10 rounded-lg px-3 text-sm text-black dark:text-white placeholder:text-black/50 dark:placeholder:text-white/65 focus:outline-none focus:ring-2 focus:ring-teal-400"
                                />
                                <button
                                    type="button"
                                    onClick={() => handleRemoveLinkRow(rowIndex)}
                                    aria-label={`Remover link ${rowIndex + 1}`}
                                    className="p-2 rounded-lg text-black/60 hover:text-[#E60000] hover:bg-[#E60000]/10 dark:text-white/60 dark:hover:text-red-400 dark:hover:bg-[#E60000]/20 transition-colors cursor-pointer self-end sm:self-center shrink-0"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {errorMessage && (
                <p role="alert" className="text-sm text-[#E60000] dark:text-red-400">
                    {errorMessage}
                </p>
            )}

            <div className="flex justify-end gap-3 pt-2">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={isSubmitting}
                    className="px-4 py-2.5 rounded-lg text-sm font-medium text-black dark:text-white hover:scale-105 duration-200 cursor-pointer disabled:opacity-50"
                >
                    Voltar
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-teal-500 px-5 py-2.5 rounded-lg text-sm font-medium text-white hover:scale-105 duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? (
                        "Salvando..."
                    ) : isEditing ? (
                        <div className="flex gap-2 items-center">
                            <Save className="w-4 h-4" /> Salvar Alterações
                        </div>
                    ) : (
                        <div className="flex gap-2 items-center">
                            <Plus className="w-4 h-4" /> Adicionar Tarefa
                        </div>
                    )}
                </button>
            </div>
        </form>
    );
}