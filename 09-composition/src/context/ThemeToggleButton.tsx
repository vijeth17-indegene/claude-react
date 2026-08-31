import { useTheme } from "./ThemeContext";

export default function ThemeToggleButton() {
    const { theme, toggleTheme} = useTheme();
    return (
        <button onClick={toggleTheme}>
            Switch to {theme === 'light' ? 'dark' : 'light'} mode (current: {theme})
        </button>
    );
}