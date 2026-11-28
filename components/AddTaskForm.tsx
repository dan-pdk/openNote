import createTask from "@/actions/createTask";
import { ChangeEvent, ChangeEventHandler } from "react";
import Form from "next/form";
import { usePathname } from "next/navigation";

export default function AddTaskForm({ closeModal, modalDate, setModalDate }: { closeModal: Function, modalDate: Date, setModalDate: Function }) {
    const pathname = usePathname();
    const splitPathname = pathname.split('/');
    const roomId = splitPathname[splitPathname.length - 1];

    const createTaskWithRoomId = createTask.bind(null, roomId)

    function updateModalDate(event: ChangeEvent) {
        const input = event.target as HTMLInputElement;
        const dateString = input.value;
        const [year, month, day] = dateString.split('-');

        const newDate = new Date(Number(year), Number(month), Number(day));
        setModalDate(newDate)
    }

    return (
        <Form action={createTaskWithRoomId}>
            <div className="absolute max-h-screen min-h-screen max-w-screen min-w-screen bg-black/50 top-0 left-0 flex items-center justify-center" onClick={event => { if (event.target == event.currentTarget) { closeModal() } }}>
                <div className="bg-white size-150 flex items-center p-4 pt-10 flex-col gap-7 rounded-xl dark:bg-[#1D1D1D]">
                    <input name='taskName' className="bg-[#E2E2E2] w-2/3 h-12 rounded-lg dark:bg-[#303030] placeholder:text-black/50 dark:placeholder:text-white/65 pl-5 block" placeholder="Nova Tarefa" required />
                    <input value={modalDate.toLocaleDateString("en-CA")} type="date" name='date' className="bg-[#E2E2E2] px-5 w-2/3 h-12 rounded-lg dark:bg-[#303030] placeholder:text-black/50 dark:placeholder:text-white/65 pl-5 block" placeholder="Nome da sala" required onChange={updateModalDate} />

                    <h1>Descrição</h1>
                    <textarea name="description" placeholder="descrição" className="border-black/15 dark:border-white/15 rounded-sm border-2 w-80 h-60 text-lg p-4 focus:outline-none focus:border-black/20 dark:focus:border-white/20"></textarea>

                    <div className='flex gap-5'>
                        <button type='submit' className="bg-teal-500 px-6 w-60 text-lg py-3 rounded-lg text-white hover:scale-105 duration-100 cursor-pointer">Adicionar Tarefa</button>
                    </div>
                </div>
            </div>
        </Form>
    )
}

