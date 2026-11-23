import { NextRequest, NextResponse } from 'next/server';
import controller from '@/db/controller';
import { getServerSession } from 'next-auth';

export async function GET(request: NextRequest) {
    const session = await getServerSession();

    if (!session?.user?.email) {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const query = `
        SELECT s.id, s.nome, s.capacidade, s.tipo, s.icone_url, s.lider_id
        FROM salas s
        INNER JOIN sala_membros sm ON s.id = sm.id_sala
        INNER JOIN usuarios u ON sm.id_usuario = u.id
        WHERE u.email = $1
    `;

    try {
        const rooms = await controller.runQuery(query, [session.user.email]);
        return NextResponse.json(rooms, { status: 200 });
    } catch (error) {
        console.error('Erro ao buscar salas:', error);
        return NextResponse.json({ message: "Erro interno ao buscar salas" }, { status: 500 });
    }
}