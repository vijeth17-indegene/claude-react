import { useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";
import type { User } from "../types";

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function check() {
            // Simulates a real session-check network call so the loading path is visible.
            await new Promise(r => setTimeout(r, 1500));
            const stored = localStorage.getItem("user");
            if (stored) setUser(JSON.parse(stored));
            setIsLoading(false);
        }
        check();
    }, []);

    const login = async (username: string) => {
        const fakeUser = { id: '1', username};
        localStorage.setItem("user", JSON.stringify(fakeUser));
        setUser(fakeUser);
    };

    const logout = () => {
        localStorage.removeItem("user");
        setUser(null);
    };

    return (
        <div>
            <AuthContext value={{user, isLoading, login, logout}}>
                {children}
            </AuthContext>
        </div>
    );
}