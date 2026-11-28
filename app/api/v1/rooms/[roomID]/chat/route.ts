import { markTaskMessagesAsRead } from "@/lib/taskReads";
import authOptions from "@/auth/authOptions";
import controller from "@/db/controller";
import {
    CHAT_MESSAGE_MAX_LENGTH,
    ChatMessageItem,
    extractFirstName,
} from "@/lib/chat";
import { isValidUuid, normalizeUuid } from "@/lib/tasks";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

type RoomPermissionRow = {
    lider_id: string;
    membro_usuario_id: string | null;
    pode_mandar_mensagens: boolean | null;
};

type RawMessageRow = {
    id: number;
    conteudo: string;
    autor_id: string | null;
    autor_username: string | null;
    autor_foto: string | null;
    created_at: string;
};

async function resolveRoomChatAccess(
    roomId: string,
    userId: string
): Promise<
    | {
          allowed: true;
          isRoomLeader: boolean;
          canSendMessages: boolean;
      }
    | {
          allowed: false;
          status: number;
          error: string;
      }
> {
    const rows = await controller.runQuery<RoomPermissionRow>(
        `SELECT
            s.lider_id,
            sm.id_usuario AS membro_usuario_id,
            sm.pode_mandar_mensagens
         FROM salas s
         LEFT JOIN sala_membros sm
            ON sm.id_sala = s.id AND sm.id_usuario = $2
         WHERE s.id = $1;`,
        [roomId, userId]
    );

    if (rows.length === 0) {
        return { allowed: false, status: 404, error: "Sala não encontrada." };
    }

    const room = rows[0];
    const isRoomLeader = normalizeUuid(room.lider_id) === userId;
    const isRoomMember = room.membro_usuario_id !== null;

    if (!isRoomLeader && !isRoomMember) {
        return {
            allowed: false,
            status: 403,
            error: "Você não tem acesso a esta sala.",
        };
    }

    const canSendMessages =
        isRoomLeader || room.pode_mandar_mensagens !== false;

    return {
        allowed: true,
        isRoomLeader,
        canSendMessages,
    };
}

async function ensureTaskThreadId(
    roomId: string,
    taskId: string
): Promise<number | null> {
    const taskRows = await controller.runQuery<{
        id: string;
        nome: string;
        criador_id: string | null;
    }>(
        `SELECT id, nome, criador_id
         FROM tarefas
         WHERE id = $1 AND id_sala = $2;`,
        [taskId, roomId]
    );

    if (taskRows.length === 0) {
        return null;
    }

    const existingThreads = await controller.runQuery<{ id: number }>(
        `SELECT id FROM threads WHERE id_tarefa = $1;`,
        [taskId]
    );

    if (existingThreads.length > 0) {
        return existingThreads[0].id;
    }

    const task = taskRows[0];
    const insertedThreads = await controller.runQuery<{ id: number }>(
        `INSERT INTO threads (nome, autor_id, id_tarefa)
         VALUES ($1, $2, $3)
         ON CONFLICT (id_tarefa) DO UPDATE SET id_tarefa = EXCLUDED.id_tarefa
         RETURNING id;`,
        [task.nome, task.criador_id, task.id]
    );

    return insertedThreads[0]?.id ?? null;
}

function mapMessageRow(row: RawMessageRow): ChatMessageItem {
    const normalizedAuthorId = row.autor_id ? normalizeUuid(row.autor_id) : null;
    const username = row.autor_username?.trim() || "Usuário removido";

    return {
        id: Number(row.id),
        conteudo: row.conteudo,
        autorId: normalizedAuthorId,
        autorUsername: username,
        autorFirstName: normalizedAuthorId
            ? extractFirstName(username)
            : "Usuário removido",
        autorFoto: row.autor_foto,
        createdAt: row.created_at,
    };
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ roomID: string }> }
) {
    const session = await getServerSession(authOptions);
    const rawUserId = session?.user?.id;

    if (!session || !isValidUuid(rawUserId)) {
        return NextResponse.json(
            { error: "Usuário não autenticado." },
            { status: 401 }
        );
    }

    const { roomID } = await params;
    if (!isValidUuid(roomID)) {
        return NextResponse.json(
            { error: "Identificador de sala inválido." },
            { status: 400 }
        );
    }

    const normalizedUserId = normalizeUuid(rawUserId);
    const normalizedRoomId = normalizeUuid(roomID);
    const chatType = request.nextUrl.searchParams.get("type");
    const rawTaskId = request.nextUrl.searchParams.get("taskId");

    if (chatType !== "room" && chatType !== "task") {
        return NextResponse.json(
            { error: "Tipo de conversa inválido." },
            { status: 400 }
        );
    }

    if (chatType === "task" && !isValidUuid(rawTaskId)) {
        return NextResponse.json(
            { error: "Identificador de tarefa inválido." },
            { status: 400 }
        );
    }

    try {
        const access = await resolveRoomChatAccess(
            normalizedRoomId,
            normalizedUserId
        );

        if (!access.allowed) {
            return NextResponse.json(
                { error: access.error },
                { status: access.status }
            );
        }

        if (chatType === "room") {
            const rows = await controller.runQuery<RawMessageRow>(
                `SELECT
                    sm.id,
                    sm.conteudo,
                    sm.autor_id,
                    u.username AS autor_username,
                    u.mirror_foto AS autor_foto,
                    TO_CHAR(sm.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS created_at
                 FROM sala_mensagens sm
                 LEFT JOIN usuarios u ON u.id = sm.autor_id
                 WHERE sm.id_sala = $1
                 ORDER BY sm.created_at ASC, sm.id ASC;`,
                [normalizedRoomId]
            );

            return NextResponse.json({
                messages: rows.map(mapMessageRow),
                canSendMessages: access.canSendMessages,
                isRoomLeader: access.isRoomLeader,
            });
        }

        const normalizedTaskId = normalizeUuid(rawTaskId as string);
        const threadId = await ensureTaskThreadId(
            normalizedRoomId,
            normalizedTaskId
        );

        if (!threadId) {
            return NextResponse.json(
                { error: "Tarefa não encontrada nesta sala." },
                { status: 404 }
            );
        }

        const rows = await controller.runQuery<RawMessageRow>(
            `SELECT
                c.id,
                c.conteudo,
                c.autor_id,
                u.username AS autor_username,
                u.mirror_foto AS autor_foto,
                TO_CHAR(c.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS created_at
             FROM comentarios c
             LEFT JOIN usuarios u ON u.id = c.autor_id
             WHERE c.pertence_a = $1
             ORDER BY c.created_at ASC, c.id ASC;`,
            [threadId]
        );

        const maxCommentId =
            rows.length > 0
                ? Math.max(...rows.map((row) => Number(row.id)))
                : 0;

        await markTaskMessagesAsRead(
            normalizedUserId,
            normalizedTaskId,
            maxCommentId
        );

        return NextResponse.json({
            messages: rows.map(mapMessageRow),
            canSendMessages: access.canSendMessages,
            isRoomLeader: access.isRoomLeader,
        });
    } catch (error) {
        console.error("Erro ao carregar mensagens do chat:", error);
        return NextResponse.json(
            { error: "Não foi possível carregar a conversa." },
            { status: 500 }
        );
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ roomID: string }> }
) {
    const session = await getServerSession(authOptions);
    const rawUserId = session?.user?.id;

    if (!session || !isValidUuid(rawUserId)) {
        return NextResponse.json(
            { error: "Usuário não autenticado." },
            { status: 401 }
        );
    }

    const { roomID } = await params;
    if (!isValidUuid(roomID)) {
        return NextResponse.json(
            { error: "Identificador de sala inválido." },
            { status: 400 }
        );
    }

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json(
            { error: "Corpo da requisição inválido." },
            { status: 400 }
        );
    }

    if (!body || typeof body !== "object") {
        return NextResponse.json(
            { error: "Dados inválidos." },
            { status: 400 }
        );
    }

    const payload = body as Record<string, unknown>;
    const chatType = payload.type;
    const rawTaskId = payload.taskId;
    const rawContent = payload.conteudo;

    if (chatType !== "room" && chatType !== "task") {
        return NextResponse.json(
            { error: "Tipo de conversa inválido." },
            { status: 400 }
        );
    }

    if (chatType === "task" && !isValidUuid(rawTaskId)) {
        return NextResponse.json(
            { error: "Identificador de tarefa inválido." },
            { status: 400 }
        );
    }

    if (typeof rawContent !== "string") {
        return NextResponse.json(
            { error: "Digite uma mensagem." },
            { status: 400 }
        );
    }

    const trimmedContent = rawContent.trim();
    if (trimmedContent.length === 0) {
        return NextResponse.json(
            { error: "A mensagem não pode estar vazia." },
            { status: 400 }
        );
    }

    if (trimmedContent.length > CHAT_MESSAGE_MAX_LENGTH) {
        return NextResponse.json(
            {
                error: `A mensagem deve ter no máximo ${CHAT_MESSAGE_MAX_LENGTH} caracteres.`,
            },
            { status: 400 }
        );
    }

    const normalizedUserId = normalizeUuid(rawUserId);
    const normalizedRoomId = normalizeUuid(roomID);

    try {
        const access = await resolveRoomChatAccess(
            normalizedRoomId,
            normalizedUserId
        );

        if (!access.allowed) {
            return NextResponse.json(
                { error: access.error },
                { status: access.status }
            );
        }

        if (!access.canSendMessages) {
            return NextResponse.json(
                {
                    error: "Você não tem permissão para enviar mensagens nesta sala.",
                    canSendMessages: false,
                },
                { status: 403 }
            );
        }

        if (chatType === "room") {
            const insertedRows = await controller.runQuery<RawMessageRow>(
                `WITH inserted AS (
                    INSERT INTO sala_mensagens (conteudo, autor_id, id_sala)
                    VALUES ($1, $2, $3)
                    RETURNING id, conteudo, autor_id, created_at
                )
                SELECT
                    i.id,
                    i.conteudo,
                    i.autor_id,
                    u.username AS autor_username,
                    u.mirror_foto AS autor_foto,
                    TO_CHAR(i.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS created_at
                FROM inserted i
                LEFT JOIN usuarios u ON u.id = i.autor_id;`,
                [trimmedContent, normalizedUserId, normalizedRoomId]
            );

            return NextResponse.json(
                { message: mapMessageRow(insertedRows[0]) },
                { status: 201 }
            );
        }

        const normalizedTaskId = normalizeUuid(rawTaskId as string);
        const threadId = await ensureTaskThreadId(
            normalizedRoomId,
            normalizedTaskId
        );

        if (!threadId) {
            return NextResponse.json(
                { error: "Tarefa não encontrada nesta sala." },
                { status: 404 }
            );
        }

        const insertedRows = await controller.runQuery<RawMessageRow>(
            `WITH inserted AS (
                INSERT INTO comentarios (conteudo, autor_id, pertence_a)
                VALUES ($1, $2, $3)
                RETURNING id, conteudo, autor_id, created_at
            )
            SELECT
                i.id,
                i.conteudo,
                i.autor_id,
                u.username AS autor_username,
                u.mirror_foto AS autor_foto,
                TO_CHAR(i.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS created_at
            FROM inserted i
            LEFT JOIN usuarios u ON u.id = i.autor_id;`,
            [trimmedContent, normalizedUserId, threadId]
        );

        const createdMessage = mapMessageRow(insertedRows[0]);
        await markTaskMessagesAsRead(
            normalizedUserId,
            normalizedTaskId,
            createdMessage.id
        );

        return NextResponse.json(
            { message: createdMessage },
            { status: 201 }
        );
    } catch (error) {
        console.error("Erro ao enviar mensagem:", error);
        return NextResponse.json(
            { error: "Não foi possível enviar a mensagem." },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ roomID: string }> }
) {
    const session = await getServerSession(authOptions);
    const rawUserId = session?.user?.id;

    if (!session || !isValidUuid(rawUserId)) {
        return NextResponse.json(
            { error: "Usuário não autenticado." },
            { status: 401 }
        );
    }

    const { roomID } = await params;
    if (!isValidUuid(roomID)) {
        return NextResponse.json(
            { error: "Identificador de sala inválido." },
            { status: 400 }
        );
    }

    const chatType = request.nextUrl.searchParams.get("type");
    const rawMessageId = request.nextUrl.searchParams.get("messageId");
    const rawTaskId = request.nextUrl.searchParams.get("taskId");

    if (chatType !== "room" && chatType !== "task") {
        return NextResponse.json(
            { error: "Tipo de conversa inválido." },
            { status: 400 }
        );
    }

    const messageId = Number(rawMessageId);
    if (!Number.isInteger(messageId) || messageId <= 0) {
        return NextResponse.json(
            { error: "Identificador de mensagem inválido." },
            { status: 400 }
        );
    }

    if (chatType === "task" && !isValidUuid(rawTaskId)) {
        return NextResponse.json(
            { error: "Identificador de tarefa inválido." },
            { status: 400 }
        );
    }

    const normalizedUserId = normalizeUuid(rawUserId);
    const normalizedRoomId = normalizeUuid(roomID);

    try {
        const access = await resolveRoomChatAccess(
            normalizedRoomId,
            normalizedUserId
        );

        if (!access.allowed) {
            return NextResponse.json(
                { error: access.error },
                { status: access.status }
            );
        }

        if (chatType === "room") {
            const deletedRows = await controller.runQuery<{ id: number }>(
                `DELETE FROM sala_mensagens
                 WHERE id = $1
                   AND id_sala = $2
                   AND ($3::boolean = TRUE OR autor_id = $4::uuid)
                 RETURNING id;`,
                [
                    messageId,
                    normalizedRoomId,
                    access.isRoomLeader,
                    normalizedUserId,
                ]
            );

            if (deletedRows.length === 0) {
                return NextResponse.json(
                    {
                        error: "Mensagem não encontrada ou você não tem permissão para excluí-la.",
                    },
                    { status: 403 }
                );
            }

            return NextResponse.json({ success: true });
        }

        const normalizedTaskId = normalizeUuid(rawTaskId as string);
        const deletedRows = await controller.runQuery<{ id: number }>(
            `DELETE FROM comentarios c
             USING threads th, tarefas t
             WHERE c.id = $1
               AND c.pertence_a = th.id
               AND th.id_tarefa = t.id
               AND t.id = $2
               AND t.id_sala = $3
               AND ($4::boolean = TRUE OR c.autor_id = $5::uuid)
             RETURNING c.id;`,
            [
                messageId,
                normalizedTaskId,
                normalizedRoomId,
                access.isRoomLeader,
                normalizedUserId,
            ]
        );

        if (deletedRows.length === 0) {
            return NextResponse.json(
                {
                    error: "Mensagem não encontrada ou você não tem permissão para excluí-la.",
                },
                { status: 403 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Erro ao excluir mensagem:", error);
        return NextResponse.json(
            { error: "Não foi possível excluir a mensagem." },
            { status: 500 }
        );
    }
}