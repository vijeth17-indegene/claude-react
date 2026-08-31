import { useCombined } from "./CombineContext";

export default function ThemeReader() {
    const { theme } = useCombined();

    console.log("ThemeReader Rendered");
    return <p>Theme: {theme}</p>;
}