/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useContext, useEffect } from "react";

type CombinedValue = {
  theme: "light" | "dark";
  toggleTheme: () => void;
  count: number;
};

const CombinedContext = createContext<CombinedValue | null>(null);

export function CombinedProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [count, setCount] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setCount(c => c + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const toggleTheme = () => setTheme(t => (t === "light" ? "dark" : "light"));

  return (
    <CombinedContext value={{ theme, toggleTheme, count }}>
      {children}
    </CombinedContext>
  );
}

export function useCombined() {
  const v = useContext(CombinedContext);
  if (!v) throw new Error("useCombined must be used inside CombinedProvider");
  return v;
}