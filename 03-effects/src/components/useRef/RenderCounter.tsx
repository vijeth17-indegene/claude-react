import { useState } from 'react';

export default function RenderCounter() {
    const [count, setCount] = useState(0);
    // const renderCount = useRef(0);

    // renderCount.current += 1;

    return (
        <div>
            <p>Button clicks (state): {count}</p>
            {/* <p>Renders (ref): {renderCount.current}</p> */}
            <button onClick={() => setCount(c => c + 1)}>Increment</button>
        </div>
    );
}