import { useEffect, useState } from "react";

export default function TitleCounter() {
    const [count, setCount] = useState<number>(0);

    useEffect(()=> {
        document.title = `Count: ${count}`;
    }, [count])
    return(
        <>
            <p>Count: {count}</p>
            <button onClick={() => setCount((c) => c + 1)}>Increment</button>
        </>
    );
}