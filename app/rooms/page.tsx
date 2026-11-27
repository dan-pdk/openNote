import authOptions from "@/auth/authOptions";
import DashboardMenu from "@/components/DashboardMenu";
import Header from "@/components/Header";
import RoomsRoomsPage from "@/components/RoomsRoomsPage";
import controller from "@/db/controller";
import { getServerSession } from "next-auth";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

type RoomRow = {
    id: string;
    nome: string;
    icone_url: string | null;
    tipo: string;
    lider_id: string;
};

type RoomItem = {
    id: string;
    nome: string;
    icone_url: string | null;
    tipo: "livre" | "restrita";
    isLeader: boolean;
};

export default async function Page() {
    let parsedRooms: Array<RoomItem> = [];

    try {
        const session = await getServerSession(authOptions);
        const userId = session?.user?.id;

        if (userId) {
            const query = `
                SELECT DISTINCT s.id, s.nome, s.icone_url, s.tipo, s.lider_id, s.created_at
                FROM salas s
                LEFT JOIN sala_membros sm ON s.id = sm.id_sala
                WHERE s.lider_id = $1 OR sm.id_usuario = $1
                ORDER BY s.created_at DESC;
            `;
            const rows = await controller.runQuery<RoomRow>(query, [userId]);
            parsedRooms = (rows || []).map((room) => ({
                id: room.id,
                nome: room.nome,
                icone_url: room.icone_url,
                tipo: room.tipo === "livre" ? "livre" : "restrita",
                isLeader: room.lider_id === userId,
            }));
        }
    } catch (error) {
        console.error("Erro ao carregar salas.", error);
    }

    return (
        <Suspense fallback={<div className="min-h-screen bg-white dark:bg-[#1D1D1D]" />}>
            <div className="min-h-screen bg-white dark:bg-[#1D1D1D]">
                <Header />

                <main className="px-4 py-6 lg:px-10 lg:max-w-5xl lg:mx-auto">
                    <RoomsRoomsPage rooms={parsedRooms} />
                </main>

                <DashboardMenu />
            </div>
        </Suspense>
    );
}
