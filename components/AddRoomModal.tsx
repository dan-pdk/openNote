'use client'
import AddRoomForm from "./AddRoomForm";
import { useState } from "react";
export default function AddRoomButton() {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <button className=" bg-teal-400 rounded-xl p-3 text-center text-black hover:scale-[1.02] duration-200 cursor-pointer" onClick={() => { setIsModalOpen(!isModalOpen) }}>
                + Adicionar Sala
            </button>
            <AddRoomForm visible={isModalOpen} closeModal={() => { setIsModalOpen(false) }} />
        </>
    )
}