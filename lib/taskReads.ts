import controller from "@/db/controller";

let hasEnsuredTaskReadsTable = false;

export async function ensureTaskReadsTable(): Promise<void> {
    if (hasEnsuredTaskReadsTable) {
        return;
    }

    await controller.runQuery(
        `CREATE TABLE IF NOT EXISTS tarefa_leituras (
            id_usuario UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
            id_tarefa UUID NOT NULL REFERENCES tarefas(id) ON DELETE CASCADE,
            ultimo_comentario_id INT NOT NULL DEFAULT 0,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id_usuario, id_tarefa)
        );`
    );

    hasEnsuredTaskReadsTable = true;
}

export async function markTaskMessagesAsRead(
    userId: string,
    taskId: string,
    lastCommentId: number
): Promise<void> {
    await ensureTaskReadsTable();

    const safeLastCommentId =
        Number.isInteger(lastCommentId) && lastCommentId > 0 ? lastCommentId : 0;

    await controller.runQuery(
        `INSERT INTO tarefa_leituras (id_usuario, id_tarefa, ultimo_comentario_id, updated_at)
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
         ON CONFLICT (id_usuario, id_tarefa)
         DO UPDATE SET
            ultimo_comentario_id = GREATEST(tarefa_leituras.ultimo_comentario_id, EXCLUDED.ultimo_comentario_id),
            updated_at = CURRENT_TIMESTAMP;`,
        [userId, taskId, safeLastCommentId]
    );
}