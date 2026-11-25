import SessionProviderWrapper from "@/components/SessionProviderWrapper";
import { ReactNode } from "react";

export default function ProfileLayout({ children }: { children: ReactNode }) {
    return <SessionProviderWrapper>{children}</SessionProviderWrapper>;
}
