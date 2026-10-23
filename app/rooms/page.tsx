import Calendar from "@/components/Calendar";
import DashboardMenu from "@/components/DashboardMenu"
import Header from "@/components/Header"


export default function Page() {
    const date = new Date();
    const monthNumber = date.getMonth();
    const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]
    const month = months[monthNumber]

    return (
        <div className="dark:bg-[#1D1D1D] min-h-screen">
            <Header />
            <DashboardMenu />
            <div className="flex mx-auto items-center flex-col min-h-full ">
                <div className="flex mt-16 items-center gap-20">
                    <span className="font-semibold text-2xl select-none cursor-pointer"> &lt; </span>
                    <h1 className="text-center font-semibold text-2xl text-black dark:text-white">{month}</h1>
                    <span className="font-semibold text-2xl select-none cursor-pointer"> &gt; </span>
                </div>
                <Calendar />
            </div>
        </div>
    )
}