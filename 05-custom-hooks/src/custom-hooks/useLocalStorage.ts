import { useEffect, useState } from "react";

export default function useLocalStorage<T> (key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>]  {
    const [value, setValue] = useState(() => {
        try {
            const stored = localStorage.getItem(key);
            return stored !== null ? (JSON.parse(stored) as T ) : initialValue;
        }
        catch {
            return initialValue
        }
    });
    
    useEffect(() => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch {
            //Storage might be full
        }
    }, [key, value] );

    return [value, setValue];
}