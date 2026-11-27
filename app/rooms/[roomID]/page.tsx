import authOptions from "@/auth/authOptions";
import Calendar from "@/components/Calendar";
import DashboardMenu from "@/components/DashboardMenu";
import Header from "@/components/Header";
import controller from "@/db/controller";
import {
    DEFAULT_TASK_COLOR,
    isValidUuid,
    normalizeTaskColor,
    normalizeUuid,
    RoomTaskItem,
    TaskLinkItem,
    validateAndNormalizeExternalUrl,
} from "@/lib/tasks";
import { ArrowLeft, Lock, LockOpen } from "lucide-react";
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
    membro_usuario_id: string | null;
    pode_criar_tarefas: boolean | null;
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
            sm.id_usuario AS membro_usuario_id,
            sm.pode_criar_tarefas
         FROM salas s
         LEFT JOIN sala_membros sm
            ON sm.id_sala = s.id AND sm.id_usuario = $2
         WHERE s.id = $1;`,
        [normalizedRoomIdentifier, normalizedUserId]
    );

    if (roomRows.length === 0) {
        notFound();
    }

    const targetRoom = roomRows[0];
    const isRoomLeader =
        targetRoom.lider_id.toLowerCase() === normalizedUserId;
    const isRoomMember = targetRoom.membro_usuario_id !== null;

    if (!isRoomLeader && !isRoomMember) {
        notFound();
    }

    const roomType = targetRoom.tipo === "livre" ? "livre" : "restrita";
    const canCreateTasks =
        isRoomLeader ||
        (roomType === "livre" && targetRoom.pode_criar_tarefas !== false);

    const [taskRows, attachmentRows] = await Promise.all([
        controller.runQuery<TaskRow>(
            `SELECT
                t.id,
                t.nome,
                t.descricao,
                TO_CHAR(t.data_entrega, 'YYYY-MM-DD') AS data_entrega_str,
                t.cor,
                (tc.id_usuario IS NOT NULL) AS concluida,
                t.criador_id,
                u.username AS autor_nome
             FROM tarefas t
             LEFT JOIN usuarios u ON u.id = t.criador_id
             LEFT JOIN tarefa_conclusoes tc
                ON tc.id_tarefa = t.id AND tc.id_usuario = $2
             WHERE t.id_sala = $1 AND t.data_entrega IS NOT NULL
             ORDER BY t.data_entrega ASC, t.data_criacao ASC;`,
            [normalizedRoomIdentifier, normalizedUserId]
        ),
        controller.runQuery<AttachmentRow>(
            `SELECT a.id, a.nome, a.url_anexo, a.id_tarefa
             FROM anexos a
             INNER JOIN tarefas t ON t.id = a.id_tarefa
             WHERE t.id_sala = $1
             ORDER BY a.data_adicao ASC, a.id ASC;`,
            [normalizedRoomIdentifier]
        ),
    ]);

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
    }));

    const isRestrictedRoom = roomType === "restrita";

    return (
        <Suspense fallback={<div className="min-h-screen bg-white dark:bg-[#1D1D1D]" />}>
            <div className="min-h-screen bg-white dark:bg-[#1D1D1D]">
                <Header />
                <DashboardMenu />

                <main className="px-4 py-6 lg:px-10 lg:max-w-5xl lg:mx-auto flex flex-col gap-6">
                    <div>
                        <Link
                            href="/rooms"
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white transition-colors mb-2"
                        >
                            <ArrowLeft className="w-3 h-3" />
                            <span>Voltar</span>
                        </Link>

                        <div className="flex items-center justify-between gap-4 flex-wrap">
                            <div className="flex items-center gap-3 min-w-0">
                                {!targetRoom.icone_url ? (
                                    <div className="w-10 h-10 rounded-full bg-[#E2E2E2] dark:bg-[#303030] flex items-center justify-center font-semibold text-black dark:text-white shrink-0">
                                        {targetRoom.nome.charAt(0).toUpperCase()}
                                    </div>
                                ) : (
                                    <Image
                                        width={40}
                                        height={40}
                                        src={targetRoom.icone_url}
                                        alt={targetRoom.nome}
                                        className="w-10 h-10 rounded-full object-cover shrink-0"
                                    />
                                )}

                                <div className="flex flex-col min-w-0">
                                    <h1 className="text-2xl font-semibold text-black dark:text-white truncate">
                                        {targetRoom.nome}
                                    </h1>
                                    <span className="text-xs text-black/50 dark:text-white/50">
                                        {isRoomLeader ? "Líder" : "Membro"}
                                    </span>
                                </div>
                            </div>

                            <span
                                title={isRestrictedRoom ? "Sala restrita" : "Sala livre"}
                                className={`px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 rounded-full shrink-0 ${
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
                                <span>{isRestrictedRoom ? "Restrita" : "Livre"}</span>
                            </span>
                        </div>
                    </div>

                    <Calendar
                        roomId={normalizedRoomIdentifier}
                        tasks={roomTasks}
                        currentUserId={normalizedUserId}
                        currentUserName={userSession.user?.name?.trim() || "Você"}
                        isRoomLeader={isRoomLeader}
                        canCreateTasks={canCreateTasks}
                    />
                </main>
            </div>
        </Suspense>
    );
}
