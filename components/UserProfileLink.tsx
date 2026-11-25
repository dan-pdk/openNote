import Image from "next/image";
import Link from "next/link";

type UserProfileLinkProps = {
    userId: string;
    username: string;
    avatarUrl?: string | null;
};

export default function UserProfileLink({
    userId,
    username,
    avatarUrl = null,
}: UserProfileLinkProps) {
    const usernameInitial = username.trim().charAt(0).toUpperCase() || "?";

    return (
        <Link
            href={`/profile/${userId}`}
            className="inline-flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
        >
            <div className="w-7 h-7 rounded-full bg-black/10 dark:bg-white/15 overflow-hidden flex items-center justify-center shrink-0">
                {avatarUrl ? (
                    <Image
                        src={avatarUrl}
                        width={28}
                        height={28}
                        alt={username}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <span className="text-xs font-medium text-black dark:text-white">
                        {usernameInitial}
                    </span>
                )}
            </div>
            <span className="text-sm font-medium text-black dark:text-white truncate">
                {username}
            </span>
        </Link>
    );
}
