'use client';

import { useSession, signIn, signOut } from "next-auth/react"

export default function Page() {
    const {data: session} = useSession()

    if (session) {
        return (
            <>
                <h1>Signed in as {session.user?.email}</h1><br />
                <button onClick={() => signOut()}>Sign out</button>
            </>
        )
    }

    return (
        <>
            <h1>Not signed in</h1>
            <button onClick={() => {signIn()}}>Sign in</button>
        </>
    )

}
