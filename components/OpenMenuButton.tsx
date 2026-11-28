'use client'
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"

export default function OpenMenuButton() {
    const pathname = usePathname();


    return (
        <Link href={`${pathname}?isMenuOpen=true`}>
            <button aria-label="Abrir menu" className="cursor-pointer">
                <Image src={"/Menu.svg"} width={24} height={24} alt="" className="dark:invert"></Image>
            </button>
        </Link>
    )
}