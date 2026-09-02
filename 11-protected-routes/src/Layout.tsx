import { Link, Outlet, useNavigate } from "react-router";
import { useAuth } from "./auth/AuthContext";

export default function Layout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/", { replace: true });
    };

    return (
        <>
            <nav>
                <Link to="/">Home</Link>{" | "}
                {user && <><Link to="/dashboard">Dashboard</Link>{" | "}</>}
                {user && <><Link to="/profile">Profile</Link>{" | "}</>}
                {user ? (
                    <button type="button" onClick={handleLogout}>
                        Logout ({user.username})
                    </button>
                ) : (
                    <Link to="/login">Login</Link>
                )}
            </nav>
            <main>
                <Outlet />
            </main>
        </>
    );
}