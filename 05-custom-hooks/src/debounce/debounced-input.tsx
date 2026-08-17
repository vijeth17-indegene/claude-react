import { useState } from 'react';
import useDebounce from '../custom-hooks/useDebounce';

export default function DebouncedInput() {
    const [input,setInput] = useState("");

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInput(e.target.value);
    }

    const debouncedValue = useDebounce(input, 1000);
    return(
        <>  
            <h2>You have typed: {debouncedValue}</h2>
            <input type="text" value={input} placeholder="Type Something" onChange={handleInputChange}/>
        </>
    );
}