'use client';

import {
    resetUserAvatarToGoogle,
    resetUsernameToGoogle,
    updateUserAvatar,
    updateUsername,
} from '@/actions/updateUserSettings';
import {
    MAX_FONT_SCALE,
    MIN_FONT_SCALE,
    useUserPreferences,
} from '@/components/ThemeProvieder';
import {
    Camera,
    Check,
    Loader2,
    Minus,
    Pencil,
    Plus,
    RotateCcw,
    Sparkles,
    Type,
    X,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
    ChangeEvent,
    FormEvent,
    useCallback,
    useEffect,
    useId,
    useLayoutEffect,
    useRef,
    useState,
} from 'react';

export type MouseAnchorPosition = {
    x: number;
    y: number;
} | null;

type SettingsPopupProps = {
    isOpen: boolean;
    anchorPosition: MouseAnchorPosition;
    onClose: () => void;
};

export default function SettingsPopup({
    isOpen,
    anchorPosition,
    onClose,
}: SettingsPopupProps) {
    const { data: session, update: updateSession } = useSession();
    const router = useRouter();
    const avatarInputId = useId();
    const popupRef = useRef<HTMLDivElement | null>(null);

    const {
        fontScale,
        increaseFontScale,
        decreaseFontScale,
        resetFontScale,
        reduceMotion,
        setReduceMotion,
    } = useUserPreferences();

    const [coords, setCoords] = useState<{ left: number; top: number }>({
        left: 16,
        top: 16,
    });
    const [isEditingName, setIsEditingName] = useState(false);
    const [draftName, setDraftName] = useState('');
    const [isSavingName, setIsSavingName] = useState(false);
    const [isResettingName, setIsResettingName] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [isResettingAvatar, setIsResettingAvatar] = useState(false);
    const [feedbackMessage, setFeedbackMessage] = useState<{
        type: 'error' | 'success';
        text: string;
    } | null>(null);

    const recalculatePosition = useCallback(() => {
        const popupEl = popupRef.current;
        if (!popupEl) {
            return;
        }

        const margin = 12;
        const cursorOffset = 12;
        const width = popupEl.offsetWidth || 304;
        const height = popupEl.offsetHeight || 290;
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        let left: number;
        let top: number;

        if (anchorPosition) {
            if (anchorPosition.x + cursorOffset + width <= viewportWidth - margin) {
                left = anchorPosition.x + cursorOffset;
            } else {
                left = anchorPosition.x - width - cursorOffset;
            }
            top = anchorPosition.y - 24;
        } else {
            left = viewportWidth - width - 24;
            top = 72;
        }

        left = Math.max(margin, Math.min(left, viewportWidth - width - margin));
        top = Math.max(margin, Math.min(top, viewportHeight - height - margin));

        setCoords({ left, top });
    }, [anchorPosition]);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        function handleDocumentClick(event: globalThis.MouseEvent) {
            const target = event.target as HTMLElement | null;
            if (!target) {
                return;
            }
            if (popupRef.current?.contains(target)) {
                return;
            }
            if (target.closest('[data-settings-trigger="true"]')) {
                return;
            }
            onClose();
        }

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                onClose();
            }
        }

        window.addEventListener('resize', recalculatePosition);
        document.addEventListener('click', handleDocumentClick);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('resize', recalculatePosition);
            document.removeEventListener('click', handleDocumentClick);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose, recalculatePosition]);

    useLayoutEffect(() => {
        if (!isOpen) {
            return;
        }
        recalculatePosition();
    }, [isOpen, isEditingName, feedbackMessage, recalculatePosition]);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        function handlePointerDown(event: MouseEvent) {
            if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
                onClose();
            }
        }

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                onClose();
            }
        }

        window.addEventListener('resize', recalculatePosition);
        document.addEventListener('mousedown', handlePointerDown);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('resize', recalculatePosition);
            document.removeEventListener('mousedown', handlePointerDown);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose, recalculatePosition]);

    if (!isOpen) {
        return null;
    }

    const currentName = session?.user?.name ?? 'Usuário';
    const currentImage = session?.user?.image ?? null;

    async function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
        const pickedFile = event.target.files?.[0];
        event.target.value = '';

        if (!pickedFile || isUploadingAvatar || isResettingAvatar) {
            return;
        }

        setIsUploadingAvatar(true);
        setFeedbackMessage(null);

        const formData = new FormData();
        formData.set('avatar', pickedFile);

        const result = await updateUserAvatar(formData);
        setIsUploadingAvatar(false);

        if (result.error) {
            setFeedbackMessage({ type: 'error', text: result.error });
            return;
        }

        if (result.success) {
            await updateSession({
                name: result.username ?? currentName,
                image: result.image ?? null,
            });
            setFeedbackMessage({ type: 'success', text: 'Foto atualizada!' });
            router.refresh();
        }
    }

    async function handleResetAvatar() {
        if (isUploadingAvatar || isResettingAvatar) {
            return;
        }

        setIsResettingAvatar(true);
        setFeedbackMessage(null);

        const result = await resetUserAvatarToGoogle();
        setIsResettingAvatar(false);

        if (result.error) {
            setFeedbackMessage({ type: 'error', text: result.error });
            return;
        }

        if (result.success) {
            await updateSession({
                name: result.username ?? currentName,
                image: result.image ?? null,
            });
            setFeedbackMessage({ type: 'success', text: 'Foto redefinida!' });
            router.refresh();
        }
    }

    async function handleNameSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (isSavingName || isResettingName) {
            return;
        }

        const trimmed = draftName.trim();
        if (!trimmed || trimmed === currentName) {
            setIsEditingName(false);
            return;
        }

        setIsSavingName(true);
        setFeedbackMessage(null);

        const result = await updateUsername(trimmed);
        setIsSavingName(false);

        if (result.error) {
            setFeedbackMessage({ type: 'error', text: result.error });
            return;
        }

        if (result.success && result.username) {
            await updateSession({
                name: result.username,
                image: result.image ?? currentImage,
            });
            setIsEditingName(false);
            setFeedbackMessage({ type: 'success', text: 'Nome atualizado!' });
            router.refresh();
        }
    }

    async function handleResetName() {
        if (isSavingName || isResettingName) {
            return;
        }

        setIsResettingName(true);
        setFeedbackMessage(null);

        const result = await resetUsernameToGoogle();
        setIsResettingName(false);

        if (result.error) {
            setFeedbackMessage({ type: 'error', text: result.error });
            return;
        }

        if (result.success && result.username) {
            await updateSession({
                name: result.username,
                image: result.image ?? currentImage,
            });
            setDraftName(result.username);
            setIsEditingName(false);
            setFeedbackMessage({ type: 'success', text: 'Nome redefinido!' });
            router.refresh();
        }
    }

    return (
        <div
            ref={popupRef}
            role="dialog"
            aria-label="Configurações rápidas"
            style={{ left: `${coords.left}px`, top: `${coords.top}px` }}
            className="fixed z-70 w-76 rounded-2xl bg-white dark:bg-[#1D1D1D] shadow-2xl p-3.5 flex flex-col gap-3 text-sm"
        >
            <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-black/50 dark:text-white/50">
                    Configurações
                </span>
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Fechar configurações"
                    className="p-1 rounded-lg text-black/50 hover:text-black hover:bg-black/10 dark:text-white/50 dark:hover:text-white dark:hover:bg-white/10 transition-colors cursor-pointer"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            <div className="flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative w-9 h-9 rounded-full bg-[#E2E2E2] dark:bg-[#303030] overflow-hidden flex items-center justify-center shrink-0">
                        {currentImage ? (
                            <Image
                                src={currentImage}
                                alt={currentName}
                                width={36}
                                height={36}
                                unoptimized={currentImage.startsWith('/uploads/')}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <span className="text-xs font-semibold text-black dark:text-white">
                                {currentName.charAt(0).toUpperCase()}
                            </span>
                        )}
                    </div>
                    <span className="text-xs font-medium text-black dark:text-white truncate">
                        Foto de perfil
                    </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                    <input
                        id={avatarInputId}
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        onChange={handleAvatarChange}
                        disabled={isUploadingAvatar || isResettingAvatar}
                        className="hidden"
                    />
                    <label
                        htmlFor={avatarInputId}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[#E2E2E2] dark:bg-[#303030] text-black dark:text-white hover:bg-teal-500 hover:text-white dark:hover:bg-teal-500 transition-colors cursor-pointer shrink-0 ${
                            isUploadingAvatar || isResettingAvatar
                                ? 'opacity-60 pointer-events-none'
                                : ''
                        }`}
                    >
                        {isUploadingAvatar ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                            <Camera className="w-3.5 h-3.5" />
                        )}
                        <span>{isUploadingAvatar ? 'Enviando...' : 'Alterar'}</span>
                    </label>

                    <button
                        type="button"
                        onClick={handleResetAvatar}
                        disabled={isUploadingAvatar || isResettingAvatar}
                        title="Redefinir para foto padrão do Google"
                        aria-label="Redefinir para foto padrão do Google"
                        className="p-1.5 rounded-lg bg-[#E2E2E2] dark:bg-[#303030] text-black/70 dark:text-white/70 hover:bg-teal-500 hover:text-white dark:hover:bg-teal-500 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                    >
                        {isResettingAvatar ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                            <RotateCcw className="w-3.5 h-3.5" />
                        )}
                    </button>
                </div>
            </div>

            <div className="flex flex-col gap-1.5">
                {isEditingName ? (
                    <form onSubmit={handleNameSubmit} className="flex items-center gap-1.5">
                        <input
                            type="text"
                            value={draftName}
                            onChange={(e) => setDraftName(e.target.value)}
                            maxLength={128}
                            autoFocus
                            disabled={isSavingName}
                            aria-label="Novo nome de usuário"
                            className="flex-1 min-w-0 h-8 rounded-lg bg-[#E2E2E2] dark:bg-[#303030] px-2.5 text-xs text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                        <button
                            type="submit"
                            disabled={isSavingName || draftName.trim().length < 2}
                            aria-label="Salvar nome"
                            className="h-8 w-8 rounded-lg bg-teal-500 text-white flex items-center justify-center hover:bg-teal-600 transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                        >
                            {isSavingName ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <Check className="w-3.5 h-3.5" />
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setDraftName(currentName);
                                setIsEditingName(false);
                            }}
                            disabled={isSavingName}
                            aria-label="Cancelar edição"
                            className="h-8 w-8 rounded-lg bg-[#E2E2E2] dark:bg-[#303030] text-black/70 dark:text-white/70 flex items-center justify-center hover:bg-black/15 dark:hover:bg-white/15 transition-colors cursor-pointer shrink-0"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </form>
                ) : (
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex flex-col min-w-0">
                            <span className="text-[11px] text-black/50 dark:text-white/50">
                                Nome de usuário
                            </span>
                            <span className="text-xs font-medium text-black dark:text-white truncate">
                                {currentName}
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                            <button
                                type="button"
                                onClick={() => {
                                    setFeedbackMessage(null);
                                    setDraftName(currentName);
                                    setIsEditingName(true);
                                }}
                                disabled={isResettingName}
                                aria-label="Editar nome de usuário"
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[#E2E2E2] dark:bg-[#303030] text-black dark:text-white hover:bg-teal-500 hover:text-white dark:hover:bg-teal-500 transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                            >
                                <Pencil className="w-3 h-3" />
                                <span>Editar</span>
                            </button>

                            <button
                                type="button"
                                onClick={handleResetName}
                                disabled={isResettingName}
                                title="Redefinir para nome padrão do Google"
                                aria-label="Redefinir para nome padrão do Google"
                                className="p-1.5 rounded-lg bg-[#E2E2E2] dark:bg-[#303030] text-black/70 dark:text-white/70 hover:bg-teal-500 hover:text-white dark:hover:bg-teal-500 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                            >
                                {isResettingName ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                    <RotateCcw className="w-3.5 h-3.5" />
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="h-px" />

            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-black dark:text-white">
                    <Type className="w-4 h-4 text-black/60 dark:text-white/60 shrink-0" />
                    <span className="text-xs font-medium">Tamanho da fonte</span>
                </div>

                <div className="flex items-center gap-1 bg-[#E2E2E2] dark:bg-[#303030] rounded-lg p-0.5">
                    <button
                        type="button"
                        onClick={decreaseFontScale}
                        disabled={fontScale <= MIN_FONT_SCALE}
                        aria-label="Diminuir fonte"
                        title="Diminuir fonte"
                        className="p-1.5 rounded-md text-black dark:text-white hover:bg-white dark:hover:bg-[#1D1D1D] disabled:opacity-35 transition-colors cursor-pointer disabled:cursor-not-allowed"
                    >
                        <Minus className="w-3.5 h-3.5" />
                    </button>
                    <button
                        type="button"
                        onClick={resetFontScale}
                        title="Restaurar tamanho padrão (100%)"
                        className="px-1.5 text-[11px] font-semibold tabular-nums text-black dark:text-white hover:text-teal-600 dark:hover:text-teal-400 cursor-pointer"
                    >
                        {fontScale}%
                    </button>
                    <button
                        type="button"
                        onClick={increaseFontScale}
                        disabled={fontScale >= MAX_FONT_SCALE}
                        aria-label="Aumentar fonte"
                        title="Aumentar fonte"
                        className="p-1.5 rounded-md text-black dark:text-white hover:bg-white dark:hover:bg-[#1D1D1D] disabled:opacity-35 transition-colors cursor-pointer disabled:cursor-not-allowed"
                    >
                        <Plus className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-black dark:text-white">
                    <Sparkles className="w-4 h-4 text-black/60 dark:text-white/60 shrink-0" />
                    <span className="text-xs font-medium">Reduzir animações</span>
                </div>

                <button
                    type="button"
                    role="switch"
                    aria-checked={reduceMotion}
                    aria-label="Reduzir animações"
                    onClick={() => setReduceMotion(!reduceMotion)}
                    className={`relative w-10 h-5.5 rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${
                        reduceMotion
                            ? 'bg-teal-500'
                            : 'bg-[#E2E2E2] dark:bg-[#303030]'
                    }`}
                >
                    <span
                        className={`block w-4.5 h-4.5 rounded-full bg-white shadow transition-transform ${
                            reduceMotion ? 'translate-x-4.5' : 'translate-x-0'
                        }`}
                    />
                </button>
            </div>

            {feedbackMessage && (
                <p
                    role="status"
                    className={`text-xs text-center rounded-lg px-2 py-1 ${
                        feedbackMessage.type === 'error'
                            ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                            : 'bg-teal-500/10 text-teal-700 dark:text-teal-300'
                    }`}
                >
                    {feedbackMessage.text}
                </p>
            )}
        </div>
    );
}