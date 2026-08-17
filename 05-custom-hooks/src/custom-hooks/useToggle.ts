import { useState } from 'react';

export default function useToggle(initialValue:boolean = false): [boolean, () => void] {
    const [value, setValue] = useState<boolean>(initialValue);

    const toggle = () => {
        setValue(prev => !prev)
    }

    return [value, toggle];
}

//Rename to useToggle.ts instead .tsx?
//ExplainYes, it is appropriate to rename the file to `useToggle.ts` instead of `useToggle.tsx`.
//Reasoning: The `.tsx` extension is typically used for files that contain JSX syntax, which is a syntax extension for JavaScript that allows you to write HTML-like code within your JavaScript. Since the `useToggle` custom hook does not contain any JSX and is purely a TypeScript function, it is more appropriate to use the `.ts` extension. This helps to clearly indicate that the file is a TypeScript module without any JSX content.


//setValue(!value) vs setValue(prev => !prev)
//Using `setValue(!value)` directly can lead to potential issues in scenarios where the state update is asynchronous or when multiple state updates are queued. This is because `value` may not reflect the most recent state at the time of the update, leading to unexpected behavior.
//Using the functional form `setValue(prev => !prev)` ensures that the update is based on the most recent state, avoiding such issues.
