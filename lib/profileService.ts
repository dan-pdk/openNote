import authOptions from "@/auth/authOptions";
import controller from "@/db/controller";
import { getServerSession } from "next-auth";

export type PublicProfileUser = {
    id: string;
    username: string;
    email: string;
    is_admin: boolean;
    mirror_foto: string | null;
};

export type ProfileRoomSummary = {
    id: string;
    nome: string;
    tipo: "livre" | "restrita";
    icone_url: string | null;
};

export type ProfilePagePayload = {
    profileUser: PublicProfileUser;
    isOwnProfile: boolean;
    visibleRooms: Array<ProfileRoomSummary>;
};

const uuidValidationRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUuidString(candidateIdentifier: unknown): candidateIdentifier is string {
    if (typeof candidateIdentifier !== "string") {
        return false;
    }

    const trimmedIdentifier = candidateIdentifier.trim();
    return trimmedIdentifier.length === 36 && uuidValidationRegex.test(trimmedIdentifier);
}

export async function getAuthenticatedViewerId(): Promise<string | null> {
    const userSession = await getServerSession(authOptions);
    const sessionUserId = userSession?.user?.id;

    if (!userSession || !isValidUuidString(sessionUserId)) {
        return null;
    }

    const normalizedViewerId = sessionUserId.trim().toLowerCase();

    const matchingUsersList = await controller.runQuery<{ id: string }>(
        "SELECT id FROM usuarios WHERE id = $1;",
        [normalizedViewerId]
    );

    if (matchingUsersList.length === 0) {
        return null;
    }

    return normalizedViewerId;
}

export async function getSafeProfilePayload(
    targetProfileIdentifier: string,
    authenticatedViewerId: string
): Promise<ProfilePagePayload | null> {
    if (!isValidUuidString(targetProfileIdentifier) || !isValidUuidString(authenticatedViewerId)) {
        return null;
    }

    const normalizedProfileId = targetProfileIdentifier.trim().toLowerCase();
    const normalizedViewerId = authenticatedViewerId.trim().toLowerCase();

    const matchingProfilesList = await controller.runQuery<PublicProfileUser>(
        "SELECT id, username, email, is_admin, mirror_foto FROM usuarios WHERE id = $1;",
        [normalizedProfileId]
    );

    if (matchingProfilesList.length === 0) {
        return null;
    }

    const profileUser = matchingProfilesList[0];
    const isOwnProfile = profileUser.id.toLowerCase() === normalizedViewerId;

    const visibleRooms = isOwnProfile
        ? await controller.runQuery<ProfileRoomSummary>(
              `SELECT DISTINCT s.id, s.nome, s.tipo, s.icone_url
               FROM salas s
               LEFT JOIN sala_membros sm ON s.id = sm.id_sala
               WHERE s.lider_id = $1 OR sm.id_usuario = $1
               ORDER BY s.nome ASC;`,
              [normalizedViewerId]
          )
        : await controller.runQuery<ProfileRoomSummary>(
              `SELECT DISTINCT s.id, s.nome, s.tipo, s.icone_url
               FROM salas s
               WHERE (s.lider_id = $1 OR EXISTS (SELECT 1 FROM sala_membros sm_viewer WHERE sm_viewer.id_sala = s.id AND sm_viewer.id_usuario = $1))
                 AND (s.lider_id = $2 OR EXISTS (SELECT 1 FROM sala_membros sm_target WHERE sm_target.id_sala = s.id AND sm_target.id_usuario = $2))
               ORDER BY s.nome ASC;`,
              [normalizedViewerId, profileUser.id]
          );

    return {
        profileUser,
        isOwnProfile,
        visibleRooms,
    };
}