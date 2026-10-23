'use client'
import { useState } from "react";

export default function Calendar() {
    const [date, setDate] = useState(new Date());
    const day = date.getDate();
    const daysOfTheWeek = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];
    const firstDayOfTheWeekOfTheMonth = getFirstDayOfTheWeekOfTheMonth();
    const monthNumber = date.getMonth();
    const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]
    const month = months[monthNumber]

    function getFirstDayOfTheWeekOfTheMonth() {
        const firstDayDate = new Date(date.getFullYear(), date.getMonth(), 1);
        console.log(firstDayDate.getDay())
        return firstDayDate.getDay()
    }

    function createTSXDays() {
        const days = [];
        for (let i = 1; i <= 31; i++) {
            const key = `${date.getFullYear()}-${date.getMonth() + 1}-${i}`
            days.push(<div key={key} style={i === 1 ? { gridColumnStart: firstDayOfTheWeekOfTheMonth + 1 } : undefined} className="hover:bg-white/15 aspect-square rounded-full duration-200 text-center cursor-pointer p-4">
                <li className="select-none" >{i}</li>
            </div>
            )
        }

        return days;
    }

    function goToNextMonth() {
        const newDate = new Date(date.getFullYear(), date.getMonth(), 1);
        newDate.setMonth(newDate.getMonth() + 1);
        setDate(newDate)
    }

    function createTSXDaysOfTheWeek() {
        const daysOfTheWeek = ["D", "S", "T", "Q", "Q", "S", "S"];
        return daysOfTheWeek.map((day, index) => {
            return <li key={`${index + 1}`} className="select-none mb-4 text-red-500">{day}</li>
        })
    }

    return (
        <>
            <div className="flex mt-16 items-center gap-20">
                <span className="font-semibold text-2xl select-none cursor-pointer"> &lt; </span>
                <h1 className="text-center font-semibold text-2xl text-black dark:text-white">{month}</h1>
                <span className="font-semibold text-2xl select-none cursor-pointer" onClick={goToNextMonth}> &gt; </span>
            </div>
            <div className="list-none grid grid-cols-7 gap-1 text-center text-xl mt-12 ">
                {createTSXDaysOfTheWeek()}
                {createTSXDays()}
            </div>
        </>
    )
}



