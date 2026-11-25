import ProfileView from "@/components/ProfileView";
import {
    getAuthenticatedViewerId,
    getSafeProfilePayload,
    isValidUuidString,
} from "@/lib/profileService";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ProfileDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const authenticatedViewerId = await getAuthenticatedViewerId();

    if (!authenticatedViewerId) {
        redirect("/login");
    }

    const { id: requestedProfileIdentifier } = await params;

    if (!isValidUuidString(requestedProfileIdentifier)) {
        notFound();
    }

    const profilePayload = await getSafeProfilePayload(
        requestedProfileIdentifier,
        authenticatedViewerId
    );

    if (!profilePayload) {
        notFound();
    }

    return <ProfileView profilePayload={profilePayload} />;
}
