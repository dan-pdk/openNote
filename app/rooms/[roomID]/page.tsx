import authOptions from "@/auth/authOptions";
import joinRoom from "@/actions/joinRoom";
import DashboardMenu from "@/components/DashboardMenu";
import Header from "@/components/Header";
import type { RoomMemberItem } from "@/components/RoomMembersPanel";
import RoomWorkspace from "@/components/RoomWorkspace";
import controller from "@/db/controller";
import { ensureTaskReadsTable } from "@/lib/taskReads";
import {
  DEFAULT_TASK_COLOR,
  isValidUuid,
  normalizeTaskColor,
  normalizeUuid,
  RoomTaskItem,
  TaskLinkItem,
  validateAndNormalizeExternalUrl,
} from "@/lib/tasks";
import { Lock, LockOpen, UserPlus } from "lucide-react";
import { getServerSession } from "next-auth";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

type RoomAccessRow = {
  id: string;
  nome: string;
  tipo: string;
  icone_url: string | null;
  lider_id: string;
  lider_username: string;
  lider_foto: string | null;
  membro_usuario_id: string | null;
  pode_criar_tarefas: boolean | null;
  pode_mandar_mensagens: boolean | null;
};

type MemberRow = {
  id: string;
  username: string;
  mirror_foto: string | null;
  pode_criar_tarefas: boolean;
  pode_mandar_mensagens: boolean;
};

type TaskRow = {
  id: string;
  nome: string;
  descricao: string | null;
  data_entrega_str: string;
  cor: string | null;
  concluida: boolean;
  criador_id: string | null;
  autor_nome: string | null;
  has_unread_messages: boolean;
};

type AttachmentRow = {
  id: number;
  nome: string;
  url_anexo: string;
  id_tarefa: string;
};

export default async function Page({
  params,
}: {
  params: Promise<{ roomID: string }>;
}) {
  const userSession = await getServerSession(authOptions);
  const authenticatedUserId = userSession?.user?.id;

  if (!userSession || !isValidUuid(authenticatedUserId)) {
    redirect("/login");
  }

  const { roomID } = await params;
  if (!isValidUuid(roomID)) {
    notFound();
  }

  const normalizedUserId = normalizeUuid(authenticatedUserId);
  const normalizedRoomIdentifier = normalizeUuid(roomID);

  const roomRows = await controller.runQuery<RoomAccessRow>(
    `SELECT
            s.id,
            s.nome,
            s.tipo,
            s.icone_url,
            s.lider_id,
            lider.username AS lider_username,
            lider.mirror_foto AS lider_foto,
            sm.id_usuario AS membro_usuario_id,
            sm.pode_criar_tarefas,
            sm.pode_mandar_mensagens
         FROM salas s
         INNER JOIN usuarios lider ON lider.id = s.lider_id
         LEFT JOIN sala_membros sm
            ON sm.id_sala = s.id AND sm.id_usuario = $2
         WHERE s.id = $1;`,
    [normalizedRoomIdentifier, normalizedUserId],
  );

  if (roomRows.length === 0) {
    notFound();
  }

  const targetRoom = roomRows[0];
  const normalizedLeaderId = normalizeUuid(targetRoom.lider_id);
  const isRoomLeader = normalizedLeaderId === normalizedUserId;
  const isRoomMember = targetRoom.membro_usuario_id !== null;
  const roomType = targetRoom.tipo === "livre" ? "livre" : "restrita";
  const isRestrictedRoom = roomType === "restrita";

  if (!isRoomLeader && !isRoomMember) {
    async function handleConfirmJoinRoom() {
      "use server";
      const formData = new FormData();
      formData.set("roomId", normalizedRoomIdentifier);
      await joinRoom(formData);
    }

    return (
      <div className="min-h-screen bg-white dark:bg-[#1D1D1D]">
        <Header />
        <DashboardMenu />

        <main className="px-4 py-12 max-w-md mx-auto flex flex-col items-center text-center gap-6">
          {!targetRoom.icone_url ? (
            <div className="w-24 h-24 rounded-full bg-[#E2E2E2] dark:bg-[#303030] flex items-center justify-center text-4xl font-bold text-black dark:text-white">
              {targetRoom.nome.charAt(0).toUpperCase()}
            </div>
          ) : (
            <Image
              width={192}
              height={192}
              quality={95}
              src={targetRoom.icone_url}
              alt={targetRoom.nome}
              className="w-24 h-24 rounded-full object-cover"
            />
          )}

          <div className="flex flex-col items-center gap-2">
            <span
              className={`px-3 py-1 text-xs font-semibold flex items-center gap-1.5 rounded-full ${
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
              <span>{isRestrictedRoom ? "Sala Restrita" : "Sala Livre"}</span>
            </span>

            <h1 className="text-2xl font-bold text-black dark:text-white">
              {targetRoom.nome}
            </h1>
            <p className="text-sm text-black/60 dark:text-white/60">
              Líder: {targetRoom.lider_username}
            </p>
          </div>

          <form action={handleConfirmJoinRoom} className="w-full flex flex-col gap-3">
            <button
              type="submit"
              className="w-full py-3 px-5 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Entrar na sala</span>
            </button>

            <Link
              href="/rooms"
              className="w-full py-2.5 px-5 rounded-xl text-sm font-medium text-black/60 dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
              Voltar para minhas salas
            </Link>
          </form>
        </main>
      </div>
    );
  }

  const canCreateTasks =
    isRoomLeader ||
    (roomType === "livre" && targetRoom.pode_criar_tarefas !== false);
  const canSendMessages =
    isRoomLeader || targetRoom.pode_mandar_mensagens !== false;

  await ensureTaskReadsTable();

  const [taskRows, attachmentRows, memberRows] = await Promise.all([
    controller.runQuery<TaskRow>(
      `SELECT
                t.id,
                t.nome,
                t.descricao,
                TO_CHAR(t.data_entrega, 'YYYY-MM-DD') AS data_entrega_str,
                t.cor,
                (tc.id_usuario IS NOT NULL) AS concluida,
                t.criador_id,
                u.username AS autor_nome,
                EXISTS (
                    SELECT 1
                    FROM threads th
                    INNER JOIN comentarios c ON c.pertence_a = th.id
                    LEFT JOIN tarefa_leituras tl
                        ON tl.id_tarefa = t.id AND tl.id_usuario = $2
                    WHERE th.id_tarefa = t.id
                      AND c.id > COALESCE(tl.ultimo_comentario_id, 0)
                      AND (c.autor_id IS NULL OR c.autor_id <> $2)
                ) AS has_unread_messages
             FROM tarefas t
             LEFT JOIN usuarios u ON u.id = t.criador_id
             LEFT JOIN tarefa_conclusoes tc
                ON tc.id_tarefa = t.id AND tc.id_usuario = $2
             WHERE t.id_sala = $1 AND t.data_entrega IS NOT NULL
             ORDER BY t.data_entrega ASC, t.data_criacao ASC;`,
      [normalizedRoomIdentifier, normalizedUserId],
    ),
    controller.runQuery<AttachmentRow>(
      `SELECT a.id, a.nome, a.url_anexo, a.id_tarefa
             FROM anexos a
             INNER JOIN tarefas t ON t.id = a.id_tarefa
             WHERE t.id_sala = $1
             ORDER BY a.data_adicao ASC, a.id ASC;`,
      [normalizedRoomIdentifier],
    ),
    controller.runQuery<MemberRow>(
      `SELECT
                u.id,
                u.username,
                u.mirror_foto,
                sm.pode_criar_tarefas,
                sm.pode_mandar_mensagens
             FROM sala_membros sm
             INNER JOIN usuarios u ON u.id = sm.id_usuario
             WHERE sm.id_sala = $1
             ORDER BY (u.id = $2) DESC, sm.data_entrada ASC, u.username ASC;`,
      [normalizedRoomIdentifier, normalizedLeaderId],
    ),
  ]);

  const orderedMembers: RoomMemberItem[] = [];
  const leaderInMembers = memberRows.find(
    (row) => normalizeUuid(row.id) === normalizedLeaderId,
  );

  orderedMembers.push({
    id: normalizedLeaderId,
    username: leaderInMembers?.username || targetRoom.lider_username,
    mirrorFoto: leaderInMembers?.mirror_foto ?? targetRoom.lider_foto,
    isLeader: true,
    podeCriarTarefas: true,
    podeMandarMensagens: true,
  });

  for (const memberRow of memberRows) {
    const normalizedMemberId = normalizeUuid(memberRow.id);
    if (normalizedMemberId === normalizedLeaderId) {
      continue;
    }

    orderedMembers.push({
      id: normalizedMemberId,
      username: memberRow.username,
      mirrorFoto: memberRow.mirror_foto,
      isLeader: false,
      podeCriarTarefas: Boolean(memberRow.pode_criar_tarefas),
      podeMandarMensagens: Boolean(memberRow.pode_mandar_mensagens),
    });
  }

  const linksByTaskId = new Map<string, TaskLinkItem[]>();
  for (const attachmentRow of attachmentRows) {
    const safeUrl = validateAndNormalizeExternalUrl(attachmentRow.url_anexo);
    if (!safeUrl) {
      continue;
    }

    const existingLinks = linksByTaskId.get(attachmentRow.id_tarefa) ?? [];
    existingLinks.push({
      id: attachmentRow.id,
      nome: attachmentRow.nome,
      url_anexo: safeUrl,
    });
    linksByTaskId.set(attachmentRow.id_tarefa, existingLinks);
  }

  const roomTasks: RoomTaskItem[] = taskRows.map((taskRow) => ({
    id: taskRow.id,
    nome: taskRow.nome,
    descricao: taskRow.descricao,
    dataEntrega: taskRow.data_entrega_str,
    cor: normalizeTaskColor(taskRow.cor) ?? DEFAULT_TASK_COLOR,
    concluida: Boolean(taskRow.concluida),
    criadorId: taskRow.criador_id ? normalizeUuid(taskRow.criador_id) : null,
    autorNome: taskRow.autor_nome?.trim() || "Usuário removido",
    links: linksByTaskId.get(taskRow.id) ?? [],
    hasUnreadMessages: Boolean(taskRow.has_unread_messages),
  }));

  return (
    <Suspense
      fallback={<div className="min-h-screen bg-white dark:bg-[#1D1D1D]" />}
    >
      <div className="min-h-screen bg-white dark:bg-[#1D1D1D]">
        <Header />
        <DashboardMenu />

        <main className="px-4 py-6 lg:px-10 max-w-7xl mx-auto flex flex-col gap-8">
          <RoomWorkspace
            roomId={normalizedRoomIdentifier}
            roomName={targetRoom.nome}
            roomIconUrl={targetRoom.icone_url}
            roomType={roomType}
            leaderUsername={targetRoom.lider_username}
            tasks={roomTasks}
            members={orderedMembers}
            currentUserId={normalizedUserId}
            currentUserName={userSession.user?.name?.trim() || "Você"}
            isRoomLeader={isRoomLeader}
            canCreateTasks={canCreateTasks}
            canSendMessages={canSendMessages}
          />
        </main>
      </div>
    </Suspense>
  );
}