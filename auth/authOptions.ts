import { ensureGoogleDefaultsColumns } from "@/actions/updateUserSettings";
import { AuthOptions } from "next-auth";
import Google from "next-auth/providers/google";
import controller from "@/db/controller";

const authOptions: AuthOptions = {
    providers: [
        Google({
            clientId: process.env.GOOGLE_ID as string,
            clientSecret: process.env.GOOGLE_SECRET as string,
        }),
    ],
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            if (user?.email) {
                await ensureGoogleDefaultsColumns();
                const matchingUsers = await getUserByEmail(user.email);

                if (matchingUsers.length === 1) {
                    const existingUser = matchingUsers[0];
                    const syncedUsers = await controller.runQuery<{
                        google_username: string | null;
                        google_foto: string | null;
                    }>(
                        `UPDATE usuarios
                         SET google_username = COALESCE($1, google_username),
                             google_foto = COALESCE($2, google_foto)
                         WHERE id = $3
                         RETURNING google_username, google_foto;`,
                        [user.name ?? null, user.image ?? null, existingUser.id]
                    );

                    token.id = existingUser.id;
                    token.name = existingUser.username;
                    token.picture = existingUser.mirror_foto;
                    token.googleName =
                        syncedUsers[0]?.google_username ??
                        existingUser.google_username ??
                        user.name ??
                        null;
                    token.googlePicture =
                        syncedUsers[0]?.google_foto ??
                        existingUser.google_foto ??
                        user.image ??
                        null;
                } else {
                    const queryCommand = controller
                        .createQueryCommand()
                        .insert("usuarios")
                        .values({
                            username: user.name,
                            email: user.email,
                            mirror_foto: user.image,
                            google_username: user.name,
                            google_foto: user.image,
                        })
                        .resolve();
                    await controller.runQuery(queryCommand);
                    const [generatedUser] = await getUserByEmail(user.email);

                    token.id = generatedUser.id;
                    token.name = generatedUser.username;
                    token.picture = generatedUser.mirror_foto;
                    token.googleName =
                        generatedUser.google_username ?? user.name ?? null;
                    token.googlePicture =
                        generatedUser.google_foto ?? user.image ?? null;
                }
            } else if (trigger !== "update") {
                if (!token.googleName && typeof token.name === "string") {
                    token.googleName = token.name;
                }
                if (
                    !token.googlePicture &&
                    typeof token.picture === "string" &&
                    token.picture.includes("googleusercontent.com")
                ) {
                    token.googlePicture = token.picture;
                }
            }

            if (trigger === "update" && session) {
                if (typeof session.name === "string") {
                    token.name = session.name;
                }
                if (session.image !== undefined) {
                    token.picture = session.image;
                }
            }

            return token;
        },

        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                if (typeof token.name === "string") {
                    session.user.name = token.name;
                }
                if (
                    typeof token.picture === "string" ||
                    token.picture === null
                ) {
                    session.user.image = token.picture as string;
                }
                session.user.googleName =
                    typeof token.googleName === "string"
                        ? token.googleName
                        : null;
                session.user.googleImage =
                    typeof token.googlePicture === "string"
                        ? token.googlePicture
                        : null;
            }
            return session;
        },
    },
};

async function getUserByEmail(email: string) {
    return controller.runQuery<{
        id: string;
        username: string;
        mirror_foto: string | null;
        google_username: string | null;
        google_foto: string | null;
    }>(
        `SELECT id, username, mirror_foto, google_username, google_foto
         FROM usuarios
         WHERE email = $1;`,
        [email]
    );
}

export default authOptions;