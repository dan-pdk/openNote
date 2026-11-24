'use client'
import Form from 'next/form'
import createRoom from '@/actions/createRoom'
import { ChangeEvent, useId, useState } from 'react'
import { Url } from 'next/dist/shared/lib/router/router'

export default function AddRoomForm({ visible, closeModal }: { visible: boolean, closeModal: Function }) {
    const imageInputID = useId();
    const [file, setFile] = useState<File | null>(null);
    const [isRestricted, setIsRestricted] = useState(false);

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
                    <div className='w-fit flex gap-5'>
                        <div className="bg-white w-105 h-150 flex items-center justify-center flex-col gap-5 rounded-xl dark:bg-[#1D1D1D]">
                            <h1 className='text-4xl pt-2'>Criar uma sala</h1>
                            <input name='roomName' className="bg-[#E2E2E2] w-2/3 h-14 rounded-lg dark:bg-[#303030] placeholder:text-black/50 dark:placeholder:text-white/65 pl-5 block" placeholder="Nome da sala" required />
                            <input id={imageInputID} className='hidden' name='image' onChange={handleImagePick} type='file' />
                            <input type="hidden" name='tipo' value={isRestricted ? "restrita" : "livre"} />

                            <div className='grid grid-cols-3 items-center justify-center w-2/3'>
                              <p className={`${isRestricted ? 'opacity-0' : 'opacity-100'} text-end transition-opacity duration-200 cursor-default select-none`}>Sala Livre</p>
                              <button type='button' role='switch' aria-checked={isRestricted} onClick={() => {setIsRestricted(previous => !previous)}} className={`relative w-15 h-7.5 ${isRestricted ? 'bg-[#E60000]' : 'bg-[#139C1A]'} rounded-full p-1 flex items-center cursor-pointer select-none justify-self-center`}>
                              <div className={`rounded-full bg-[#E2E2E2] w-6 h-6 transition-transform duration-200 
                                  ${isRestricted ? 'translate-x-7' : 'translate-x-0' }
                                `}></div>
                              </button>
                              <p className={`${isRestricted ? 'opacity-100' : 'opacity-0'} text-start transition-opacity duration-200 cursor-default select-none`}>Sala Restrita</p>
                            </div>

                            <span className='italic font-light -mt-4'>{!isRestricted ? "Qualquer membro pode controlar tarefas" : "Apenas o líder pode controlar tarefas"}</span>

                            <label htmlFor={imageInputID} className='w-50 h-10 text-white bg-blue-500 font-semibold text-center flex justify-center items-center rounded-md cursor-pointer hover:scale-105 duration-100'>Escolha o ícone</label>
                            <label htmlFor={imageInputID} className='cursor-pointer hover:scale-105 duration-100'><ImagePicker file={file as File} /></label>
                            <div className='flex gap-5'>
                                <button type='submit' className="bg-teal-500 px-6 w-40 py-3 rounded-lg text-white hover:scale-110 duration-200 cursor-pointer">Adicionar Sala</button>
                                <button onClick={() => {closeModal()}} className="border-box bg-teal-500/10 text-center border-2 border-teal-500 px-6 py-3 w-40 rounded-lg text-white hover:scale-110 duration-200 cursor-pointer">Sair</button>
                            </div>
                        </div>
                        <div className="bg-white w-105 h-150 flex items-center justify-center flex-col gap-7 rounded-xl dark:bg-[#1D1D1D]">
                            <h1 className='text-4xl pt-2'>Entrar em uma sala</h1>
                        </div>
                        

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
                <img src={url.toString()} alt={file.name} className='size-full rounded-2xl' />
            </div>
        )
    }

    return (
        <div className='select-none size-48 border-3 border-white/15 text-9xl text-center flex justify-center items-center text-white/25 rounded-2xl'> + </div>
    )
}