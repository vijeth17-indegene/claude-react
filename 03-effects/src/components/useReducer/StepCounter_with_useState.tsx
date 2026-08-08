import { useState } from "react";

export default function StepCounter_with_useState() {
    const [count, setCount] = useState(0);
    const [step, setStep] = useState(1);

    const handleIncrement = () => {
        setCount(prevCount => prevCount + step);
    };

    const handleDecrement = () => {
        setCount(prevCount => prevCount - step);
    };

    const handleReset = () => {
        setCount(0);
    }

    return (
        <>
            <p>Count: {count}</p>
            <div>
                <label htmlFor="Step">Step:</label>
                <input type="number" id="Step" value={step} onChange={e => setStep(Number(e.target.value))} />
            </div>
            <button onClick={handleDecrement}>-</button>
            <button onClick={handleIncrement}>+</button>
            <button onClick={handleReset}>Reset</button>
        </>
    );
}