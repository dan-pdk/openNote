import SessionProviderWrapper from "@/components/SessionProviderWrapper"
import type { AppProps } from "next/app"
import { ReactNode } from "react"

export default function App({children} : {children : ReactNode}) {
    return (
        <SessionProviderWrapper>
            {children}
        </SessionProviderWrapper>
    )
}