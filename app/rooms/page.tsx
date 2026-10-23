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
                <h1 className="text-center font-semibold text-2xl mt-16 text-black dark:text-white">{month}</h1>
                <Calendar />
            </div>
        </div>
    )
}