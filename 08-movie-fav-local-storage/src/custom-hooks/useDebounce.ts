import { useState, useEffect } from 'react';

export default function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(()=> {
            setDebouncedValue(value);
        }, delay);

        return () => clearTimeout(handler);
    }, [value, delay]);

    return debouncedValue;
}

//why using useEffect here?
//The `useEffect` hook is used in this custom hook (`useDebounce`) to handle the side effect of updating the debounced value after a specified delay. Here's why it's necessary:
//1. **Side Effects**: In React, updating state based on asynchronous operations (like a timeout) is considered a side effect. The `useEffect` hook allows you to perform these side effects in a controlled manner, ensuring that the component behaves predictably.
//2. **Cleanup**: The `useEffect` hook provides a cleanup function that runs when the component unmounts or before the effect runs again. In this case, it clears the timeout to prevent memory leaks and ensure that only the latest value is considered for debouncing.
//3. **Dependency Management**: By specifying `[value, delay]` as dependencies, the effect will re-run whenever the `value` or `delay` changes. This ensures that the debounced value is updated correctly based on the latest input and delay settings.

//clearTimeout is used to cancel the previous timeout when the value or delay changes. This prevents multiple timeouts from running simultaneously and ensures that only the latest value is considered for debouncing. If we didn't clear the timeout, we could end up with multiple timeouts that update the debounced value at different times, leading to unexpected behavior.
//example: If the user types quickly, multiple timeouts could be set, and the debounced value might update with an older input instead of the latest one. By clearing the previous timeout, we ensure that only the most recent input is used for debouncing.


//explain debounce in simple terms
//Debounce is a programming technique used to limit how often a function can be executed. In simple terms, it ensures that a function is only called after a certain amount of time has passed since the last time it was invoked.
//For example, if you have a search input field and you want to fetch results from a server as the user types, you don't want to send a request for every single keystroke. Instead, you can use debounce to wait until the user has stopped typing for a specified amount of time (e.g., 500 milliseconds) before sending the request. This way, you reduce the number of requests and improve performance.

//In the context of the `useDebounce` custom hook, it takes a value and a delay as inputs. It returns a debounced version of the value that only updates after the specified delay has passed since the last change. This is useful for scenarios like search inputs, where you want to avoid making too many requests while the user is still typing.

//also explain useEffect and clearTimeout used in this fucntion in simple terms
//`useEffect` is a React hook that allows you to perform side effects in your components. In this case, it's used to set up a timer (using `setTimeout`) that will update the debounced value after a specified delay. The effect runs whenever the `value` or `delay` changes, ensuring that the debounced value is always based on the latest input.
//`clearTimeout` is used to cancel the previous timer whenever the effect re-runs or the component unmounts. This prevents multiple timers from running simultaneously and ensures that only the latest value is used for debouncing.