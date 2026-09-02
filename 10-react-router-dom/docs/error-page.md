# `ErrorPage` — Walkthrough & When It Fires

This note covers the `ErrorPage` component used in the React Router setup for this project, how each line works, and how to trigger it during development.

---

## 1. The component

Located at `src/pages/ErrorPage.tsx`:

```tsx
import { isRouteErrorResponse, useRouteError } from "react-router";

export default function ErrorPage() {
    const error = useRouteError();
    const message = isRouteErrorResponse(error)
        ? `${error.status} ${error.statusText}`
        : error instanceof Error
            ? error.message
            : "unknown error";
    return (
        <>
            <h1>Oops!</h1>
            <p>{message}</p>
        </>
    );
}
```

---

## 2. Line-by-line explanation

### Imports

```tsx
import { isRouteErrorResponse, useRouteError } from "react-router";
```

- **`useRouteError()`** — React Router hook that returns whatever was thrown during routing (from a loader, action, or a render crash in a child route). Its return type is `unknown` because anything can be thrown in JavaScript.
- **`isRouteErrorResponse(error)`** — Type-guard helper. Returns `true` if the thrown value is an `ErrorResponse` object that React Router creates when a `Response` is thrown, or when a URL doesn't match and a 404 is synthesized.

### Grabbing the error

```tsx
const error = useRouteError();
```

`error` is typed as `unknown`. It must be narrowed before accessing properties like `.message` or `.status`.

### The narrowing chain

```tsx
const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
        ? error.message
        : "unknown error";
```

A nested ternary that handles three cases in priority order:

#### Case A — Route error response

```tsx
isRouteErrorResponse(error)
```

True when React Router wrapped the thrown value into an `ErrorResponse`. Typical triggers:

- A loader did `throw new Response("Not Found", { status: 404 })`
- The URL matched no route and React Router synthesized a 404

TypeScript now knows `error` has `.status` (number) and `.statusText` (string):

```tsx
`${error.status} ${error.statusText}`   // e.g. "404 Not Found"
```

#### Case B — A regular JavaScript `Error`

```tsx
error instanceof Error
```

True when something threw a real `Error` object (or subclass like `TypeError`, `RangeError`). Example: a component did `throw new Error("Movie failed to load")` or a bug caused `undefined.foo`.

TypeScript narrows `error` to `Error`, so `.message` is safe:

```tsx
error.message   // e.g. "Movie failed to load"
```

#### Case C — Fallback

```tsx
: "unknown error"
```

Anything else (thrown string, plain object, `null`, etc.). Rather than crash trying to read properties, show a safe generic message.

### Rendering

```tsx
return (
    <>
        <h1>Oops!</h1>
        <p>{message}</p>
    </>
);
```

A fragment (`<>...</>`) avoids an extra wrapper `<div>`.

---

## 3. Why this pattern is good

| Concern | How this handles it |
|---|---|
| `useRouteError()` returns `unknown` | Narrowed with a type guard + `instanceof` |
| 404s and thrown `Response`s | Handled explicitly with status + statusText |
| Runtime bugs (`TypeError`, etc.) | Handled via `instanceof Error` |
| Weird throws (`throw "boom"`) | Safe fallback, no crash |
| Type safety | Every branch is properly narrowed — no `as any` |

### Mental model

```
useRouteError() → unknown
       │
       ├── isRouteErrorResponse? → show "STATUS STATUSTEXT"
       ├── instanceof Error?     → show error.message
       └── otherwise             → show "unknown error"
```

---

## 4. When does `ErrorPage` fire?

`ErrorPage` renders only when something is actually **thrown** during routing:

1. A **loader** or **action** throws
2. A **route component throws during render** (a real runtime error)
3. React Router itself throws (rare — usually a config bug)

> **Note:** an unknown URL like `/xyz` does **not** trigger `ErrorPage` in this app, because the `path: "*"` catch-all route matches first and shows `NotFound`. That is the correct separation:
>
> - `ErrorPage` → something crashed
> - `NotFound`  → no such page

---

## 5. How to test it

### Option 1 — Throw from a page component (quickest)

Temporarily edit any page, e.g. `About.tsx`:

```tsx
export default function About() {
  throw new Error("Boom from About!");
  return <h1>About</h1>;
}
```

Navigate to `/about` → expected output:

```
Oops!
Boom from About!
```

Hits **Case B** (`error instanceof Error`).

### Option 2 — Throw a `Response` (simulates a 404/500 from a loader)

Add a loader to a route in `main.tsx`:

```tsx
{
  path: "movies",
  element: <Movies />,
  loader: () => { throw new Response("Not Found", { status: 404, statusText: "Not Found" }); }
},
```

Navigate to `/movies` → expected output:

```
Oops!
404 Not Found
```

Hits **Case A** (`isRouteErrorResponse`).

### Option 3 — Throw a non-Error value (fallback branch)

```tsx
export default function About() {
  throw "just a string";
}
```

Expected output:

```
Oops!
unknown error
```

Hits **Case C** (fallback).

### Option 4 — Real-world trigger (later)

Once data fetching with loaders is added, any thrown error or non-OK `Response` from a loader will automatically render `ErrorPage`. That is the whole point of the pattern.

> **Important:** these throws are just probes. Restore the page components after verifying each branch works.

---

## 6. Verification checklist

| Test | URL to visit | Expected output |
|---|---|---|
| Runtime error | `/about` (with `throw new Error(...)`) | `Oops! Boom from About!` |
| Response throw | `/movies` (with loader throw) | `Oops! 404 Not Found` |
| Non-Error throw | `/about` (with `throw "..."`) | `Oops! unknown error` |
| Unknown URL | `/xyz` | `NotFound` page (**not** `ErrorPage`) |

If all four behave as above, the error handling is wired correctly.

---

## 7. Optional dev-only logging

To help debugging in development, log the raw error inside `ErrorPage`:

```tsx
if (import.meta.env.DEV) console.error(error);
```

Keep the UI clean in production; this only logs during `vite dev`.
