"use client";

import {
  buildCalendarDateString,
  formatRelativeTaskDate,
  RoomTaskItem,
} from "@/lib/tasks";
import { ChevronRight } from "lucide-react";
import { useMemo } from "react";

type RoomUpcomingTasksPanelProps = {
  tasks: RoomTaskItem[];
  onSelectTaskDate: (dateString: string) => void;
};

export default function RoomUpcomingTasksPanel({
  tasks,
  onSelectTaskDate,
}: RoomUpcomingTasksPanelProps) {
  const todayDateString = useMemo(() => {
    const now = new Date();
    return buildCalendarDateString(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
  }, []);

  const upcomingTasks = useMemo(() => {
    return tasks
      .filter(
        (taskItem) =>
          !taskItem.concluida && taskItem.dataEntrega >= todayDateString,
      )
      .sort((firstTask, secondTask) =>
        firstTask.dataEntrega.localeCompare(secondTask.dataEntrega),
      );
  }, [tasks, todayDateString]);

  return (
    <aside className="w-full bg-[#F5F5F5] dark:bg-[#252525] rounded-2xl p-4 sm:p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-black dark:text-white">
            Próximas tarefas
          </h2>
          <span className="text-xs px-0.5 py-0.5 rounded-full font-medium">
            ({upcomingTasks.length})
          </span>
        </div>
      </div>

      {upcomingTasks.length > 0 ? (
        <ul className="flex flex-col gap-2.5 max-h-80 overflow-y-auto pr-0.5">
          {upcomingTasks.slice(0, 5).map((taskItem) => {
            const dateInfo = formatRelativeTaskDate(
              taskItem.dataEntrega,
              todayDateString,
            );

            return (
              <li key={taskItem.id}>
                <button
                  type="button"
                  onClick={() => onSelectTaskDate(taskItem.dataEntrega)}
                  className="w-full text-left rounded-xl p-3 bg-white dark:bg-[#1D1D1D] hover:scale-[1.01] hover:bg-black/4 dark:hover:bg-white/4 transition-all duration-150 cursor-pointer flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{
                        backgroundColor: taskItem.cor,
                      }}
                    />
                    <span className="text-sm font-medium text-black dark:text-white truncate">
                      {taskItem.nome}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {taskItem.hasUnreadMessages && (
                      <span
                        title="Mensagens não lidas"
                        aria-label="Mensagens não lidas"
                        className="w-2 h-2 rounded-full bg-[#E60000] shrink-0"
                      />
                    )}
                    <span
                      className={`text-xs font-medium ${
                        dateInfo.isToday
                          ? "text-teal-600 dark:text-teal-400 font-semibold"
                          : "text-black/50 dark:text-white/50"
                      }`}>
                      {dateInfo.label}
                    </span>
                    <ChevronRight className="w-4 h-4 text-black/40 dark:text-white/40" />
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="rounded-xl p-4 bg-white/70 dark:bg-[#1D1D1D]/70 text-center">
          <p className="text-xs text-black/55 dark:text-white/55">
            Nada para ver aqui
          </p>
        </div>
      )}
    </aside>
  );
}