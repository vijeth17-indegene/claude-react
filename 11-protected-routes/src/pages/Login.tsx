import { useState } from "react";
import { useNavigate, useLocation, type Location } from "react-router";
import { useAuth } from "../auth/AuthContext";

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [username, setUsername] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Where to send the user after login — set by ProtectedRoute, defaults to /dashboard.
    const from = (location.state as { from?: Location })?.from?.pathname ?? "/dashboard";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username.trim()) return;
        setError(null);
        setIsSubmitting(true);
        try {
            await login(username.trim());
            navigate(from, { replace: true });
        } catch {
            setError("Login failed");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <h1>Login</h1>
            <label>
                Username
                <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoFocus
                    required
                />
            </label>
            <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
            {error && <p role="alert">{error}</p>}
        </form>
    );
}