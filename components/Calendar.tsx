"use client";

import CalendarDate from "@/components/CalendarDate";
import DayTasksModal from "@/components/DayTasksModal";
import { buildCalendarDateString, RoomTaskItem } from "@/lib/tasks";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";

type CalendarProps = {
    roomId: string;
    tasks: RoomTaskItem[];
    currentUserId: string;
    currentUserName: string;
    isRoomLeader: boolean;
    canCreateTasks: boolean;
};

const PORTUGUESE_MONTHS = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
];

const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export default function Calendar({
    roomId,
    tasks,
    currentUserId,
    currentUserName,
    isRoomLeader,
    canCreateTasks,
}: CalendarProps) {
    const [currentDateCursor, setCurrentDateCursor] = useState(() => new Date());
    const [selectedDateString, setSelectedDateString] = useState<string | null>(
        null
    );

    const currentYear = currentDateCursor.getFullYear();
    const currentMonthIndex = currentDateCursor.getMonth();
    const currentMonthLabel = PORTUGUESE_MONTHS[currentMonthIndex];

    const todayDateString = useMemo(() => {
        const nowDate = new Date();
        return buildCalendarDateString(
            nowDate.getFullYear(),
            nowDate.getMonth(),
            nowDate.getDate()
        );
    }, []);

    const tasksByDateMap = useMemo(() => {
        const groupedTasks = new Map<string, RoomTaskItem[]>();
        for (const taskItem of tasks) {
            const existingDayList = groupedTasks.get(taskItem.dataEntrega) ?? [];
            existingDayList.push(taskItem);
            groupedTasks.set(taskItem.dataEntrega, existingDayList);
        }
        return groupedTasks;
    }, [tasks]);

    const daysInCurrentMonth = new Date(
        currentYear,
        currentMonthIndex + 1,
        0
    ).getDate();

    const firstWeekdayOffset = new Date(
        currentYear,
        currentMonthIndex,
        1
    ).getDay();

    function handleGoToPreviousMonth() {
        setCurrentDateCursor(
            new Date(currentYear, currentMonthIndex - 1, 1)
        );
    }

    function handleGoToNextMonth() {
        setCurrentDateCursor(
            new Date(currentYear, currentMonthIndex + 1, 1)
        );
    }

    const dayCells = [];
    for (let dayNumber = 1; dayNumber <= daysInCurrentMonth; dayNumber++) {
        const cellDateString = buildCalendarDateString(
            currentYear,
            currentMonthIndex,
            dayNumber
        );
        const dayTasks = tasksByDateMap.get(cellDateString) ?? [];

        dayCells.push(
            <CalendarDate
                key={cellDateString}
                dayNumber={dayNumber}
                isFirstDayOfMonth={dayNumber === 1}
                firstWeekdayOffset={firstWeekdayOffset}
                isToday={cellDateString === todayDateString}
                dayTasks={dayTasks}
                onSelectDay={() => setSelectedDateString(cellDateString)}
            />
        );
    }

    const selectedDayTasks = selectedDateString
        ? tasksByDateMap.get(selectedDateString) ?? []
        : [];

    return (
        <section className="flex flex-col items-center w-full max-w-3xl mx-auto bg-[#F9F9F9] dark:bg-[#232323] rounded-3xl p-5 sm:p-8 shadow-sm">
            <div className="text-sm font-semibold tracking-widest uppercase text-black/45 dark:text-white/45">
                {currentYear}
            </div>

            <div className="flex mt-1 items-center justify-between w-full max-w-md">
                <button
                    type="button"
                    onClick={handleGoToPreviousMonth}
                    aria-label="Mês anterior"
                    className="p-2.5 rounded-full text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10 transition-colors select-none cursor-pointer"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <h2 className="text-center font-bold text-2xl sm:text-3xl text-black dark:text-white">
                    {currentMonthLabel}
                </h2>
                <button
                    type="button"
                    onClick={handleGoToNextMonth}
                    aria-label="Próximo mês"
                    className="p-2.5 rounded-full text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10 transition-colors select-none cursor-pointer"
                >
                    <ChevronRight className="w-6 h-6" />
                </button>
            </div>

            <div className="w-full list-none grid grid-cols-7 gap-2 sm:gap-3 text-center text-lg sm:text-2xl mt-8">
                {WEEKDAY_LABELS.map((weekdayLabel, weekdayIndex) => (
                    <div
                        key={`${weekdayIndex}-${weekdayLabel}`}
                        className="select-none mb-2 text-xs sm:text-sm font-semibold uppercase tracking-wider text-red-500"
                    >
                        {weekdayLabel}
                    </div>
                ))}
                {dayCells}
            </div>

            {selectedDateString && (
                <DayTasksModal
                    key={selectedDateString}
                    isOpen={true}
                    selectedDateString={selectedDateString}
                    roomId={roomId}
                    tasksForDay={selectedDayTasks}
                    currentUserId={currentUserId}
                    currentUserName={currentUserName}
                    isRoomLeader={isRoomLeader}
                    canCreateTasks={canCreateTasks}
                    onClose={() => setSelectedDateString(null)}
                />
            )}
        </section>
    );
}