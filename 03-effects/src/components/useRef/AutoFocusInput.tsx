import { useEffect, useRef } from 'react';

export default function AutoFocusInput() {
    const inputRef = useRef<HTMLInputElement>(null); 

    useEffect(()=> {
        inputRef.current?.focus();

        console.log(inputRef);
    }, []);

    return (
        <>
           <label htmlFor="auto">Auto-Focused</label> 
           <input id="auto" type="text" ref={inputRef} placeholder='Focus on Mount'/>
        </>
    );
}