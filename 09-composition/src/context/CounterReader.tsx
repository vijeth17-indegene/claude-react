import { useCombined } from "./CombineContext";

export default function CounterReader() {
    const { count } = useCombined();

    console.log("CounterReader Rendered");
    return <p>Count: {count}</p>;
}