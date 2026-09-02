import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "./AuthContext";
import type { User } from "../types";

export default function ProtectedRoute() {
    const { user, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) return <p>Checking session...</p>;

    if (!user) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    // Narrowed to non-null here; expose to children via outlet context.
    return <Outlet context={{ user } satisfies { user: User }} />;
}