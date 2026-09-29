import Image from "next/image"
type salaData = {
    nome: string
}

type Room = {
    nome: string
}

export default function Rooms({ rooms } : { rooms: Array<Room> }) {

    if (rooms.map) {
        return (
            <>
                <div className="flex flex-col gap-3">
                    {rooms.map((room: salaData) => (
                        <button
                            key={room.nome}
                            className="flex items-center gap-3 bg-[#E2E2E2] dark:bg-[#303030] rounded-xl p-3 text-left hover:scale-[1.02] duration-200 cursor-pointer"
                        >
                            <div className="w-10 h-10 rounded-full bg-black/10 dark:bg-white/15 flex items-center justify-center font-medium text-black dark:text-white shrink-0">
                                {room.nome.split(" ")[1]}
                            </div>
                            <span className="flex-1 font-medium text-black dark:text-white">{room.nome}</span>
                            <Image src={"/ChevronRight.svg"} width={20} height={20} alt="" className="dark:invert"></Image>
                        </button>
                    ))}

                </div>
            </>
        )
    } else {
        return (
            <p>Nada para ver aqui</p>
        )
    }
}

