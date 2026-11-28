export type ChatTarget =
    | {
          type: "room";
          roomId: string;
          title: string;
      }
    | {
          type: "task";
          roomId: string;
          taskId: string;
          title: string;
          color: string;
      };

export type ChatMessageItem = {
    id: number;
    conteudo: string;
    autorId: string | null;
    autorUsername: string;
    autorFirstName: string;
    autorFoto: string | null;
    createdAt: string;
};

export const CHAT_MESSAGE_MAX_LENGTH = 2000;

export function extractFirstName(username: string | null | undefined): string {
    if (!username) {
        return "Usuário";
    }
    const trimmed = username.trim();
    if (!trimmed) {
        return "Usuário";
    }
    return trimmed.split(/\s+/)[0];
}

export function formatChatMessageTimestamp(isoDateString: string): string {
    const parsedDate = new Date(isoDateString);
    if (Number.isNaN(parsedDate.getTime())) {
        return "";
    }

    const now = new Date();
    const startOfToday = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
    );
    const startOfMessageDay = new Date(
        parsedDate.getFullYear(),
        parsedDate.getMonth(),
        parsedDate.getDate()
    );

    const diffDays = Math.round(
        (startOfToday.getTime() - startOfMessageDay.getTime()) / 86400000
    );

    const timeLabel = parsedDate.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
    });

    if (diffDays === 0) {
        return timeLabel;
    }

    if (diffDays === 1) {
        return `Ontem, ${timeLabel}`;
    }

    const day = String(parsedDate.getDate()).padStart(2, "0");
    const month = String(parsedDate.getMonth() + 1).padStart(2, "0");

    if (parsedDate.getFullYear() === now.getFullYear()) {
        return `${day}/${month}, ${timeLabel}`;
    }

    return `${day}/${month}/${parsedDate.getFullYear()}, ${timeLabel}`;
}