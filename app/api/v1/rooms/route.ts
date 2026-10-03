import type { NextApiRequest, NextApiResponse } from 'next';
import controller from '@/db/controller';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

export async function handler(request: NextApiRequest, response: NextApiResponse) {
    const session = await getServerSession();

    if (!session) {
        return NextResponse.json({ message: "Forbidden" }, {status: 403})
    }

    const query = `SELECT nome FROM salas WHERE email_do_dono = $1`

    const rooms = await controller.runQuery(query, [session?.user?.email]);
    return NextResponse.json(rooms, {status: 200})
}

export { handler as GET, handler as POST }
