import { isRouteErrorResponse, useRouteError } from "react-router";

export default function ErrorPage() {
    const error = useRouteError(); //
    const message = isRouteErrorResponse(error) 
        ? `${error.status} ${error.statusText}` 
        : error instanceof Error
            ? error.message
            : "unknown error";
    if (import.meta.env.DEV) console.error(error);
    return(
        <>
            <h1>Oops!</h1>
            <p>{message}</p>
        </>
    );
}

// useRouteError() — a React Router hook that gives you whatever was thrown during routing (from a loader, action, or a render crash in a child route). Its return type is unknown because literally anything can be thrown in JavaScript (throw "oops", throw new Error(...), throw new Response(...), throw { foo: 1 }, etc.).

//isRouteErrorResponse(error) — a type-guard helper. Returns true if the thrown value is a special ErrorResponse object that React Router creates when you (or a loader) throws a Response, or when a URL doesn't match and a 404 is generated.

// useRouteError() → unknown
//        │
//        ├── isRouteErrorResponse? → show "STATUS STATUSTEXT"
//        ├── instanceof Error?     → show error.message
//        └── otherwise             → show "unknown error"