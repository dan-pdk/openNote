import DashboardMenu from "@/components/DashboardMenu";
import Header from "@/components/Header";
import ProfileSettingsSection from "@/components/ProfileSettingsSection";
import { ProfilePagePayload } from "@/lib/profileService";
import { EyeOff, Lock, LockOpen, Mail, ShieldCheck, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";

function isSafeProfileImageUrl(candidateImageUrl: string | null): candidateImageUrl is string {
    if (!candidateImageUrl) {
        return false;
    }

    if (candidateImageUrl.startsWith("/") && !candidateImageUrl.startsWith("//")) {
        return true;
    }

    try {
        const parsedImageUrl = new URL(candidateImageUrl);
        return (
            parsedImageUrl.protocol === "https:" &&
            (parsedImageUrl.hostname.endsWith(".googleusercontent.com") ||
                parsedImageUrl.hostname.endsWith(".public.blob.vercel-storage.com"))
        );
    } catch {
        return false;
    }
}

export default function ProfileView({ profilePayload }: { profilePayload: ProfilePagePayload }) {
    const { profileUser, isOwnProfile, visibleRooms } = profilePayload;
    const hasSafeAvatarImage = isSafeProfileImageUrl(profileUser.mirror_foto);
    const usernameInitial = profileUser.username?.trim().charAt(0).toUpperCase() || "?";

    return (
        <Suspense fallback={<div className="min-h-screen bg-white dark:bg-[#1D1D1D]" />}>
            <div className="min-h-screen bg-white dark:bg-[#1D1D1D]">
                <Header />

                <main className="px-4 py-6 lg:px-10 lg:max-w-4xl lg:mx-auto flex flex-col gap-8">
                    <section className="bg-[#E2E2E2] dark:bg-[#303030] rounded-2xl p-6 flex flex-col sm:flex-row items-center sm:items-start gap-6">
                        <div className="w-24 h-24 rounded-full bg-black/10 dark:bg-white/15 flex items-center justify-center overflow-hidden shrink-0">
                            {hasSafeAvatarImage ? (
                                <Image
                                    src={profileUser.mirror_foto as string}
                                    width={96}
                                    height={96}
                                    unoptimized={(profileUser.mirror_foto as string).startsWith("/uploads/")}
                                    alt={profileUser.username}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <span className="text-3xl font-semibold text-black dark:text-white">
                                    {usernameInitial}
                                </span>
                            )}
                        </div>

                        <div className="flex-1 min-w-0 flex flex-col gap-3 text-center sm:text-left">
                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                                <h1 className="text-2xl font-semibold text-black dark:text-white truncate">
                                    {profileUser.username}
                                </h1>

                                {isOwnProfile && (
                                    <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-teal-500/15 text-teal-700 dark:bg-teal-400/20 dark:text-teal-300">
                                        Seu perfil
                                    </span>
                                )}

                                {profileUser.is_admin && (
                                    <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:bg-amber-400/20 dark:text-amber-300">
                                        <ShieldCheck className="w-3.5 h-3.5" />
                                        Administrador
                                    </span>
                                )}
                            </div>

                            <div className="flex flex-col gap-2 text-sm text-black/75 dark:text-white/75">
                                {profileUser.email && (
                                    <div className="flex items-center justify-center sm:justify-start gap-2 min-w-0">
                                        <Mail className="w-4 h-4 shrink-0 text-black/50 dark:text-white/50" />
                                        <span className="truncate">{profileUser.email}</span>
                                        {isOwnProfile && !profileUser.show_email && (
                                            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full text-black/60 dark:text-white/60 shrink-0">
                                                <EyeOff className="w-3 h-3" />
                                            </span>
                                        )}
                                    </div>
                                )}

                                <div className="flex items-center justify-center sm:justify-start gap-2 min-w-0">
                                    <User className="w-4 h-4 shrink-0 text-black/50 dark:text-white/50" />
                                    <span className="truncate text-xs font-mono text-black/60 dark:text-white/60">
                                        {profileUser.id}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </section>

                    {isOwnProfile && (
                        <ProfileSettingsSection
                            initialUsername={profileUser.username}
                            initialImage={profileUser.mirror_foto}
                            initialShowEmail={profileUser.show_email}
                            userEmail={profileUser.email}
                        />
                    )}

                    <section className="flex flex-col gap-3">
                        <div className="flex items-baseline justify-between">
                            <span className="text-xs font-medium text-black/50 dark:text-white/50 uppercase tracking-wide">
                                Salas
                            </span>
                            <span className="text-xs text-black/50 dark:text-white/50">
                                {visibleRooms.length}
                            </span>
                        </div>
                        <h2 className="text-lg font-semibold text-black dark:text-white">
                            {isOwnProfile ? "Suas salas" : "Salas em comum"}
                        </h2>

                        {visibleRooms.length > 0 ? (
                            <div className="flex flex-col gap-3">
                                {visibleRooms.map((roomItem) => {
                                    const isRestrictedRoom = roomItem.tipo === "restrita";

                                    return (
                                        <Link
                                            key={roomItem.id}
                                            href={`/rooms/${roomItem.id}`}
                                            className="flex items-center gap-3 bg-[#E2E2E2] dark:bg-[#303030] rounded-xl p-3 text-left hover:scale-[1.02] duration-200 cursor-pointer"
                                        >
                                            {!roomItem.icone_url ? (
                                                <div className="w-10 h-10 rounded-full bg-black/10 dark:bg-white/15 flex items-center justify-center font-medium text-black dark:text-white shrink-0">
                                                    {roomItem.nome.charAt(0).toUpperCase()}
                                                </div>
                                            ) : (
                                                <Image
                                                    width={40}
                                                    height={40}
                                                    src={roomItem.icone_url}
                                                    className="w-10 h-10 rounded-full object-cover shrink-0"
                                                    alt={roomItem.nome}
                                                />
                                            )}

                                            <span className="flex-1 font-medium text-black dark:text-white truncate">
                                                {roomItem.nome}
                                            </span>

                                            <span
                                                title={isRestrictedRoom ? "Restrita" : "Livre"}
                                                aria-label={isRestrictedRoom ? "Restrita" : "Livre"}
                                                className={`p-1.5 rounded-full shrink-0 ${
                                                    isRestrictedRoom
                                                        ? "bg-[#E60000]/15 text-[#E60000] dark:bg-[#E60000]/20 dark:text-red-400"
                                                        : "bg-[#139C1A]/15 text-[#139C1A] dark:bg-[#139C1A]/20 dark:text-green-400"
                                                }`}
                                            >
                                                {isRestrictedRoom ? (
                                                    <Lock className="w-4 h-4" />
                                                ) : (
                                                    <LockOpen className="w-4 h-4" />
                                                )}
                                            </span>

                                            <Image
                                                src={"/ChevronRight.svg"}
                                                width={20}
                                                height={20}
                                                alt=""
                                                className="dark:invert"
                                            />
                                        </Link>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-sm text-black/60 dark:text-white/60">
                                {isOwnProfile
                                    ? "Você ainda não participa de nenhuma sala."
                                    : "Vocês ainda não possuem salas em comum."}
                            </p>
                        )}
                    </section>
                </main>

                <DashboardMenu />
            </div>
        </Suspense>
    );
}