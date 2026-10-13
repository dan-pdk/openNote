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

        async jwt({ token, user }) {
            let id: string = "";
            if (user?.email) {
                const matchingUsers = await getUsersIdByEmail(user.email) as any as Array<Record<string, any>>
                if (matchingUsers.length == 1) {
                    id = matchingUsers[0].id;
                } else {
                    const queryCommand = controller.createQueryCommand().insert("usuarios").values({ username: user.name, email: user.email, mirror_foto: user.image }).resolve()
                    await controller.runQuery(queryCommand);
                    const [generatedID] = await getUsersIdByEmail(user.email)
                    id = generatedID.id;
                }
                token.id = id;
            }
            return token
        },

        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
            }
            return session;
        }
    }
}

async function getUsersIdByEmail(email: string) {
    const matchingUsers = await controller.runQuery(`SELECT id FROM usuarios WHERE email = $1;`, [email]);
    return matchingUsers
}

export default authOptions