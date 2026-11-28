"use client";

import {
    resetUserAvatarToGoogle,
    resetUsernameToGoogle,
    updateShowEmail,
    updateUserAvatar,
    updateUsername,
} from "@/actions/updateUserSettings";
import DeleteAccountModal from "@/components/DeleteAccountModal";
import {
    MAX_FONT_SCALE,
    MIN_FONT_SCALE,
    useUserPreferences,
} from "@/components/ThemeProvieder";
import {
    Camera,
    Check,
    Eye,
    EyeOff,
    Loader2,
    Minus,
    Plus,
    RotateCcw,
    Sparkles,
    Trash2,
    Type,
} from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useEffect, useId, useState } from "react";

type ProfileSettingsSectionProps = {
    initialUsername: string;
    initialImage: string | null;
    initialShowEmail: boolean;
    userEmail: string | null;
};

export default function ProfileSettingsSection({
    initialUsername,
    initialImage,
    initialShowEmail,
    userEmail,
}: ProfileSettingsSectionProps) {
    const { data: session, update: updateSession } = useSession();
    const router = useRouter();
    const avatarInputId = useId();
    const usernameInputId = useId();

    const {
        fontScale,
        increaseFontScale,
        decreaseFontScale,
        resetFontScale,
        reduceMotion,
        setReduceMotion,
    } = useUserPreferences();

    const [draftName, setDraftName] = useState(initialUsername);
    const [showEmail, setShowEmail] = useState(initialShowEmail);
    const [isSavingName, setIsSavingName] = useState(false);
    const [isResettingName, setIsResettingName] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [isResettingAvatar, setIsResettingAvatar] = useState(false);
    const [isUpdatingEmailVisibility, setIsUpdatingEmailVisibility] = useState(false);
    const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] = useState(false);
    const [feedbackMessage, setFeedbackMessage] = useState<{
        type: "error" | "success";
        text: string;
    } | null>(null);

    useEffect(() => {
        setDraftName(initialUsername);
    }, [initialUsername]);

    useEffect(() => {
        setShowEmail(initialShowEmail);
    }, [initialShowEmail]);

    const displayedImage = session?.user?.image ?? initialImage;
    const displayedName = session?.user?.name ?? initialUsername;
    const hasNameChanged =
        draftName.trim().length >= 2 && draftName.trim() !== displayedName;

    async function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
        const pickedFile = event.target.files?.[0];
        event.target.value = "";

        if (!pickedFile || isUploadingAvatar || isResettingAvatar) {
            return;
        }

        setIsUploadingAvatar(true);
        setFeedbackMessage(null);

        const formData = new FormData();
        formData.set("avatar", pickedFile);

        const result = await updateUserAvatar(formData);
        setIsUploadingAvatar(false);

        if (result.error) {
            setFeedbackMessage({ type: "error", text: result.error });
            return;
        }

        if (result.success) {
            await updateSession({
                name: result.username ?? displayedName,
                image: result.image ?? null,
            });
            setFeedbackMessage({
                type: "success",
                text: "Foto de perfil atualizada!",
            });
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
            setFeedbackMessage({ type: "error", text: result.error });
            return;
        }

        if (result.success) {
            await updateSession({
                name: result.username ?? displayedName,
                image: result.image ?? null,
            });
            setFeedbackMessage({
                type: "success",
                text: "Foto de perfil redefinida!",
            });
            router.refresh();
        }
    }

    async function handleNameSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (isSavingName || isResettingName || !hasNameChanged) {
            return;
        }

        const trimmed = draftName.trim();
        setIsSavingName(true);
        setFeedbackMessage(null);

        const result = await updateUsername(trimmed);
        setIsSavingName(false);

        if (result.error) {
            setFeedbackMessage({ type: "error", text: result.error });
            return;
        }

        if (result.success && result.username) {
            await updateSession({
                name: result.username,
                image: result.image ?? displayedImage,
            });
            setFeedbackMessage({
                type: "success",
                text: "Nome de usuário atualizado!",
            });
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
            setFeedbackMessage({ type: "error", text: result.error });
            return;
        }

        if (result.success && result.username) {
            setDraftName(result.username);
            await updateSession({
                name: result.username,
                image: result.image ?? displayedImage,
            });
            setFeedbackMessage({
                type: "success",
                text: "Nome de usuário redefinido!",
            });
            router.refresh();
        }
    }

    async function handleToggleShowEmail() {
        if (isUpdatingEmailVisibility) {
            return;
        }

        const nextValue = !showEmail;
        setShowEmail(nextValue);
        setIsUpdatingEmailVisibility(true);
        setFeedbackMessage(null);

        const result = await updateShowEmail(nextValue);
        setIsUpdatingEmailVisibility(false);

        if (result.error) {
            setShowEmail(!nextValue);
            setFeedbackMessage({ type: "error", text: result.error });
            return;
        }

        if (result.success && typeof result.showEmail === "boolean") {
            setShowEmail(result.showEmail);
            setFeedbackMessage({
                type: "success",
                text: result.showEmail
                    ? "Seu e-mail agora está visível no seu perfil."
                    : "Seu e-mail agora está oculto para outros usuários.",
            });
            router.refresh();
        }
    }

    return (
        <>
            <section className="flex flex-col gap-3">
                <div>
                    <span className="text-xs font-medium text-black/50 dark:text-white/50 uppercase tracking-wide">
                        Conta e Preferências
                    </span>
                    <h2 className="text-lg font-semibold text-black dark:text-white">
                        Configurações
                    </h2>
                </div>

                <div className="bg-[#E2E2E2] dark:bg-[#303030] rounded-2xl p-5 sm:p-6 flex flex-col gap-5">
                    {feedbackMessage && (
                        <p
                            role="status"
                            className={`text-xs font-medium rounded-xl px-3.5 py-2.5 ${
                                feedbackMessage.type === "error"
                                    ? "bg-red-500/15 text-red-700 dark:text-red-300"
                                    : "bg-teal-500/15 text-teal-800 dark:text-teal-200"
                            }`}
                        >
                            {feedbackMessage.text}
                        </p>
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5 min-w-0">
                            <div className="w-12 h-12 rounded-full bg-black/10 dark:bg-white/15 overflow-hidden flex items-center justify-center shrink-0">
                                {displayedImage ? (
                                    <Image
                                        src={displayedImage}
                                        alt={displayedName}
                                        width={48}
                                        height={48}
                                        unoptimized={displayedImage.startsWith("/uploads/")}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="text-base font-semibold text-black dark:text-white">
                                        {displayedName.charAt(0).toUpperCase()}
                                    </span>
                                )}
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-sm font-medium text-black dark:text-white">
                                    Foto de perfil
                                </span>
                                <span className="text-xs text-black/55 dark:text-white/55">
                                    PNG, JPG, WEBP ou GIF (máx. 5 MB)
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
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
                                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-[#1D1D1D] text-black dark:text-white hover:bg-teal-500 hover:text-white dark:hover:bg-teal-500 transition-colors cursor-pointer ${
                                    isUploadingAvatar || isResettingAvatar
                                        ? "opacity-60 pointer-events-none"
                                        : ""
                                }`}
                            >
                                {isUploadingAvatar ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Camera className="w-4 h-4" />
                                )}
                                <span>{isUploadingAvatar ? "Enviando..." : "Alterar foto"}</span>
                            </label>

                            <button
                                type="button"
                                onClick={handleResetAvatar}
                                disabled={isUploadingAvatar || isResettingAvatar}
                                title="Redefinir"
                                aria-label="Redefinir"
                                className="p-2 rounded-xl bg-white dark:bg-[#1D1D1D] text-black/70 dark:text-white/70 hover:bg-teal-500 hover:text-white dark:hover:bg-teal-500 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                            >
                                {isResettingAvatar ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <RotateCcw className="w-4 h-4" />
                                )}
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleNameSubmit} className="flex flex-col gap-2">
                        <label
                            htmlFor={usernameInputId}
                            className="text-sm font-medium text-black dark:text-white"
                        >
                            Nome de usuário
                        </label>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                            <input
                                id={usernameInputId}
                                type="text"
                                value={draftName}
                                onChange={(e) => setDraftName(e.target.value)}
                                maxLength={128}
                                minLength={2}
                                required
                                disabled={isSavingName || isResettingName}
                                className="flex-1 h-10 rounded-xl bg-white dark:bg-[#1D1D1D] px-3.5 text-sm text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                            />
                            <div className="flex items-center gap-2 shrink-0">
                                <button
                                    type="submit"
                                    disabled={isSavingName || isResettingName || !hasNameChanged}
                                    className="flex-1 sm:flex-initial h-10 px-4 rounded-xl bg-teal-500 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 hover:bg-teal-600 transition-colors cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed shrink-0"
                                >
                                    {isSavingName ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Check className="w-4 h-4" />
                                    )}
                                    <span>{isSavingName ? "Salvando..." : "Salvar nome"}</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={handleResetName}
                                    disabled={isSavingName || isResettingName}
                                    title="Redefinir para nome padrão do Google"
                                    aria-label="Redefinir para nome padrão do Google"
                                    className="h-10 w-10 rounded-xl bg-white dark:bg-[#1D1D1D] text-black/70 dark:text-white/70 hover:bg-teal-500 hover:text-white dark:hover:bg-teal-500 transition-colors cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed inline-flex items-center justify-center shrink-0"
                                >
                                    {isResettingName ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <RotateCcw className="w-4 h-4" />
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>

                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-start gap-3 min-w-0">
                            {showEmail ? (
                                <Eye className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                            ) : (
                                <EyeOff className="w-4 h-4 text-black/55 dark:text-white/55 shrink-0 mt-0.5" />
                            )}
                            <div className="flex flex-col min-w-0">
                                <span className="text-sm font-medium text-black dark:text-white">
                                    Mostrar e-mail no perfil
                                </span>
                                <span className="text-xs text-black/55 dark:text-white/55">
                                    {userEmail
                                        ? showEmail
                                            ? `Visível como ${userEmail}`
                                            : `Oculto (${userEmail} aparece apenas para você)`
                                        : "Define se outros usuários podem ver seu e-mail"}
                                </span>
                            </div>
                        </div>

                        <button
                            type="button"
                            role="switch"
                            aria-checked={showEmail}
                            aria-label="Mostrar e-mail no perfil"
                            disabled={isUpdatingEmailVisibility}
                            onClick={handleToggleShowEmail}
                            className={`relative w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer shrink-0 disabled:opacity-50 ${
                                showEmail
                                    ? "bg-teal-500"
                                    : "bg-black/20 dark:bg-[#1D1D1D]"
                            }`}
                        >
                            <span
                                className={`block w-5 h-5 rounded-full bg-white shadow transition-transform ${
                                    showEmail ? "translate-x-5" : "translate-x-0"
                                }`}
                            />
                        </button>
                    </div>

                    <div className="h-px bg-black/10 dark:bg-white/10" />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex items-center justify-between gap-2 bg-white/70 dark:bg-[#1D1D1D]/70 rounded-xl px-3.5 py-2.5">
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
                                    className="p-1.5 rounded-md text-black dark:text-white hover:bg-white dark:hover:bg-[#1D1D1D] disabled:opacity-35 transition-colors cursor-pointer disabled:cursor-not-allowed"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between gap-2 bg-white/70 dark:bg-[#1D1D1D]/70 rounded-xl px-3.5 py-2.5">
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
                                        ? "bg-teal-500"
                                        : "bg-[#E2E2E2] dark:bg-[#303030]"
                                }`}
                            >
                                <span
                                    className={`block w-4.5 h-4.5 rounded-full bg-white shadow transition-transform ${
                                        reduceMotion ? "translate-x-4.5" : "translate-x-0"
                                    }`}
                                />
                            </button>
                        </div>
                    </div>

                    <div className="h-px bg-black/10 dark:bg-white/10" />

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm font-medium text-[#E60000] dark:text-red-400">
                                Excluir conta
                            </span>
                            <span className="text-xs text-black/55 dark:text-white/55">
                                Remove permanentemente sua conta, salas criadas, tarefas e dados associados.
                            </span>
                        </div>

                        <button
                            type="button"
                            onClick={() => setIsDeleteAccountModalOpen(true)}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-[#E60000] text-white hover:scale-105 duration-200 transition-transform cursor-pointer shrink-0"
                        >
                            <Trash2 className="w-4 h-4" />
                            <span>Deletar conta</span>
                        </button>
                    </div>
                </div>
            </section>

            <DeleteAccountModal
                isOpen={isDeleteAccountModalOpen}
                onClose={() => setIsDeleteAccountModalOpen(false)}
            />
        </>
    );
}