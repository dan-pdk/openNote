import Image from "next/image"
import Link from "next/link"

import { ReactElement, ReactNode } from "react"

export default function Page() {
    return <>
        <main className="flex items-center gap-5 flex-col h-screen">
            <Logo />
            <LoginBackground>
                <h1 className="text-black text-2xl text-center mt-14 dark:text-white">Fazer Login</h1>
                <div className="bg-white dark:bg-[#1D1D1D] dark:border-white/25 dark:bg- border-2 w-84 h-114 border-black/25 rounded-4xl flex flex-col items-center">
                    <div className="w-full h-45 flex flex-col items-center justify-center gap-5">
                        <input className="bg-[#E2E2E2] w-64 h-12 rounded-lg dark:bg-[#303030] placeholder:text-black/50 dark:placeholder:text-white/65 pl-5" placeholder="E-mail"></input>
                        <input className="bg-[#E2E2E2] w-64 h-12 rounded-lg dark:bg-[#303030] dark:placeholder:text-white/65 placeholder:text-black/50 pl-5" placeholder="Senha"></input>
                    </div>
                    <Link href={"#"} className="text-center text-blue-400 underline">Esqueci minha senha</Link>
                    <input type="button" className="bg-blue-500 w-50 mt-5 p-3 text-center rounded-xl hover:scale-105 duration-200 cursor-pointer" value={"Continuar"}>
                    </input>
                    <div className="w-3/4 h-0.5 bg-black/15 dark:bg-white/15 mt-5"></div>
                    <p className="text-black font-thin mt-3 dark:text-white">ou</p>
                    <div className="bg-white flex items-center gap-5 border p-1.5 px-3 border-black/15 rounded-4xl mt-3">
                        <Image src={"/google.svg"} width={30} height={30} alt="Google"></Image>
                        <p className="text-black">Continuar com Google</p>
                    </div>
                    <div className="flex text-sm gap-3 mt-5">
                        <p className="text-black dark:text-white">Não tem uma conta?</p>
                        <Link href={"#"} className="text-blue-400 underline"> Crie uma Conta</Link>
                    </div>
                </div>
            </LoginBackground>

        </main>
    </>
}


function Logo() {
    return (
        <Image src={"/LogoMobile.svg"} width={340} height={100} alt=""></Image>
    )
}

function LoginBackground({ children }: { children: ReactNode }) {
    return (
        <>
            <div className="bg-white size-full flex flex-col items-center gap-10 dark:bg-[#1D1D1D]">
                {children}
            </div>
        </>
    )
}