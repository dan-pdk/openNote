'use client';
import Image from "next/image";
import { useSession, signIn, signOut } from "next-auth/react"

export default function Page() {
    const { data: session } = useSession();

    return (
        <>
            <div className="p-3 w-screen h-20 flex justify-around">
                <div className="w-1/2">
                    <Image src={"/LogoDesktopLight.svg"} width={200} height={100} alt="Logo"></Image>
                </div>
                <div className="flex h-full items-center w-1/2 justify-end gap-10 mr-4">
                    <div><Image src={"/Search.svg"} width={24} height={24} alt="Search"></Image></div>
                    <div><Image src={"/Plus.svg"} width={24} height={24} alt="Search"></Image></div>
                    <div><Image src={"/Menu.svg"} width={24} height={24} alt="Search"></Image></div>
                </div>
            </div>
            <div className="block bg-black/15 w-9/10 h-0.5 rounded-full m-auto mt-1 mb-0"></div>

            {session ? <div className="w-screen flex justify-center py-5">
                <button className="bg-red-500 w-40 h-12 text-white rounded-md text-center  font-semibold" onClick={() => {signOut()}}>Logar Fora</button>
            </div> : ""}
        </>

    )
}
