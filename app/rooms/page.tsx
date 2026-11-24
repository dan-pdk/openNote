import authOptions from "@/auth/authOptions";
import DashboardMenu from "@/components/DashboardMenu"
import Header from "@/components/Header"
import RoomsRoomsPage from "@/components/RoomsRoomsPage";
import controller from "@/db/controller";
import { getServerSession } from "next-auth";

export default async function Page() {
    const session = await getServerSession(authOptions);
    const userId = session?.user.id

    const query = "SELECT SALA.*, MEMBRO.data_entrada FROM salas AS SALA INNER JOIN sala_membros AS MEMBRO ON SALA.id = MEMBRO.id_sala WHERE MEMBRO.id_usuario = $1";
    const rows = await controller.runQuery(query, [userId]);
    const parsedRooms = rows.map(room => {
      const { id, nome, icone_url, lider_id } = room;
      return {
        id,
        nome,
        icone_url,
        isLeader: Boolean(userId && lider_id === userId)
      };
    });

    console.log(parsedRooms)
    console.log(rows)

    return (
        <div className="dark:bg-[#1D1D1D] min-h-screen">
            <Header />
            <DashboardMenu />
            <h1></h1>
            <RoomsRoomsPage rooms={parsedRooms}></RoomsRoomsPage>
        </div>
    )
}