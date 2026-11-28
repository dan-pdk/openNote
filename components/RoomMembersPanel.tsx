"use client";

import {
  removeRoomMember,
  updateMemberPermission,
} from "@/actions/manageRoomMembers";
import {
  Check,
  Copy,
  Crown,
  MessageSquare,
  PlusCircle,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export type RoomMemberItem = {
  id: string;
  username: string;
  mirrorFoto: string | null;
  isLeader: boolean;
  podeCriarTarefas: boolean;
  podeMandarMensagens: boolean;
};

type RoomMembersPanelProps = {
  roomId: string;
  roomType: "livre" | "restrita";
  members: RoomMemberItem[];
  currentUserId: string;
  isRoomLeader: boolean;
};

export default function RoomMembersPanel({
  roomId,
  roomType,
  members,
  currentUserId,
  isRoomLeader,
}: RoomMembersPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [busyMemberId, setBusyMemberId] = useState<string | null>(null);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const [copiedRoomId, setCopiedRoomId] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isFreeRoom = roomType === "livre";

  async function handleCopyRoomId() {
    try {
      await navigator.clipboard.writeText(roomId);
      setCopiedRoomId(true);
      setTimeout(() => setCopiedRoomId(false), 2000);
    } catch {
      setErrorMessage("Não foi possível copiar o ID da sala.");
    }
  }

  function handleTogglePermission(
    memberId: string,
    field: "pode_criar_tarefas" | "pode_comentar" | "pode_mandar_mensagens",
    currentValue: boolean,
  ) {
    setErrorMessage(null);
    setBusyMemberId(memberId);

    startTransition(async () => {
      const result = await updateMemberPermission(
        roomId,
        memberId,
        field as Parameters<typeof updateMemberPermission>[2],
        !currentValue,
      );

      setBusyMemberId(null);

      if (result?.error) {
        setErrorMessage(result.error);
        return;
      }

      router.refresh();
    });
  }

  function handleConfirmRemove(memberId: string) {
    setErrorMessage(null);
    setBusyMemberId(memberId);

    startTransition(async () => {
      const result = await removeRoomMember(roomId, memberId);

      setBusyMemberId(null);
      setConfirmRemoveId(null);

      if (result?.error) {
        setErrorMessage(result.error);
        return;
      }

      router.refresh();
    });
  }

  return (
    <aside className="w-full bg-[#F5F5F5] dark:bg-[#252525] rounded-2xl p-4 sm:p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-black dark:text-white">
            Membros
          </h2>
          <span className="text-xs px-0.5 py-0.5 rounded-full font-medium">
            ({members.length})
          </span>
        </div>

        <button
          type="button"
          onClick={handleCopyRoomId}
          title="Copiar ID da sala para convidar membros"
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-[#303030] text-black/70 dark:text-white/80 hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
        >
          {copiedRoomId ? (
            <>
              <Check className="w-3.5 h-3.5 text-teal-500" />
              <span className="text-teal-600 dark:text-teal-400">
                ID copiado
              </span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copiar ID</span>
            </>
          )}
        </button>
      </div>

      {errorMessage && (
        <p
          role="alert"
          className="text-xs text-red-600 dark:text-red-400 bg-red-500/10 rounded-lg px-3 py-2"
        >
          {errorMessage}
        </p>
      )}

      <ul className="flex flex-col gap-2.5 max-h-128 overflow-y-auto pr-0.5">
        {members.map((member) => {
          const isCurrentUser = member.id === currentUserId;
          const isMemberBusy = isPending && busyMemberId === member.id;
          const isConfirmingRemoval = confirmRemoveId === member.id;

          return (
            <li
              key={member.id}
              className="rounded-xl p-3 transition-colors bg-white dark:bg-[#1D1D1D]"
            >
              <div className="flex items-center justify-between gap-2">
                <Link
                  href={`/profile/${member.id}`}
                  className="group flex items-center gap-2.5 min-w-0 flex-1"
                >
                  {member.mirrorFoto ? (
                    <img
                      src={member.mirrorFoto}
                      alt={member.username}
                      referrerPolicy="no-referrer"
                      className="w-9 h-9 rounded-full object-cover shrink-0 border border-black/10 dark:border-white/15"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-[#E2E2E2] dark:bg-[#303030] flex items-center justify-center text-sm font-semibold text-black dark:text-white shrink-0">
                      {member.username.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-sm font-medium text-black dark:text-white truncate group-hover:underline">
                        {member.username}
                      </span>
                      {member.isLeader && (
                        <Crown
                          aria-label="Líder da sala"
                          strokeWidth={1.75}
                          className="w-3.5 h-3.5 text-black/60 dark:text-white/60 shrink-0"
                        />
                      )}
                      {isCurrentUser && (
                        <span className="text-[11px] text-black/45 dark:text-white/45 shrink-0">
                          (você)
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-black/50 dark:text-white/50">
                      {member.isLeader ? "Líder" : "Membro"}
                    </span>
                  </div>
                </Link>

                {isRoomLeader && !member.isLeader && (
                  <div className="flex items-center gap-1 shrink-0">
                    {isConfirmingRemoval ? (
                      <>
                        <button
                          type="button"
                          disabled={isMemberBusy}
                          onClick={() => handleConfirmRemove(member.id)}
                          className="px-2 py-1 rounded-md text-[11px] font-semibold bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 cursor-pointer"
                        >
                          Remover
                        </button>
                        <button
                          type="button"
                          disabled={isMemberBusy}
                          onClick={() => setConfirmRemoveId(null)}
                          className="p-1 rounded-md text-black/60 dark:text-white/60 hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer"
                          aria-label="Cancelar remoção"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <>
                        {isFreeRoom && (
                          <button
                            type="button"
                            disabled={isMemberBusy}
                            onClick={() =>
                              handleTogglePermission(
                                member.id,
                                "pode_criar_tarefas",
                                member.podeCriarTarefas,
                              )
                            }
                            title={`Criar tarefas: ${member.podeCriarTarefas ? "Permitido" : "Bloqueado"}`}
                            aria-label={`Alternar permissão de criar tarefas para ${member.username}`}
                            className={`p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50 ${
                              member.podeCriarTarefas
                                ? "text-teal-500 dark:text-teal-400"
                                : "text-black/35 dark:text-white/35"
                            }`}
                          >
                            <PlusCircle className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          type="button"
                          disabled={isMemberBusy}
                          onClick={() =>
                            handleTogglePermission(
                              member.id,
                              "pode_mandar_mensagens",
                              member.podeMandarMensagens,
                            )
                          }
                          title={`Mandar mensagens: ${member.podeMandarMensagens ? "Permitido" : "Bloqueado"}`}
                          aria-label={`Alternar permissão de mandar mensagens para ${member.username}`}
                          className={`p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50 ${
                            member.podeMandarMensagens
                              ? "text-teal-500 dark:text-teal-400"
                              : "text-black/35 dark:text-white/35"
                          }`}
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          disabled={isMemberBusy}
                          onClick={() => setConfirmRemoveId(member.id)}
                          title={`Remover ${member.username} da sala`}
                          aria-label={`Remover ${member.username} da sala`}
                          className="p-1.5 rounded-lg text-black/45 dark:text-white/45 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}