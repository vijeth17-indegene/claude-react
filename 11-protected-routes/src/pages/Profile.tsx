import { useOutletContext } from "react-router";
import type { User } from "../types";

export default function Profile() {
    const { user } = useOutletContext<{ user: User }>();
    return <h2>Profile — {user.username}</h2>;
}