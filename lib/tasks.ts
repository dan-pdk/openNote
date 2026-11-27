export type TaskColorOption = {
    hexCode: string;
    label: string;
};

export type TaskLinkItem = {
    id: number;
    nome: string;
    url_anexo: string;
};

export type TaskLinkDraft = {
    nome: string;
    url: string;
};

export type RoomTaskItem = {
    id: string;
    nome: string;
    descricao: string | null;
    dataEntrega: string;
    cor: string;
    concluida: boolean;
    criadorId: string | null;
    autorNome: string;
    links: TaskLinkItem[];
};

export const TASK_COLOR_OPTIONS: ReadonlyArray<TaskColorOption> = [
    { hexCode: "#EF4444", label: "Vermelho" },
    { hexCode: "#F97316", label: "Laranja" },
    { hexCode: "#F59E0B", label: "Âmbar" },
    { hexCode: "#EAB308", label: "Amarelo" },
    { hexCode: "#84CC16", label: "Lima" },
    { hexCode: "#22C55E", label: "Verde" },
    { hexCode: "#10B981", label: "Esmeralda" },
    { hexCode: "#14B8A6", label: "Teal" },
    { hexCode: "#06B6D4", label: "Ciano" },
    { hexCode: "#0EA5E9", label: "Azul Claro" },
    { hexCode: "#3B82F6", label: "Azul" },
    { hexCode: "#6366F1", label: "Índigo" },
    { hexCode: "#8B5CF6", label: "Violeta" },
    { hexCode: "#A855F7", label: "Roxo" },
    { hexCode: "#EC4899", label: "Rosa" },
    { hexCode: "#64748B", label: "Outro roxo" },
];

export const DEFAULT_TASK_COLOR = "#14B8A6";
export const TASK_LINK_LIMIT = 10;
export const TASK_NAME_MAX_LENGTH = 128;
export const TASK_DESCRIPTION_MAX_LENGTH = 5000;
export const TASK_LINK_URL_MAX_LENGTH = 2048;
export const TASK_LINK_NAME_MAX_LENGTH = 128;

const ALLOWED_TASK_COLOR_SET = new Set(
    TASK_COLOR_OPTIONS.map((colorOption) => colorOption.hexCode.toUpperCase())
);

const UUID_VALIDATION_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const DATE_STRING_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;

const PORTUGUESE_MONTH_NAMES = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
];

export function isValidUuid(candidateValue: unknown): candidateValue is string {
    if (typeof candidateValue !== "string") {
        return false;
    }

    const trimmedValue = candidateValue.trim();
    return trimmedValue.length === 36 && UUID_VALIDATION_REGEX.test(trimmedValue);
}

export function normalizeUuid(candidateValue: string): string {
    return candidateValue.trim().toLowerCase();
}

export function normalizeTaskColor(candidateColor: unknown): string | null {
    if (typeof candidateColor !== "string") {
        return null;
    }

    const normalizedHex = candidateColor.trim().toUpperCase();
    if (!ALLOWED_TASK_COLOR_SET.has(normalizedHex)) {
        return null;
    }

    return normalizedHex;
}

export function parseCalendarDateString(candidateDate: unknown): string | null {
    if (typeof candidateDate !== "string") {
        return null;
    }

    const trimmedDate = candidateDate.trim();
    const dateMatch = DATE_STRING_REGEX.exec(trimmedDate);
    if (!dateMatch) {
        return null;
    }

    const parsedYear = Number(dateMatch[1]);
    const parsedMonth = Number(dateMatch[2]);
    const parsedDay = Number(dateMatch[3]);

    if (parsedYear < 1900 || parsedYear > 2100) {
        return null;
    }

    const utcValidationDate = new Date(
        Date.UTC(parsedYear, parsedMonth - 1, parsedDay)
    );

    if (
        utcValidationDate.getUTCFullYear() !== parsedYear ||
        utcValidationDate.getUTCMonth() !== parsedMonth - 1 ||
        utcValidationDate.getUTCDate() !== parsedDay
    ) {
        return null;
    }

    return trimmedDate;
}

export function buildCalendarDateString(
    yearNumber: number,
    monthIndexZeroBased: number,
    dayNumber: number
): string {
    const paddedMonth = String(monthIndexZeroBased + 1).padStart(2, "0");
    const paddedDay = String(dayNumber).padStart(2, "0");
    return `${yearNumber}-${paddedMonth}-${paddedDay}`;
}

export function formatPortugueseDateHeading(dateString: string): string {
    const validatedDate = parseCalendarDateString(dateString);
    if (!validatedDate) {
        return dateString;
    }

    const [yearPart, monthPart, dayPart] = validatedDate.split("-");
    const monthName = PORTUGUESE_MONTH_NAMES[Number(monthPart) - 1] ?? monthPart;
    return `${Number(dayPart)} de ${monthName} de ${yearPart}`;
}

export function validateAndNormalizeExternalUrl(rawUrlValue: string): string | null {
    if (typeof rawUrlValue !== "string") {
        return null;
    }

    const trimmedUrl = rawUrlValue.trim();
    if (
        trimmedUrl.length === 0 ||
        trimmedUrl.length > TASK_LINK_URL_MAX_LENGTH ||
        /\s/.test(trimmedUrl)
    ) {
        return null;
    }

    let candidateUrl = trimmedUrl;
    const hasSchemePrefix = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmedUrl);

    if (!hasSchemePrefix) {
        if (trimmedUrl.startsWith("/") || !trimmedUrl.includes(".")) {
            return null;
        }
        candidateUrl = `https://${trimmedUrl}`;
    }

    try {
        const parsedUrl = new URL(candidateUrl);
        if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
            return null;
        }

        if (!parsedUrl.hostname || parsedUrl.hostname.length === 0) {
            return null;
        }

        return parsedUrl.toString();
    } catch {
        return null;
    }
}

export function deriveLinkDisplayName(
    providedName: string,
    validatedUrl: string
): string {
    const trimmedName = providedName.trim();
    if (trimmedName.length > 0) {
        return trimmedName.slice(0, TASK_LINK_NAME_MAX_LENGTH);
    }

    try {
        const parsedUrl = new URL(validatedUrl);
        const cleanHostname = parsedUrl.hostname.replace(/^www\./, "");
        return cleanHostname.slice(0, TASK_LINK_NAME_MAX_LENGTH) || "Link";
    } catch {
        return "Link";
    }
}
