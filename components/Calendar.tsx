export default function Calendar() {
    const date = new Date()
    const day = date.getDate();
    const daysOfTheWeek = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];
    const firstDayOfTheWeekOfTheMonth = getFirstDayOfTheWeekOfTheMonth()

    function createTSXDays() {
        const days = [];
        for (let i = 1; i <= 31; i++) {
            days.push(<div className={"hover:bg-white/15 aspect-square rounded-full duration-200 text-center cursor-pointer p-4" + (i == 1 ? ` col-start-${firstDayOfTheWeekOfTheMonth + 1}` : "")}>
                <li className="select-none" key={i}>{i}</li>
            </div>
            )
        }

        return days;
    }

    function createTSXDaysOfTheWeek() {
        const daysOfTheWeek = ["D", "S", "T", "Q", "Q", "S", "S"];
        return daysOfTheWeek.map(day => {
            return <li className="select-none mb-4 text-red-500">{day}</li>
        })
    }

    return (
        <>
            <div className="list-none grid grid-cols-7 gap-1 text-center text-xl mt-12 ">
                {createTSXDaysOfTheWeek()}
                {createTSXDays()}
            </div>
        </>
    )
}

type daysOfTheWeekIteratorType = {
    currentDayOfTheWeek: number,
    setPreviousDay: Function,
    setNextDay: Function,
}

function getFirstDayOfTheWeekOfTheMonth() {
    const date = new Date();

    const firstDayDate = new Date(date.getFullYear(), date.getMonth(), 1);
    console.log(firstDayDate.getDay());
    return firstDayDate.getDay()
}
