import { createBrowserRouter, RouterProvider } from "react-router";
import Layout from "./Layout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import ProtectedRoute from "./auth/ProtectedRoute";

const router = createBrowserRouter([
    {
        path: "/",
        element: <Layout />,
        children: [
            { index: true, element: <Home /> },
            { path: "login", element: <Login /> },
            {
                element: <ProtectedRoute />,
                children: [
                    { path: "dashboard", element: <Dashboard /> },
                    { path: "profile", element: <Profile /> },
                ],
            },
        ],
    },
]);

export default function App() {
    return <RouterProvider router={router} />;
}