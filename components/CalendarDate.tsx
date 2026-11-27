"use client";

import { RoomTaskItem } from "@/lib/tasks";

type CalendarDateProps = {
    dayNumber: number;
    isFirstDayOfMonth: boolean;
    firstWeekdayOffset: number;
    isToday: boolean;
    dayTasks: RoomTaskItem[];
    onSelectDay: () => void;
};

export default function CalendarDate({
    dayNumber,
    isFirstDayOfMonth,
    firstWeekdayOffset,
    isToday,
    dayTasks,
    onSelectDay,
}: CalendarDateProps) {
    const hasTasks = dayTasks.length > 0;
    const firstTaskColor = hasTasks ? dayTasks[0].cor : undefined;
    const previewTasks = dayTasks.slice(0, 3);
    const remainingTasksCount = dayTasks.length - previewTasks.length;

    return (
        <div
            style={
                isFirstDayOfMonth
                    ? { gridColumnStart: firstWeekdayOffset + 1 }
                    : undefined
            }
            className="relative group flex items-center justify-center"
        >
            <button
                type="button"
                onClick={onSelectDay}
                aria-label={`Dia ${dayNumber}${hasTasks ? `, ${dayTasks.length} tarefa(s)` : ""}`}
                className={`aspect-square w-full max-w-14 rounded-full flex flex-col items-center justify-center gap-0.5 transition-colors duration-200 cursor-pointer select-none hover:bg-black/10 dark:hover:bg-white/10 ${
                    isToday
                        ? "ring-2 ring-teal-500/70 font-semibold text-teal-600 dark:text-teal-400"
                        : "text-black dark:text-white"
                }`}
            >
                <span className="leading-none">{dayNumber}</span>
                {hasTasks && firstTaskColor ? (
                    <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: firstTaskColor }}
                    />
                ) : (
                    <span className="w-2 h-2 shrink-0" aria-hidden="true" />
                )}
            </button>

            {hasTasks && (
                <div
                    role="tooltip"
                    className="pointer-events-none opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible transition-all duration-150 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-30 w-max max-w-56 bg-white dark:bg-[#2A2A2A] text-black dark:text-white border border-black/10 dark:border-white/10 shadow-xl rounded-xl px-3 py-2 text-left"
                >
                    <ul className="flex flex-col gap-1">
                        {previewTasks.map((taskItem) => (
                            <li
                                key={taskItem.id}
                                className="flex items-center gap-2 text-xs font-medium min-w-0"
                            >
                                <span
                                    className="w-2 h-2 rounded-full shrink-0"
                                    style={{ backgroundColor: taskItem.cor }}
                                />
                                <span
                                    className={`truncate max-w-44 ${
                                        taskItem.concluida ? "line-through opacity-60" : ""
                                    }`}
                                >
                                    {taskItem.nome}
                                </span>
                            </li>
                        ))}
                    </ul>
                    {remainingTasksCount > 0 && (
                        <p className="mt-1 text-[11px] text-black/50 dark:text-white/50">
                            +{remainingTasksCount} mais
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
