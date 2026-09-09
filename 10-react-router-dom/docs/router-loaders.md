# React Router — Loaders in Detail

Loaders are how a **data router** (`createBrowserRouter`) fetches the data a route needs **before** its `element` renders. They replace the classic pattern of *"mount the component → `useEffect` → `fetch` → set state → show spinner"* with a single async function attached to the route config.

---

## 1. What a loader is

A **loader** is an async (or sync) function attached to a route:

```tsx
{
  path: "movies/:id",
  element: <MovieDetail />,
  loader: movieLoader,
  errorElement: <ErrorPage />,
}
```

The router:

1. Matches the URL to a route.
2. Calls the loader with `{ params, request }`.
3. Waits for the returned promise to settle.
4. Renders `element`; the component reads the data via `useLoaderData()`.

If the loader **throws**, the nearest `errorElement` renders instead.

### Why bother?

| Old way (component-side fetch) | Loader |
|---|---|
| Component mounts, then requests data | Data requested **before** render |
| Requires `useEffect` + `useState` + spinner | Data is already there on first render |
| Race conditions on URL change | Router cancels stale loads for you |
| Error handling scattered | Central `errorElement` catches thrown responses |
| Hard to preload / prefetch | Router can preload on link hover |

---

## 2. Loader signature

```ts
import type { LoaderFunctionArgs } from "react-router";

async function movieLoader({ params, request }: LoaderFunctionArgs) {
  // params.id is the value from the URL segment ":id"
  // request is a standard Request object (has .url, .signal, headers…)
}
```

| Argument | Type | Notes |
|---|---|---|
| `params` | `Record<string, string \| undefined>` | Values for `:` segments in the route path |
| `request` | `Request` | Fetch API `Request`; use `request.signal` to cancel |
| `context` | server-only | Only relevant for framework mode / SSR |

### Return values

- **Any serializable value** — object, array, string, number…
- **A `Response`** — the router unwraps `Response.json()` automatically.
- **A promise** — the router awaits it.
- **A thrown `Response`** — routes to `errorElement`.
- **A thrown `Error`** — routes to `errorElement`; `useRouteError()` returns the `Error` instance.

---

## 3. Consuming loader data — `useLoaderData()`

Inside the route's `element`, call `useLoaderData()` to read whatever the loader returned.

```tsx
import { useLoaderData } from "react-router";
import type { Movie } from "./Movies";

export default function MovieDetail() {
  const movie = useLoaderData() as Movie;
  return <h1>{movie.title}</h1>;
}
```

### Typing the result

Two common patterns:

**a) Cast on read (simple):**
```tsx
const movie = useLoaderData() as Movie;
```

**b) Infer from the loader (stricter):**
```tsx
export async function movieLoader({ params }: LoaderFunctionArgs) {
  // ...
  return movie; // TS infers Movie
}

// in the component
const movie = useLoaderData() as Awaited<ReturnType<typeof movieLoader>>;
```

---

## 4. Throwing to trigger error UI

A loader can **`throw` a `Response`** to switch to the nearest `errorElement`:

```ts
if (!movie) throw new Response("Movie not found", { status: 404 });
```

React Router turns that into an `ErrorResponse` object that `useRouteError()` returns. Consume it in `ErrorPage`:

```tsx
import { isRouteErrorResponse, useRouteError } from "react-router";

export default function ErrorPage() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    // error.status     -> 404
    // error.statusText -> "" unless you set it in the Response init
    // error.data       -> the body you passed ("Movie not found")
    return <h1>{error.status} — {error.data}</h1>;
  }

  if (error instanceof Error) return <h1>{error.message}</h1>;
  return <h1>Unknown error</h1>;
}
```

### Body vs. `statusText`

`new Response(body, init)`:
- `body` → available as **`error.data`**.
- `init.statusText` → available as **`error.statusText`**. **Not** derived from the body.
- `init.status` → available as **`error.status`**.

If you want `error.statusText` populated, set it explicitly:

```ts
throw new Response("Movie not found", {
  status: 404,
  statusText: "Movie not found",
});
```

For JSON responses, prefer the static helper:

```ts
throw Response.json({ code: "MOVIE_NOT_FOUND" }, { status: 404 });
// error.data -> { code: "MOVIE_NOT_FOUND" }
```

---

## 5. Where `errorElement` sits

`errorElement` catches everything **thrown by the route or its descendants** — loader errors, action errors, and render-time crashes in the route's `element`.

| Placement | Effect |
|---|---|
| On the **root** route | Full-page swap — layout chrome (nav, header) disappears too |
| On a **child** route | Only that route's `<Outlet />` slot is replaced; parent layout stays |
| On **both** | Child wins for its own errors; parent acts as a safety net |

Idiomatic setup:

```tsx
{
  path: "/",
  element: <Layout />,
  errorElement: <ErrorPage />,          // fallback for anything not caught below
  children: [
    {
      path: "movies/:id",
      element: <MovieDetail />,
      loader: movieLoader,
      errorElement: <ErrorPage />,      // keeps <nav> visible on a 404
    },
  ],
}
```

---

## 6. Transitions — `useNavigation()`

Because the router waits for the loader, the URL doesn't change until the data is ready. To show progress during that wait, read `useNavigation()` in a component that stays mounted (usually your `Layout`):

```tsx
import { NavLink, Outlet, useNavigation } from "react-router";

export default function Layout() {
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";

  return (
    <>
      <nav>{/* … */}</nav>
      {isLoading && <p role="status" aria-live="polite">Loading…</p>}
      <main style={{ opacity: isLoading ? 0.6 : 1 }}>
        <Outlet />
      </main>
    </>
  );
}
```

`navigation.state` values:

| State | Meaning |
|---|---|
| `"idle"` | No pending navigation |
| `"loading"` | A loader is running for a route transition |
| `"submitting"` | An `action` is running (form POST/PUT/DELETE) |

Extra fields available while non-idle:
- `navigation.location` — the URL being navigated to (useful to only show the spinner for specific routes).
- `navigation.formData`, `navigation.formMethod` — details of a submission.

---

## 7. Reading URL data — `params` and `request`

### Route params

Segments prefixed with `:` become entries on `params`:

```tsx
{ path: "movies/:id", loader: ({ params }) => fetchMovie(params.id!) }
```

`params.id` is typed as `string | undefined` because a route could theoretically be registered without the segment. Assert with `!` or validate it.

### Query strings

Loaders don't receive `searchParams` directly — parse them off `request.url`:

```ts
async function moviesLoader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const category = url.searchParams.get("category");
  return fetchMovies({ category });
}
```

### Cancellation

`request.signal` is aborted when the user navigates away mid-load. Forward it to `fetch`:

```ts
const res = await fetch(apiUrl, { signal: request.signal });
```

---

## 8. Colocating vs. splitting the loader

You can put the loader **next to the component** or in **its own file**.

### Colocated (fine for small apps)

```tsx
// MovieDetail.tsx
export async function movieLoader({ params }: LoaderFunctionArgs) { /* … */ }
export default function MovieDetail() { /* … */ }
```

Register it in the router:

```tsx
import MovieDetail, { movieLoader } from "./pages/MovieDetail";
```

**Gotcha — Fast Refresh:** ESLint rule `react-refresh/only-export-components` warns when a file exports *both* a component and a non-component. Two fixes:

1. Silence the rule at the top of the file:
   ```tsx
   /* eslint-disable react-refresh/only-export-components */
   ```
2. Move the loader into a sibling file (recommended for larger apps):
   ```
   MovieDetail.tsx           <- component only
   MovieDetail.loader.ts     <- loader only
   ```

---

## 9. Router mental model

```
URL change
   │
   ▼
match route  ──►  run loader(s) in parallel (parent → child)
                        │
                        ├── resolves ──► render element(s), useLoaderData() has data
                        └── throws  ───► render nearest errorElement, useRouteError() has it
```

Key properties of this flow:

- **Parent loaders run before children.** Child loaders only start once the parent resolves (they may depend on parent data).
- **Sibling loaders run in parallel.** No waterfall between unrelated routes.
- **Old-route loaders don't run again** unless the URL parameters they depend on change; router uses referential comparison of match keys.
- **Revalidation on actions.** After an `action` completes, all active loaders are re-run so the UI stays in sync.

---

## 10. Full example — this project's shape

```tsx
// MovieDetail.tsx
/* eslint-disable react-refresh/only-export-components */
import { Link, useLoaderData, type LoaderFunctionArgs } from "react-router";
import { movies, type Movie } from "./Movies";

export async function movieLoader({ params }: LoaderFunctionArgs) {
  await new Promise((r) => setTimeout(r, 1000)); // simulate latency
  const movie = movies.find((m) => m.id === params.id);
  if (!movie) throw new Response("Movie not found", { status: 404 });
  return movie;
}

export default function MovieDetail() {
  const movie = useLoaderData() as Movie;
  return (
    <>
      <h1>{movie.title}</h1>
      <p><strong>Year:</strong> {movie.year}</p>
      <p><strong>Director:</strong> {movie.director}</p>
      <Link to="/movies">Back to Movies</Link>
    </>
  );
}
```

```tsx
// App.tsx (router config)
const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <Home /> },
      { path: "movies", element: <Movies /> },
      {
        path: "movies/:id",
        element: <MovieDetail />,
        loader: movieLoader,
        errorElement: <ErrorPage />,
      },
      { path: "*", element: <NotFound /> },
    ],
  },
]);
```

```tsx
// Layout.tsx (loading indicator)
const navigation = useNavigation();
const isLoading = navigation.state === "loading";
```

---

## 11. Common pitfalls

| Symptom | Cause | Fix |
|---|---|---|
| `useLoaderData()` returns `undefined` | Route has no `loader`, or component is rendered outside its route | Attach a `loader`; render component only via the router |
| ErrorPage shows `404 -` with no text | Threw `new Response(body, { status })` and read `error.statusText` | Read `error.data`, or set `statusText` in the init object |
| Spinner never appears | Loader resolves too quickly | Check `navigation.state`; add artificial delay only for demos |
| Fast Refresh full-reloads the file | File exports both a component and a loader | Split the loader, or disable the ESLint rule |
| Loader runs twice in dev | React 19 `StrictMode` intentionally double-invokes | Expected — it doesn't happen in production |
| Data is stale after mutating server state | You mutated without an `action` | Use an `action` (auto-revalidates) or call `useRevalidator()` |

---

## 12. Interview questions

1. What problem do route loaders solve compared with fetching inside `useEffect`?
2. When exactly does a loader run — on every render, only on URL change, or something else?
3. In what order do parent and child loaders execute? Do siblings wait for each other?
4. How do you read loader data inside the route's component? How would you type it strictly?
5. What happens when a loader throws a `Response`? Which hook reads it, and what does `isRouteErrorResponse` do?
6. Explain the difference between the `Response` body, `statusText`, and `status` as seen via `useRouteError()`.
7. Where should `errorElement` live if you want the app's navigation bar to remain visible when a specific route errors?
8. How would you show a "Loading…" indicator only while a route transition is in progress?
9. What are the three possible values of `navigation.state`, and when does each apply?
10. How do loaders get access to query-string parameters? Why isn't there a `searchParams` argument?
11. How do you cancel an in-flight fetch when the user navigates away mid-load?
12. Why does `react-refresh/only-export-components` complain when you colocate a loader with a component, and what are the two ways to resolve it?
