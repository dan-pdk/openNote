'use client'
import Link from 'next/link';
import Image from 'next/image';

export default function GenericWideButton({label, href}:{label: string, href: string}) {
    return (
        <>
            <Link href={href}>
              <button className="relative bg-[#E2E2E2] dark:bg-[#222222] rounded-xl p-3 text-center text-black/35 dark:text-white/60 hover:scale-[1.02] duration-200 cursor-pointer w-full flex justify-center align-center">
                {label}
                <Image src={"/ChevronRight.svg"} width={20} height={20} alt="" className="dark:invert absolute right-3" />
              </button>
            </Link>
        </>
    )
}
