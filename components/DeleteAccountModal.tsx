"use client";

import deleteAccount from "@/actions/deleteAccount";
import { signOut } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";

type DeleteAccountModalProps = {
    isOpen: boolean;
    onClose: () => void;
};

export default function DeleteAccountModal({
    isOpen,
    onClose,
}: DeleteAccountModalProps) {
    const [isDeletingAccount, setIsDeletingAccount] = useState(false);
    const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(
        null
    );

    const handleCancel = useCallback(() => {
        if (isDeletingAccount) {
            return;
        }
        setDeleteErrorMessage(null);
        onClose();
    }, [isDeletingAccount, onClose]);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") {
                event.stopImmediatePropagation();
                handleCancel();
            }
        }

        document.addEventListener("keydown", handleKeyDown, true);
        return () => {
            document.removeEventListener("keydown", handleKeyDown, true);
        };
    }, [isOpen, handleCancel]);

    if (!isOpen) {
        return null;
    }

    async function handleConfirmDelete() {
        if (isDeletingAccount) {
            return;
        }

        setIsDeletingAccount(true);
        setDeleteErrorMessage(null);

        const result = await deleteAccount();

        if (result?.error) {
            setIsDeletingAccount(false);
            setDeleteErrorMessage(result.error);
            return;
        }

        if (result?.success) {
            await signOut({ callbackUrl: "/login" });
        }
    }

    return (
        <div
            className="fixed inset-0 z-70 bg-black/40 flex items-center justify-center p-4"
            onClick={(event) => {
                if (event.target === event.currentTarget) {
                    handleCancel();
                }
            }}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="delete-account-title"
                className="bg-white dark:bg-[#1D1D1D] rounded-xl p-6 w-full max-w-sm shadow-xl flex flex-col gap-4 border border-black/10 dark:border-white/10"
            >
                <h2
                    id="delete-account-title"
                    className="text-lg font-semibold text-black dark:text-white"
                >
                    Excluir conta
                </h2>
                <p className="text-sm text-black/70 dark:text-white/70">
                    Tem certeza que deseja excluir sua conta? Todas as suas informações, tarefas, comentários e salas criadas serão removidos permanentemente.
                </p>
                {deleteErrorMessage && (
                    <p
                        role="alert"
                        className="text-sm text-[#E60000] dark:text-red-400"
                    >
                        {deleteErrorMessage}
                    </p>
                )}
                <div className="flex justify-end gap-3 mt-1">
                    <button
                        type="button"
                        onClick={handleCancel}
                        disabled={isDeletingAccount}
                        className="border-2 border-black/20 dark:border-white/20 px-4 py-2 rounded-lg text-sm font-medium text-black dark:text-white hover:scale-105 duration-200 cursor-pointer disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirmDelete}
                        disabled={isDeletingAccount}
                        className="bg-[#E60000] px-4 py-2 rounded-lg text-sm font-medium text-white hover:scale-105 duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isDeletingAccount ? "Excluindo..." : "Excluir"}
                    </button>
                </div>
            </div>
        </div>
    );
}