export default function Calendar() {
    const date = new Date()
    const day = date.getDay();

    return (
        <>
            <div>
                <p>{day}</p>
            </div>
        </>
    )
}