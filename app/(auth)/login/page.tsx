'use client'
import Image from "next/image"
import Link from "next/link"
import { signIn } from "next-auth/react";
import { ReactNode } from "react"

export default function Page() {
    return <>
        <main className="flex items-center gap-5 flex-col h-screen lg:flex-row">
            <Logo />
            <LoginBackground>
            <div className="absolute right-0.5 bottom-0.5 flex gap-2 items-end">
                <Link href={"/terms"} className="text-xs text-white/20 hover:underline hover:text-cyan-400/60">Termos de Serviço</Link>
                <p className="text-xs select-none text-white/20">•</p>
                <Link href={"/privacy"} className="text-xs text-white/20 hover:underline hover:text-cyan-400/60">Política de Privacidade</Link>
            </div>


                <div className="2xl:scale-125">
                    <h1 className="text-black text-sm text-center lg:mb-5 dark:text-white lg:text-3xl max-lg:mb-5">Fazer Login</h1>

                    <div className="bg-white dark:bg-[#1D1D1D] dark:border-white/25 dark:bg- border-2 w-84 h-114 border-black/25 rounded-4xl flex flex-col items-center lg:w-90 lg:h-110">

                        <div className="w-full h-45 flex flex-col items-center justify-center gap-5 lg:mt-5">
                            <input className="bg-[#E2E2E2] w-64 h-12 rounded-lg dark:bg-[#303030] placeholder:text-black/50 dark:placeholder:text-white/65 pl-5 lg:w-70  " placeholder="E-mail"></input>
                            <input className="bg-[#E2E2E2] w-64 h-12 rounded-lg dark:bg-[#303030] dark:placeholder:text-white/65 placeholder:text-black/50 pl-5 lg:w-70 " type="password" placeholder="Senha"></input>
                        </div>

                        <Link href={"#"} className="text-center text-blue-400 underline">Esqueci minha senha</Link>

                        <Link href={"dashboard"}>
                            <input type="button" className="bg-blue-500/20 w-50 mt-5 p-3 text-center rounded-xl duration-200 cursor-not-allowed text-white/20" value={"Continuar"} title="O serviço de login está indisponível nesse momento. Por favor, use sua conta Google.">
                            </input>
                        </Link>

                        <div className="w-3/4 h-0.5 bg-black/15 dark:bg-white/15 mt-5 "></div>

                        <p className="text-black font-thin mt-3 dark:text-white ">ou</p>

                        <button className="bg-white flex items-center gap-5 border p-1.5 px-3 border-black/15 rounded-4xl mt-3 cursor-pointer hover:scale-105 duration-200" onClick={() => { signIn("google", { callbackUrl: "/dashboard" }) }}>

                            <Image src={"/google.svg"} width={30} height={30} alt="Google"></Image>
                            <p className="text-black ">Continuar com Google</p>

                        </button>
                        <div className="flex text-sm gap-3 mt-5 lg:text-base lg:mb-5">

                            <p className="text-black dark:text-white">Não tem uma conta?</p>
                            <Link href={"/create"} className="text-blue-400 underline"> Crie uma Conta</Link>

                        </div>

                    </div>
                </div>

            </LoginBackground>

        </main>
    </>
}



function Logo() {
    return (
        <div className="md:w-2/5 w-full flex justify-center lg:p-10 bg-[#1D1D1D] md:h-full h-36 items-center">
            <div className="lg:hidden">
                <Image src="/LogoDesktop.svg" width={220} height={47} alt="Logo" />
            </div>

            <div className="max-lg:hidden">
                <Image src="/LogoDesktop.svg" width={450} height={100} alt="Logo" />
            </div>
        </div>
    );
}

function LoginBackground({ children }: { children: ReactNode }) {
    return (
        <>
            <div className="bg-white size-full flex flex-col items-center gap-10 dark:bg-[#1D1D1D] justify-center">
                {children}
            </div>
        </>
    )
}