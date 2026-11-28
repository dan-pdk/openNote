import Image from "next/image"
import Link from "next/link"
import OpenMenuButton from "./OpenMenuButton"

export default function Header() {

    return (
        <>
            <header className="flex items-center justify-between px-4 py-4 lg:px-10 select-none">
                <div className="w-32 lg:w-44">
                    <Link href={"/dashboard"}>
                        <Image src={"/LogoDesktopLight.svg"} width={180} height={38} alt="openNote" className="dark:hidden"></Image>
                        <Image src={"/LogoDesktop.svg"} width={180} height={38} alt="openNote" className="hidden dark:block"></Image>
                    </Link>
                </div>
                <div className="flex items-center gap-6 lg:gap-8">
                    <OpenMenuButton />
                </div>
            </header>
            <div className="h-px bg-black/15 dark:bg-white/15 mx-4 lg:mx-10"></div>
        </>
    )
}