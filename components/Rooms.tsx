import Image from "next/image"

type Room = {
    nome: string,
    id: string,
    icone_url: string
}

export default function Rooms({ rooms } : { rooms: Array<Room> }) {

    if (rooms.map && rooms.length > 0) {
        return (
            <>
                <div className="flex flex-col gap-3">
                    {rooms.map((room: Room) => (
                        <button
                            key={room.id}
                            className="flex items-center gap-3 bg-[#E2E2E2] dark:bg-[#303030] rounded-xl p-3 text-left hover:scale-[1.02] duration-200 cursor-pointer"
                        >   
                            {room.icone_url === ""
                             ? <div className="w-10 h-10 rounded-full bg-black/10 dark:bg-white/15 flex items-center justify-center font-medium text-black dark:text-white shrink-0">
                                {room.nome.split(" ")[1]}
                            </div> 
                            :<Image width={10} height={10} src={room.icone_url} className="w-10 h-10 rounded-full" alt={room.nome} />}
                            
                            <span className="flex-1 font-medium text-black dark:text-white">{room.nome}</span>
                            <Image src={"/ChevronRight.svg"} width={20} height={20} alt="" className="dark:invert"></Image>
                        </button>
                    ))}

                </div>
            </>
        )
    } else {
        return (
            <p className="dark:text-white">Nada para ver aqui</p>
        )
    }
}

