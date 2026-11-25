import authOptions from "@/auth/authOptions";
import Calendar from "@/components/Calendar";
import DashboardMenu from "@/components/DashboardMenu";
import Header from "@/components/Header";
import controller from "@/db/controller";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";

type TaskItem = {
    id: string;
    name: string;
    dueDate: string;
};

const uuidValidationRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function Page({ params }: { params: Promise<{ roomID: string }> }) {
    const userSession = await getServerSession(authOptions);
    const authenticatedUserId = userSession?.user?.id;

    if (
        !userSession ||
        !authenticatedUserId ||
        typeof authenticatedUserId !== "string" ||
        authenticatedUserId.length !== 36 ||
        !uuidValidationRegex.test(authenticatedUserId)
    ) {
        redirect("/login");
    }

    const { roomID } = await params;
    const trimmedRoomIdentifier = typeof roomID === "string" ? roomID.trim() : "";

    if (trimmedRoomIdentifier.length !== 36 || !uuidValidationRegex.test(trimmedRoomIdentifier)) {
        notFound();
    }

    const normalizedRoomIdentifier = trimmedRoomIdentifier.toLowerCase();

    const existingUsersList = await controller.runQuery<{ id: string }>(
        "SELECT id FROM usuarios WHERE id = $1;",
        [authenticatedUserId]
    );

    if (existingUsersList.length === 0) {
        redirect("/login");
    }

    const existingRoomsList = await controller.runQuery<{ id: string }>(
        "SELECT id FROM salas WHERE id = $1;",
        [normalizedRoomIdentifier]
    );

    if (existingRoomsList.length === 0) {
        notFound();
    }

    await controller.runQuery(
        "INSERT INTO sala_membros (id_usuario, id_sala) VALUES ($1, $2) ON CONFLICT (id_usuario, id_sala) DO NOTHING;",
        [authenticatedUserId, normalizedRoomIdentifier]
    );

    const tasks: Array<TaskItem> = await controller.runQuery(
        "SELECT FROM tarefas WHERE id_sala = $1;",
        [normalizedRoomIdentifier]
    );

    // daqui pra baixo é a página
    return (
        <div className="dark:bg-[#1D1D1D] min-h-screen">
            <Header />
            <DashboardMenu />
            <div className="flex mx-auto items-center flex-col min-h-full ">
                <Calendar tasks={tasks} />
            </div>
        </div>
    );
}
