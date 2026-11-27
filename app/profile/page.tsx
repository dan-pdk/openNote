import ProfileView from "@/components/ProfileView";
import { getAuthenticatedViewerId, getSafeProfilePayload } from "@/lib/profileService";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function OwnProfilePage() {
    const authenticatedViewerId = await getAuthenticatedViewerId();

    if (!authenticatedViewerId) {
        redirect("/login");
    }

    const profilePayload = await getSafeProfilePayload(
        authenticatedViewerId,
        authenticatedViewerId
    );

    if (!profilePayload) {
        notFound();
    }

    return <ProfileView profilePayload={profilePayload} />;
}
