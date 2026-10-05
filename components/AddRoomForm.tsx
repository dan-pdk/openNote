'use client'
import Form from 'next/form'
import createRoom from '@/actions/createRoom'
import { ChangeEvent, useState } from 'react'
import { Url } from 'next/dist/shared/lib/router/router'

export default function AddRoomForm({ visible, closeModal }: { visible: boolean, closeModal: Function }) {
    const [file, setFile] = useState<File | null>(null);

    function handleImagePick(event: ChangeEvent<HTMLInputElement>) {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            setFile(file)
        }
    }

    if (visible) {
        return (
            <>
                <Form action={createRoom} className="bg-black/35 absolute w-screen h-screen z-20 top-0 left-0 flex justify-center items-center" onClick={event => {
                    if (event.target == event.currentTarget) {
                        setFile(null);
                        closeModal();
                    }
                }}>
                    <div className="bg-white w-100 h-130 flex items-center -translate-y-1/3 justify-center flex-col gap-7 rounded-xl dark:bg-[#1D1D1D]">
                        <input name='roomName' className="bg-[#E2E2E2] w-2/3 h-12 rounded-lg dark:bg-[#303030] placeholder:text-black/50 dark:placeholder:text-white/65 pl-5 block" placeholder="Nome da sala" required />
                        <input name='image' onChange={handleImagePick} required type='file' />
                        <ImagePicker file={file as File}/>
                        <button type='submit' className="bg-teal-300 px-6 py-3 rounded-lg text-white hover:scale-110 duration-200 cursor-pointer">Adicionar Sala</button>
                    </div>
                </Form>
            </>
        )
    }
}

function ImagePicker({ file }: { file: File }) {
    function fileToURL(file: File) {
        const url = URL.createObjectURL(file);
        return url as Url;
    }

    if (!!file && file.type.includes("image")) {
        const url = fileToURL(file);
        return (
            <div className='select-none size-70 border-3 border-white/15 text-9xl text-center flex justify-center items-center rounded-2xl'>
                <img src={url.toString()} alt={file.name} className='size-full rounded-2xl'/>
            </div>
        )
    }

    return (
        <div className='select-none size-48 border-3 border-white/15 text-9xl text-center flex justify-center items-center text-white/25 rounded-2xl'> + </div>
    )
}