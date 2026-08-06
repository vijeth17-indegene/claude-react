import { useState, useEffect } from "react";

export default function LiveClock() {
    const [time, setTime] = useState<Date>(new Date());

    useEffect(()=> {
        const intervalId = setInterval(() => {
            console.log("interval....")
            setTime(new Date());
        }, 1000);

        return() => {
            console.log("clearing Interval....")
            clearInterval(intervalId);
        }

    }, [])

    return(
        <>
            <h2>{time.toLocaleTimeString()}</h2>
        </>
    );
}