import { Suspense } from "react";
import Image from "next/image";
import DashboardMenu from "@/components/DashboardMenu";
import Rooms from "@/components/Rooms";
import { getServerSession } from "next-auth";
import controller from "@/db/controller";
import authOptions from "@/auth/authOptions";
import Header from "@/components/Header";
import AddRoomButton from "@/components/AddRoomModal";
import Link from "next/link";
import GenericWideButton from "@/components/GenericWideButton";
import { ensureTaskReadsTable } from "@/lib/taskReads";
import {
    DEFAULT_TASK_COLOR,
    formatRelativeTaskDate,
    isValidUuid,
    normalizeTaskColor,
    normalizeUuid,
} from "@/lib/tasks";

export const dynamic = "force-dynamic";

type DashboardRoomRow = {
    id: string;
    nome: string;
    icone_url: string | null;
    tipo: "livre" | "restrita";
    created_at: string;
};

type UrgentTaskRow = {
    id: string;
    nome: string;
    data_entrega_str: string;
    cor: string | null;
    sala_id: string;
    sala_nome: string;
    has_unread_messages: boolean;
};

type UrgentTaskItem = {
    id: string;
    nome: string;
    dataEntrega: string;
    cor: string;
    salaId: string;
    salaNome: string;
    hasUnreadMessages: boolean;
};

export default async function Page() {
    let rooms: DashboardRoomRow[] = [];
    let urgentTasks: UrgentTaskItem[] = [];

    const todayDateString = new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Sao_Paulo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(new Date());

    try {
        const session = await getServerSession(authOptions);
        const rawUserId = session?.user?.id;

        if (session && isValidUuid(rawUserId)) {
            const normalizedUserId = normalizeUuid(rawUserId);
            await ensureTaskReadsTable();

            const [roomsData, urgentTaskRows] = await Promise.all([
                controller.runQuery<DashboardRoomRow>(
                    `SELECT DISTINCT s.id, s.nome, s.icone_url, s.tipo, s.created_at
                     FROM salas s
                     LEFT JOIN sala_membros sm ON s.id = sm.id_sala
                     WHERE s.lider_id = $1 OR sm.id_usuario = $1
                     ORDER BY s.created_at;`,
                    [normalizedUserId]
                ),
                controller.runQuery<UrgentTaskRow>(
                    `SELECT
                        t.id,
                        t.nome,
                        TO_CHAR(t.data_entrega, 'YYYY-MM-DD') AS data_entrega_str,
                        t.cor,
                        s.id AS sala_id,
                        s.nome AS sala_nome,
                        EXISTS (
                            SELECT 1
                            FROM threads th
                            INNER JOIN comentarios c ON c.pertence_a = th.id
                            LEFT JOIN tarefa_leituras tl
                                ON tl.id_tarefa = t.id AND tl.id_usuario = $1
                            WHERE th.id_tarefa = t.id
                              AND c.id > COALESCE(tl.ultimo_comentario_id, 0)
                              AND (c.autor_id IS NULL OR c.autor_id <> $1)
                        ) AS has_unread_messages
                     FROM tarefas t
                     INNER JOIN salas s ON s.id = t.id_sala
                     LEFT JOIN tarefa_conclusoes tc
                        ON tc.id_tarefa = t.id AND tc.id_usuario = $1
                     WHERE (
                        s.lider_id = $1
                        OR EXISTS (
                            SELECT 1
                            FROM sala_membros sm
                            WHERE sm.id_sala = s.id AND sm.id_usuario = $1
                        )
                     )
                       AND t.data_entrega IS NOT NULL
                       AND tc.id_usuario IS NULL
                     ORDER BY t.data_entrega ASC, t.data_criacao ASC
                     LIMIT 5;`,
                    [normalizedUserId]
                ),
            ]);

            rooms = roomsData || [];
            urgentTasks = (urgentTaskRows || []).map((row) => ({
                id: row.id,
                nome: row.nome,
                dataEntrega: row.data_entrega_str,
                cor: normalizeTaskColor(row.cor) ?? DEFAULT_TASK_COLOR,
                salaId: normalizeUuid(row.sala_id),
                salaNome: row.sala_nome,
                hasUnreadMessages: Boolean(row.has_unread_messages),
            }));
        }
    } catch (error) {
        console.error("Erro ao carregar dados no dashboard.", error);
    }

    return (
        <Suspense fallback={<div className="min-h-screen bg-white dark:bg-[#1D1D1D]" />}>
            <div className="min-h-screen bg-white dark:bg-[#1D1D1D]">
                <Header />

                <main className="px-4 py-6 lg:px-10 lg:max-w-5xl lg:mx-auto">
                    <h1 className="text-2xl font-semibold mb-6 text-black dark:text-white">Início</h1>

                    <div className="lg:grid lg:grid-cols-2 lg:gap-10">
                        <section>
                            <div className="flex items-baseline justify-between">
                                <span className="text-xs font-medium text-black/50 dark:text-white/50 uppercase tracking-wide">Salas</span>
                                <span className="text-xs text-black/50 dark:text-white/50">{rooms.length}</span>
                            </div>
                            <h2 className="text-lg font-semibold mb-3 text-black dark:text-white">Salas recentes</h2>

                            <div className="flex flex-col gap-3">
                                <Rooms rooms={rooms.slice(-3).reverse()} />
                                {rooms.length > 3 && (
                                    <Link href="/rooms" className="self-end flex items-end justify-end w-fit">
                                        <span className="underline cursor-pointer text-xs font-medium text-black/50 dark:text-white/50 tracking-wide text-end">
                                            ...e {rooms.length - 3} mais
                                        </span>
                                    </Link>
                                )}
                                <AddRoomButton />
                                <GenericWideButton label="Ver Todas" href="/rooms" />
                            </div>
                        </section>

                        <section className="mt-8 lg:mt-0">
                            <div className="flex items-baseline justify-between">
                                <span className="text-xs font-medium text-black/50 dark:text-white/50 uppercase tracking-wide">Agenda</span>
                                <span className="text-xs text-black/50 dark:text-white/50">{urgentTasks.length}</span>
                            </div>
                            <h2 className="text-lg font-semibold mb-3 text-black dark:text-white">Próximas tarefas</h2>

                            {urgentTasks.length > 0 ? (
                                <div className="flex flex-col gap-3">
                                    {urgentTasks.map((task) => {
                                        const dateInfo = formatRelativeTaskDate(
                                            task.dataEntrega,
                                            todayDateString
                                        );

                                        return (
                                            <Link
                                                key={task.id}
                                                href={`/rooms/${task.salaId}`}
                                                className="flex items-center gap-3 bg-[#E2E2E2] dark:bg-[#303030] rounded-xl p-3 text-left hover:scale-[1.02] duration-200 cursor-pointer"
                                            >
                                                <span
                                                    className="w-3 h-3 rounded-full shrink-0"
                                                    style={{ backgroundColor: task.cor }}
                                                />

                                                <div className="flex-1 min-w-0 flex flex-col">
                                                    <span className="font-medium text-black dark:text-white truncate">
                                                        {task.nome}
                                                    </span>
                                                    <span className="text-xs text-black dark:text-white truncate">
                                                        de: {task.salaNome}
                                                    </span>
                                                </div>

                                                {task.hasUnreadMessages && (
                                                    <span
                                                        title="Mensagens não lidas"
                                                        aria-label="Mensagens não lidas"
                                                        className="w-2 h-2 rounded-full bg-[#E60000] shrink-0"
                                                    />
                                                )}

                                                <span
                                                    className={`text-xs font-medium shrink-0 ${
                                                        dateInfo.isOverdue
                                                            ? "text-[#E60000] dark:text-red-400 font-semibold"
                                                            : dateInfo.isToday
                                                              ? "text-teal-600 dark:text-teal-400 font-semibold"
                                                              : "text-black/50 dark:text-white/50"
                                                    }`}
                                                >
                                                    {dateInfo.label}
                                                </span>

                                                <Image
                                                    src={"/ChevronRight.svg"}
                                                    width={20}
                                                    height={20}
                                                    alt=""
                                                    className="dark:invert shrink-0"
                                                />
                                            </Link>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-sm text-black/60 dark:text-white/60">
                                    Nenhuma tarefa pendente por aqui
                                </p>
                            )}
                        </section>
                    </div>
                </main>

                <DashboardMenu />
            </div>
        </Suspense>
    );
}