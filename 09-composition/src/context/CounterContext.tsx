/* eslint-disable react-refresh/only-export-components */

import { createContext, useContext, useEffect, useState } from "react";

const CounterContext = createContext<number | null>(null);

export function CounterProvider({children}: {children: React.ReactNode}) {
    const [count, setCount] = useState(0);

    useEffect(()=> {
        const id = setInterval(() => setCount(c => c + 1), 1000);
        return () => clearInterval(id);
    }, []);

    return <CounterContext value={count}>{children}</CounterContext>
}

export function useCounter() {
    const c = useContext(CounterContext);
    if (c === null) throw new Error("useCounter must be used inside Counter Provider");
    return c;  
}