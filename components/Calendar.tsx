'use client'
import { UUID } from "crypto";
import { MouseEventHandler, useState } from "react";
import AddTaskForm from "./AddTaskForm";

type taskType = {
    id: string,
    name: string,
    dueDate: string,
}

export default function Calendar({ tasks }: { tasks: Array<taskType> }) {
    const [date, setDate] = useState(new Date());
    const currentYear = date.getFullYear();
    const firstDayOfTheWeekOfTheMonth = getFirstDayOfTheWeekOfTheMonth();
    const currentMonthNumber = date.getMonth();
    const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]
    const month = months[currentMonthNumber];
    const [modalDate, setModalDate] = useState(new Date())
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    let currentMonthTasks: Array<taskType> = [];
    if (tasks.length !== 0) {
        currentMonthTasks = tasks.filter(task => {
            const dueDate = task.dueDate
            const dueDateDayInfo = dueDate.split(" ")[0];
            const [year, month, day] = dueDateDayInfo.split("-");
            if (Number(year) === currentYear && Number(month) === currentMonthNumber + 1) {
                return true
            }
        })
    }

    function getMaxDaysOfTheMonth() {
        const newDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        return newDate.getDate();
    }
    const maxDaysOfTheMonth = getMaxDaysOfTheMonth()
    
    function getFirstDayOfTheWeekOfTheMonth() {
        const firstDayDate = new Date(date.getFullYear(), date.getMonth(), 1);
        return firstDayDate.getDay()
    }
    
    function createTSXDays() {
        const days = [];
        for (let i = 1; i <= maxDaysOfTheMonth; i++) {
            const key = `${date.getFullYear()}-${date.getMonth() + 1}-${i}`
            function getHasTasks() {
                if (currentMonthTasks.length !== 0 ) {
                    currentMonthTasks.forEach(task => {
                        if (Number(task.dueDate.split(" ")[0].split(" ")[2]) === i) {
                            return true
                        }
                    })
                }
                return false
            }
            const hasTasks = getHasTasks();
            const className = "aspect-square rounded-full duration-200 text-center cursor-pointer p-4 text-black dark:text-white" + (hasTasks ? " hover:bg-red/15 bg-red text-white" : " hover:bg-black/10 dark:hover:bg-white/15")

            function updateModalDate() {
                const newDate = new Date(date.getFullYear(), date.getMonth(), i)
                setModalDate(newDate)
            }
            
            function openModal() {
                updateModalDate();
                setIsTaskModalOpen(true);
            }
            
            days.push(<div onClick={openModal} key={key} style={i === 1 ? { gridColumnStart: firstDayOfTheWeekOfTheMonth + 1 } : undefined} className={className}>
                <button className="cursor-pointer select-none">{i}</button>
            </div>
            )
        }

        return days;
    }

    function goToNextMonth() {
        const newDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        newDate.setMonth(newDate.getMonth() + 1);
        setDate(newDate)
    }

    function goToPreviousMonth() {
        const newDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        newDate.setMonth(newDate.getMonth() - 1);
        setDate(newDate);
    }

    function createTSXDaysOfTheWeek() {
        const daysOfTheWeek = ["D", "S", "T", "Q", "Q", "S", "S"];
        return daysOfTheWeek.map((day, index) => {
            return <li key={`${index + 1}`} className="select-none mb-4 text-red-500">{day}</li>
        })
    }

    return (
        <>
            <div className="flex mt-16 items-center gap-20 text-4xl text-black dark:text-white font-bold">{date.getFullYear()}</div>
            <div className="flex mt-10 justify-center gap-20 text-black dark:text-white">
                <span onClick={goToPreviousMonth} className="font-semibold text-2xl select-none cursor-pointer"> &lt; </span>
                <h1 className="text-center min-w-35 max-w-35 font-semibold text-2xl text-black dark:text-white">{month}</h1>
                <span className="font-semibold text-2xl select-none cursor-pointer" onClick={goToNextMonth}> &gt; </span>
            </div>
            <div className="list-none grid grid-cols-7 gap-1 text-center text-xl mt-12 ">
                {createTSXDaysOfTheWeek()}
                {createTSXDays()}
               <AddTaskModal isOpen={isTaskModalOpen} closeModal={() => {setIsTaskModalOpen(false)}} modalDate={modalDate} setModalDate={setModalDate}/>
            </div>

        </>
    )
}

function AddTaskModal({ isOpen, closeModal, modalDate, setModalDate } : { isOpen: boolean, closeModal: Function, modalDate: Date, setModalDate: Function }) {
    if (isOpen) {
        return (
            <AddTaskForm closeModal={closeModal} modalDate={modalDate} setModalDate={setModalDate}></AddTaskForm>
    )
    } else {
        <>
        </>
    }
}
