import { AuthOptions } from "next-auth";
import Google from "next-auth/providers/google";
import controller from "@/db/controller";

const authOptions: AuthOptions = {
    providers: [
        Google({
            clientId: process.env.GOOGLE_ID as string,
            clientSecret: process.env.GOOGLE_SECRET as string,
        })
    ],
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            if (user?.email) {
                const matchingUsers = await getUserByEmail(user.email);
                if (matchingUsers.length === 1) {
                    token.id = matchingUsers[0].id;
                    token.name = matchingUsers[0].username;
                    token.picture = matchingUsers[0].mirror_foto;
                } else {
                    const queryCommand = controller
                        .createQueryCommand()
                        .insert("usuarios")
                        .values({
                            username: user.name,
                            email: user.email,
                            mirror_foto: user.image,
                        })
                        .resolve();
                    await controller.runQuery(queryCommand);
                    const [generatedUser] = await getUserByEmail(user.email);
                    token.id = generatedUser.id;
                    token.name = generatedUser.username;
                    token.picture = generatedUser.mirror_foto;
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
                if (typeof token.picture === "string" || token.picture === null) {
                    session.user.image = token.picture as string;
                }
            }
            return session;
        }
    }
}

async function getUserByEmail(email: string) {
    return controller.runQuery<{
        id: string;
        username: string;
        mirror_foto: string | null;
    }>(
        `SELECT id, username, mirror_foto FROM usuarios WHERE email = $1;`,
        [email]
    );
}

export default authOptions;