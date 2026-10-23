import Calendar from "@/components/Calendar";
import DashboardMenu from "@/components/DashboardMenu"
import Header from "@/components/Header"


export default function Page() {
    return (
        <div className="dark:bg-[#1D1D1D] min-h-screen">
            <Header />
            <DashboardMenu />
            <div className="flex mx-auto items-center flex-col min-h-full ">
                
                <Calendar />
            </div>
        </div>
    )
}