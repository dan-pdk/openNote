import Form from 'next/form'
import createRoom from '@/actions/createRoom'

export default function AddRoomForm({ visible, closeModal }: { visible: boolean, closeModal: Function }) {
    /*Terminar amanha*/

    if (visible) {
        return (
            <>
                <Form action={createRoom} className="bg-black/35 absolute w-screen h-screen z-20 top-0 left-0 flex justify-center" onClick={event => {
                    if (event.target == event.currentTarget) {
                        closeModal()
                    }
                }}>
                    <div className="bg-white w-100 h-50 flex items-center translate-y-3/4 justify-center flex-col gap-7 rounded-xl">
                        <input name='roomName' className="bg-[#E2E2E2] w-2/3 h-12 rounded-lg dark:bg-[#303030] placeholder:text-black/50 dark:placeholder:text-white/65 pl-5 block" placeholder="Nome da sala" required/>
                        <button type='submit' className="bg-teal-300 px-6 py-3 rounded-lg text-white hover:scale-110 duration-200 cursor-pointer">Adicionar Sala</button>
                    </div>
                </Form>
            </>
        )
    }
}