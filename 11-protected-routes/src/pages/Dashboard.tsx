import { useOutletContext } from "react-router";
import type { User } from "../types";

export default function Dashboard() {
    const { user } = useOutletContext<{ user: User }>();
    return (
        <div>
            <h1>Dashboard</h1>
            <p>Welcome, {user.username}!</p>
        </div>
    );
}