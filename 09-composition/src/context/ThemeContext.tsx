/* eslint-disable react-refresh/only-export-components */

import { createContext, useState, useContext, useEffect } from "react";

// value type
type ThemeContextValue = {
    theme: "light" | "dark";
    toggleTheme: () => void;
};

// The context
const ThemeContext = createContext<ThemeContextValue | null>(null);

// Provider component that owns the state
export function ThemeProvider({children}: {children: React.ReactNode}) {
    const [theme, setTheme] = useState<"light" | "dark">("light");

    useEffect(() => {
        document.documentElement.dataset.theme = theme;
    }, [theme]);

    const toggleTheme = () => setTheme(t => (t === "light" ? "dark": "light"));

    return (
        <ThemeContext value={{theme, toggleTheme}} >
            {children}
        </ThemeContext>
    );
}

// A guarded consumer hook
export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) throw new Error("useTheme must be used inside ThemeProvider");
    return context;
}