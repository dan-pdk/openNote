'use client'
import AddRoomForm from "./AddRoomForm";
import { useState } from "react";
export default function AddRoomButton() {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <button className="bg-[#E2E2E2] dark:bg-[#303030] rounded-xl p-3 text-center text-black/60 dark:text-white/60 hover:scale-[1.02] duration-200 cursor-pointer" onClick={() => { setIsModalOpen(!isModalOpen) }}>
                + Adicionar Sala
            </button>
            <AddRoomForm visible={isModalOpen} closeModal={() => { setIsModalOpen(false) }} />
        </>
    )
}