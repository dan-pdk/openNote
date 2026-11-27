"use server";

import authOptions from "@/auth/authOptions";
import controller from "@/db/controller";
import {
    DEFAULT_TASK_COLOR,
    deriveLinkDisplayName,
    isValidUuid,
    normalizeTaskColor,
    normalizeUuid,
    parseCalendarDateString,
    TASK_DESCRIPTION_MAX_LENGTH,
    TASK_LINK_LIMIT,
    TASK_NAME_MAX_LENGTH,
    validateAndNormalizeExternalUrl,
} from "@/lib/tasks";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";

type CreateTaskResult = {
    success?: boolean;
    error?: string;
    taskId?: string;
};

type ParsedTaskLink = {
    nome: string;
    url: string;
};

function extractValidatedLinks(
    rawLinksEntry: FormDataEntryValue | null
): { links: ParsedTaskLink[]; error?: string } {
    if (rawLinksEntry === null) {
        return { links: [] };
    }

    if (typeof rawLinksEntry !== "string") {
        return { links: [], error: "Formato de links inválido." };
    }

    const trimmedPayload = rawLinksEntry.trim();
    if (trimmedPayload.length === 0) {
        return { links: [] };
    }

    let parsedPayload: unknown;
    try {
        parsedPayload = JSON.parse(trimmedPayload);
    } catch {
        return { links: [], error: "Não foi possível processar os links informados." };
    }

    if (!Array.isArray(parsedPayload)) {
        return { links: [], error: "Formato de lista de links inválido." };
    }

    if (parsedPayload.length > TASK_LINK_LIMIT) {
        return {
            links: [],
            error: `Você pode adicionar no máximo ${TASK_LINK_LIMIT} links por tarefa.`,
        };
    }

    const validatedLinks: ParsedTaskLink[] = [];

    for (const candidateItem of parsedPayload) {
        if (!candidateItem || typeof candidateItem !== "object") {
            return { links: [], error: "Item de link inválido." };
        }

        const candidateRecord = candidateItem as Record<string, unknown>;
        const rawUrl = typeof candidateRecord.url === "string" ? candidateRecord.url : "";
        const rawName = typeof candidateRecord.nome === "string" ? candidateRecord.nome : "";

        if (rawUrl.trim().length === 0 && rawName.trim().length === 0) {
            continue;
        }

        if (rawUrl.trim().length === 0) {
            return {
                links: [],
                error: "Informe a URL para todos os links adicionados.",
            };
        }

        const normalizedUrl = validateAndNormalizeExternalUrl(rawUrl);
        if (!normalizedUrl) {
            return {
                links: [],
                error: "Um ou mais links são inválidos. Utilize URLs com http:// ou https://.",
            };
        }

        validatedLinks.push({
            nome: deriveLinkDisplayName(rawName, normalizedUrl),
            url: normalizedUrl,
        });
    }

    return { links: validatedLinks };
}

export default async function createTask(
    targetRoomIdentifier: string,
    formDataPayload: FormData
): Promise<CreateTaskResult> {
    const userSession = await getServerSession(authOptions);
    const authenticatedUserId = userSession?.user?.id;

    if (!userSession || !isValidUuid(authenticatedUserId)) {
        return { error: "Usuário não autenticado." };
    }

    if (!isValidUuid(targetRoomIdentifier)) {
        return { error: "Identificador de sala inválido." };
    }

    if (!formDataPayload || typeof formDataPayload.get !== "function") {
        return { error: "Dados de formulário inválidos." };
    }

    const normalizedUserId = normalizeUuid(authenticatedUserId);
    const normalizedRoomIdentifier = normalizeUuid(targetRoomIdentifier);

    const rawTaskName = formDataPayload.get("taskName");
    if (typeof rawTaskName !== "string") {
        return { error: "Informe o nome da tarefa." };
    }

    const trimmedTaskName = rawTaskName.trim();
    if (trimmedTaskName.length === 0) {
        return { error: "Informe o nome da tarefa." };
    }

    if (trimmedTaskName.length > TASK_NAME_MAX_LENGTH) {
        return {
            error: `O nome da tarefa deve ter no máximo ${TASK_NAME_MAX_LENGTH} caracteres.`,
        };
    }

    const validatedDateString = parseCalendarDateString(formDataPayload.get("date"));
    if (!validatedDateString) {
        return { error: "Informe uma data válida." };
    }

    const rawDescription = formDataPayload.get("description");
    let normalizedDescription: string | null = null;
    if (typeof rawDescription === "string") {
        const trimmedDescription = rawDescription.trim();
        if (trimmedDescription.length > TASK_DESCRIPTION_MAX_LENGTH) {
            return {
                error: `A descrição deve ter no máximo ${TASK_DESCRIPTION_MAX_LENGTH} caracteres.`,
            };
        }
        normalizedDescription = trimmedDescription.length > 0 ? trimmedDescription : null;
    }

    const rawColor = formDataPayload.get("color");
    const validatedColor =
        rawColor === null ? DEFAULT_TASK_COLOR : normalizeTaskColor(rawColor);
    if (!validatedColor) {
        return { error: "Cor selecionada inválida." };
    }

    const { links: validatedLinks, error: linksValidationError } = extractValidatedLinks(
        formDataPayload.get("links")
    );
    if (linksValidationError) {
        return { error: linksValidationError };
    }

    try {
        const roomRows = await controller.runQuery<{
            id: string;
            tipo: string;
            lider_id: string;
        }>("SELECT id, tipo, lider_id FROM salas WHERE id = $1;", [
            normalizedRoomIdentifier,
        ]);

        if (roomRows.length === 0) {
            return { error: "Sala não encontrada." };
        }

        const targetRoom = roomRows[0];
        const isRoomLeader =
            targetRoom.lider_id.toLowerCase() === normalizedUserId;

        if (!isRoomLeader) {
            const membershipRows = await controller.runQuery<{
                pode_criar_tarefas: boolean;
            }>(
                "SELECT pode_criar_tarefas FROM sala_membros WHERE id_usuario = $1 AND id_sala = $2;",
                [normalizedUserId, normalizedRoomIdentifier]
            );

            if (membershipRows.length === 0) {
                return { error: "Você não tem acesso a esta sala." };
            }

            if (targetRoom.tipo !== "livre") {
                return {
                    error: "Apenas o líder pode adicionar tarefas nesta sala restrita.",
                };
            }

            if (membershipRows[0].pode_criar_tarefas === false) {
                return {
                    error: "Você não tem permissão para criar tarefas nesta sala.",
                };
            }
        }

        const dueTimestampValue = `${validatedDateString} 12:00:00`;

        const createdTaskId = await controller.runInTransaction(async (executeQuery) => {
            const insertedTasks = await executeQuery<{ id: string }>(
                `INSERT INTO tarefas (nome, data_entrega, descricao, cor, criador_id, id_sala)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 RETURNING id;`,
                [
                    trimmedTaskName,
                    dueTimestampValue,
                    normalizedDescription,
                    validatedColor,
                    normalizedUserId,
                    normalizedRoomIdentifier,
                ]
            );

            const insertedTaskId = insertedTasks[0]?.id;
            if (!insertedTaskId) {
                throw new Error("Falha ao recuperar o ID da tarefa criada.");
            }

            for (const linkEntry of validatedLinks) {
                await executeQuery(
                    `INSERT INTO anexos (nome, url_anexo, id_tarefa)
                     VALUES ($1, $2, $3);`,
                    [linkEntry.nome, linkEntry.url, insertedTaskId]
                );
            }

            return insertedTaskId;
        });

        revalidatePath(`/rooms/${normalizedRoomIdentifier}`);
        revalidatePath("/dashboard");

        return { success: true, taskId: createdTaskId };
    } catch (databaseOperationError) {
        console.error("Erro ao criar tarefa:", databaseOperationError);
        return { error: "Não foi possível criar a tarefa." };
    }
}
