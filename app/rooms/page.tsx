import { Suspense } from "react"
import Image from "next/image"
import DashboardMenu from "@/components/DashboardMenu"
import Rooms from "@/components/Rooms"
import AddRoomButton from "@/components/AddRoomModal"
import { getServerSession } from "next-auth"
import controller from "@/db/controller"
import authOptions from "@/auth/authOptions"
import Header from "@/components/Header"

export const dynamic = 'force-dynamic';

const tasks = [
    { title: "Tarefa 1", date: "28/03" },
    { title: "Tarefa 2", date: "02/04" },
    { title: "Tarefa 3", date: "05/05" },
]

export default async function Page() {
    let rooms: Array<any> = [];
    try {
        const session = await getServerSession(authOptions);
        //@ts-ignore
        if (session?.user?.id) {
            const query = `
                SELECT DISTINCT s.id, s.nome, s.icone_url, s.created_at
                FROM salas s
                LEFT JOIN sala_membros sm ON s.id = sm.id_sala
                WHERE s.lider_id = $1 OR sm.id_usuario = $1 
                ORDER BY s.created_at;
            `;
            //@ts-ignore
            const roomsData = await controller.runQuery(query, [session.user.id]);
            rooms = roomsData || [];
        }
    } catch (error) {
        console.error("Erro ao carregar salas no dashboard. ", error);
    }

    return (
        <Suspense fallback={<div className="min-h-screen bg-white dark:bg-[#1D1D1D]" />}>
              
        </Suspense>
    )
}