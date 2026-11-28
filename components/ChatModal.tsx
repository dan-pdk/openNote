"use client";

import {
    CHAT_MESSAGE_MAX_LENGTH,
    ChatMessageItem,
    ChatTarget,
    formatChatMessageTimestamp,
} from "@/lib/chat";
import { Loader2, MessageSquare, Send, Trash2, X } from "lucide-react";
import Link from "next/link";
import {
    FormEvent,
    KeyboardEvent,
    ReactNode,
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";

type ChatModalProps = {
    target: ChatTarget | null;
    currentUserId: string;
    initialCanSendMessages: boolean;
    initialIsRoomLeader: boolean;
    onClose: () => void;
};

function normalizeHref(rawUrl: string): string | null {
    const withProtocol = /^https?:\/\//i.test(rawUrl)
        ? rawUrl
        : `https://${rawUrl}`;

    try {
        const parsed = new URL(withProtocol);
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
            return null;
        }
        return parsed.href;
    } catch {
        return null;
    }
}

function renderMessageWithLinks(content: string): ReactNode[] {
    const urlPattern = /((?:https?:\/\/|www\.)[^\s<]+)/gi;
    const nodes: ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = urlPattern.exec(content)) !== null) {
        const matchStart = match.index;
        if (matchStart > lastIndex) {
            nodes.push(content.slice(lastIndex, matchStart));
        }

        let rawUrl = match[0];
        let trailing = "";

        while (rawUrl.length > 0) {
            const lastChar = rawUrl[rawUrl.length - 1];
            if (/[.,!?;:'"\]}]/.test(lastChar)) {
                trailing = lastChar + trailing;
                rawUrl = rawUrl.slice(0, -1);
                continue;
            }
            if (lastChar === ")") {
                const openCount = (rawUrl.match(/\(/g) || []).length;
                const closeCount = (rawUrl.match(/\)/g) || []).length;
                if (closeCount > openCount) {
                    trailing = lastChar + trailing;
                    rawUrl = rawUrl.slice(0, -1);
                    continue;
                }
            }
            break;
        }

        const safeHref = normalizeHref(rawUrl);
        if (safeHref) {
            nodes.push(
                <a
                    key={`link-${matchStart}`}
                    href={safeHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-teal-600 dark:text-teal-400 underline break-all hover:opacity-80"
                >
                    {rawUrl}
                </a>
            );
        } else {
            nodes.push(rawUrl);
        }

        if (trailing) {
            nodes.push(trailing);
        }

        lastIndex = matchStart + match[0].length;
    }

    if (lastIndex < content.length) {
        nodes.push(content.slice(lastIndex));
    }

    return nodes;
}

export default function ChatModal({
    target,
    currentUserId,
    initialCanSendMessages,
    initialIsRoomLeader,
    onClose,
}: ChatModalProps) {
    const [messages, setMessages] = useState<ChatMessageItem[]>([]);
    const [canSendMessages, setCanSendMessages] = useState(
        initialCanSendMessages
    );
    const [isRoomLeader, setIsRoomLeader] = useState(initialIsRoomLeader);
    const [isLoading, setIsLoading] = useState(false);
    const [draftMessage, setDraftMessage] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [deletingMessageId, setDeletingMessageId] = useState<number | null>(
        null
    );
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const shouldScrollToBottomRef = useRef(true);

    const buildQueryUrl = useCallback((activeTarget: ChatTarget) => {
        const searchParams = new URLSearchParams({
            type: activeTarget.type,
        });
        if (activeTarget.type === "task") {
            searchParams.set("taskId", activeTarget.taskId);
        }
        return `/api/v1/rooms/${activeTarget.roomId}/chat?${searchParams.toString()}`;
    }, []);

    const fetchMessages = useCallback(
        async (activeTarget: ChatTarget, silent = false) => {
            if (!silent) {
                setIsLoading(true);
                setErrorMessage(null);
            }

            try {
                const response = await fetch(buildQueryUrl(activeTarget), {
                    cache: "no-store",
                });
                const data = await response.json();

                if (!response.ok) {
                    if (!silent) {
                        setErrorMessage(
                            data?.error || "Não foi possível carregar o chat."
                        );
                    }
                    return;
                }

                setMessages((previous) => {
                    const incoming: ChatMessageItem[] = data.messages ?? [];
                    if (incoming.length > previous.length) {
                        shouldScrollToBottomRef.current = true;
                    }
                    return incoming;
                });

                if (typeof data.canSendMessages === "boolean") {
                    setCanSendMessages(data.canSendMessages);
                }
                if (typeof data.isRoomLeader === "boolean") {
                    setIsRoomLeader(data.isRoomLeader);
                }
            } catch {
                if (!silent) {
                    setErrorMessage("Erro de conexão ao carregar mensagens.");
                }
            } finally {
                if (!silent) {
                    setIsLoading(false);
                }
            }
        },
        [buildQueryUrl]
    );

    useEffect(() => {
        if (!target) {
            return;
        }

        setMessages([]);
        setDraftMessage("");
        setCanSendMessages(initialCanSendMessages);
        setIsRoomLeader(initialIsRoomLeader);
        shouldScrollToBottomRef.current = true;

        fetchMessages(target, false);

        const intervalId = window.setInterval(() => {
            if (document.visibilityState === "visible") {
                fetchMessages(target, true);
            }
        }, 4500);

        return () => {
            window.clearInterval(intervalId);
        };
    }, [
        target,
        initialCanSendMessages,
        initialIsRoomLeader,
        fetchMessages,
    ]);

    useEffect(() => {
        if (!target) {
            return;
        }

        function handleKeyDown(event: globalThis.KeyboardEvent) {
            if (event.key === "Escape") {
                event.stopImmediatePropagation();
                onClose();
            }
        }

        document.addEventListener("keydown", handleKeyDown, true);
        return () => {
            document.removeEventListener("keydown", handleKeyDown, true);
        };
    }, [target, onClose]);

    useEffect(() => {
        if (shouldScrollToBottomRef.current) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
            shouldScrollToBottomRef.current = false;
        }
    }, [messages]);

    if (!target) {
        return null;
    }

    async function sendCurrentMessage() {
        if (!target || isSending || !canSendMessages) {
            return;
        }

        const trimmed = draftMessage.trim();
        if (!trimmed) {
            return;
        }

        setIsSending(true);
        setErrorMessage(null);

        try {
            const response = await fetch(
                `/api/v1/rooms/${target.roomId}/chat`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        type: target.type,
                        taskId:
                            target.type === "task" ? target.taskId : undefined,
                        conteudo: trimmed,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setErrorMessage(
                    data?.error || "Não foi possível enviar a mensagem."
                );
                if (data?.canSendMessages === false) {
                    setCanSendMessages(false);
                }
                return;
            }

            if (data?.message) {
                shouldScrollToBottomRef.current = true;
                setMessages((previous) => [...previous, data.message]);
                setDraftMessage("");
            }
        } catch {
            setErrorMessage("Erro de conexão ao enviar mensagem.");
        } finally {
            setIsSending(false);
            requestAnimationFrame(() => {
                textareaRef.current?.focus();
            });
        }
    }

    function handleFormSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        sendCurrentMessage();
    }

    function handleTextareaKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            sendCurrentMessage();
        }
    }

    async function handleDeleteMessage(messageId: number) {
        if (!target || deletingMessageId !== null) {
            return;
        }

        setDeletingMessageId(messageId);
        setErrorMessage(null);

        try {
            const searchParams = new URLSearchParams({
                type: target.type,
                messageId: String(messageId),
            });
            if (target.type === "task") {
                searchParams.set("taskId", target.taskId);
            }

            const response = await fetch(
                `/api/v1/rooms/${target.roomId}/chat?${searchParams.toString()}`,
                { method: "DELETE" }
            );
            const data = await response.json();

            if (!response.ok) {
                setErrorMessage(
                    data?.error || "Não foi possível excluir a mensagem."
                );
                return;
            }

            setMessages((previous) =>
                previous.filter((msg) => msg.id !== messageId)
            );
        } catch {
            setErrorMessage("Erro de conexão ao excluir mensagem.");
        } finally {
            setDeletingMessageId(null);
        }
    }

    return (
        <div
            className="fixed inset-0 z-40 bg-black/45 flex items-center justify-center p-4"
            onClick={(event) => {
                if (event.target === event.currentTarget) {
                    onClose();
                }
            }}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="chat-modal-title"
                className="bg-white dark:bg-[#1D1D1D] rounded-2xl w-full max-w-md h-130 max-h-[85vh] shadow-xl flex flex-col overflow-hidden"
            >
                <div className="flex items-center justify-between gap-3 px-5 py-3.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                        {target.type === "task" ? (
                            <span
                                className="w-3 h-3 rounded-full shrink-0"
                                style={{ backgroundColor: target.color }}
                            />
                        ) : (
                            <MessageSquare className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                        )}

                        <div className="flex flex-col min-w-0">
                            <h2
                                id="chat-modal-title"
                                className="text-base font-semibold text-black dark:text-white truncate"
                            >
                                {target.title}
                            </h2>
                            <span className="text-[11px] text-black/50 dark:text-white/50">
                                {target.type === "task"
                                    ? "Discussão da tarefa"
                                    : "Discussão geral da sala"}
                            </span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Fechar chat"
                        className="p-1.5 rounded-lg text-black/60 hover:text-black hover:bg-black/10 dark:text-white/60 dark:hover:text-white dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
                    {isLoading ? (
                        <div className="flex-1 flex items-center justify-center text-black/50 dark:text-white/50">
                            <Loader2 className="w-5 h-5 animate-spin" />
                        </div>
                    ) : messages.length > 0 ? (
                        messages.map((message) => {
                            const canDelete =
                                isRoomLeader ||
                                (message.autorId !== null &&
                                    message.autorId === currentUserId);
                            const isDeletingThis =
                                deletingMessageId === message.id;

                            return (
                                <div
                                    key={message.id}
                                    className="group relative flex items-start gap-2.5 rounded-xl p-2 hover:bg-black/3 dark:hover:bg-white/4 transition-colors"
                                >
                                    {message.autorId ? (
                                        <Link
                                            href={`/profile/${message.autorId}`}
                                            className="shrink-0 mt-0.5"
                                            title={`Ver perfil de ${message.autorUsername}`}
                                        >
                                            {message.autorFoto ? (
                                                <img
                                                    src={message.autorFoto}
                                                    alt={message.autorFirstName}
                                                    referrerPolicy="no-referrer"
                                                    className="w-8 h-8 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-[#E2E2E2] dark:bg-[#303030] flex items-center justify-center text-xs font-semibold text-black dark:text-white">
                                                    {message.autorFirstName
                                                        .charAt(0)
                                                        .toUpperCase()}
                                                </div>
                                            )}
                                        </Link>
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-[#E2E2E2] dark:bg-[#303030] flex items-center justify-center text-xs font-semibold text-black dark:text-white shrink-0 mt-0.5">
                                            ?
                                        </div>
                                    )}

                                    <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                                        <div className="flex items-baseline gap-2 pr-6">
                                            {message.autorId ? (
                                                <Link
                                                    href={`/profile/${message.autorId}`}
                                                    className="text-xs font-semibold text-black dark:text-white hover:underline truncate"
                                                >
                                                    {message.autorFirstName}
                                                </Link>
                                            ) : (
                                                <span className="text-xs font-semibold text-black/60 dark:text-white/60 truncate">
                                                    {message.autorFirstName}
                                                </span>
                                            )}

                                            <span className="text-[11px] text-black/45 dark:text-white/45 shrink-0">
                                                {formatChatMessageTimestamp(
                                                    message.createdAt
                                                )}
                                            </span>
                                        </div>

                                        <p className="text-sm text-black/85 dark:text-white/85 whitespace-pre-wrap wrap-break-word">
                                            {renderMessageWithLinks(
                                                message.conteudo
                                            )}
                                        </p>
                                    </div>

                                    {canDelete && (
                                        <button
                                            type="button"
                                            disabled={isDeletingThis}
                                            onClick={() =>
                                                handleDeleteMessage(message.id)
                                            }
                                            title="Excluir mensagem"
                                            aria-label="Excluir mensagem"
                                            className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity p-1.5 rounded-lg text-black/45 hover:text-[#E60000] hover:bg-[#E60000]/10 dark:text-white/45 dark:hover:text-red-400 dark:hover:bg-[#E60000]/20 cursor-pointer disabled:opacity-50 shrink-0"
                                        >
                                            {isDeletingThis ? (
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            ) : (
                                                <Trash2 className="w-3.5 h-3.5" />
                                            )}
                                        </button>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center px-4 gap-1.5">
                            <MessageSquare className="w-7 h-7 text-black dark:text-white" />
                            <p className="text-sm font-medium text-black dark:text-white">
                                Nenhuma mensagem ainda
                            </p>
                            <p className="text-xs text-black dark:text-white">
                                {canSendMessages
                                    ? ""
                                    : "Aguardando mensagens dos participantes autorizados"}
                            </p>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {errorMessage && (
                    <p
                        role="alert"
                        className="px-4 py-1.5 text-xs text-[#E60000] dark:text-red-400 bg-red-500/10"
                    >
                        {errorMessage}
                    </p>
                )}

                <div className="px-4 py-3 ">
                    {canSendMessages ? (
                        <form
                            onSubmit={handleFormSubmit}
                            className="flex items-end gap-2"
                        >
                            <textarea
                                ref={textareaRef}
                                rows={1}
                                value={draftMessage}
                                onChange={(event) =>
                                    setDraftMessage(event.target.value)
                                }
                                onKeyDown={handleTextareaKeyDown}
                                maxLength={CHAT_MESSAGE_MAX_LENGTH}
                                placeholder="Escreva uma mensagem..."
                                aria-label="Escreva uma mensagem"
                                className="flex-1 bg-[#E2E2E2] dark:bg-[#303030] rounded-xl px-3.5 py-2.5 text-sm text-black dark:text-white placeholder:text-black/50 dark:placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none max-h-28"
                            />
                            <button
                                type="submit"
                                disabled={
                                    isSending ||
                                    draftMessage.trim().length === 0
                                }
                                aria-label="Enviar mensagem"
                                className="p-2.5 rounded-xl bg-teal-500 text-white hover:bg-teal-600 transition-colors cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed shrink-0"
                            >
                                {isSending ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Send className="w-4 h-4" />
                                )}
                            </button>
                        </form>
                    ) : (
                        <p className="text-xs text-center text-black/55 dark:text-white/55 py-1">
                            Você não tem permissão para enviar mensagens nesta
                            sala.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}