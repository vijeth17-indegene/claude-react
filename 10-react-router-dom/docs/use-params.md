# `useParams` — Guide & Interview Questions

`useParams` is a React Router hook that reads **dynamic segments** from the current URL. This doc explains what it is, how it works, common gotchas, interview-style questions, and finally how it is used in this project's `MovieDetail` page.

---

## 1. What is `useParams`?

When a route path contains a segment prefixed with `:` (e.g., `movies/:id`), that segment is a **URL parameter**. `useParams` returns an object whose keys are those parameter names and whose values are the strings pulled from the current URL.

```tsx
import { useParams } from 'react-router';

// Route defined as: path: "movies/:id"
// URL visited:      /movies/42

const params = useParams();
// params  →  { id: "42" }
```

---

## 2. Basic syntax

```tsx
const { id } = useParams();
```

With TypeScript, pass a generic to describe the expected keys:

```tsx
const { id } = useParams<{ id: string }>();
```

> The generic types the values as `string | undefined` — never a number — because they come from the URL.

---

## 3. Multiple params

```tsx
// Route: "users/:userId/posts/:postId"
// URL:   /users/7/posts/99

const { userId, postId } = useParams<{ userId: string; postId: string }>();
// userId → "7", postId → "99"
```

---

## 4. Key rules & gotchas

| Rule | Why it matters |
|---|---|
| Values are **always strings** | `/movies/1` gives `id: "1"`, not `1`. Convert with `Number(id)` if needed. |
| Values can be **`undefined`** | TS types them as `string \| undefined`. Guard before using. |
| Names must match the route | `path: "movies/:id"` → key is `id`. Typo = `undefined`. |
| Only available **inside routed components** | The component must be rendered by React Router's tree, otherwise the hook returns `{}`. |
| Re-renders on URL change | Navigating from `/movies/1` to `/movies/2` re-runs the component with the new `id`. |
| Encoded characters are decoded | `/movies/hello%20world` → `id: "hello world"`. |

---

## 5. Common pitfalls

### Pitfall A — Comparing numbers to strings

```tsx
const { id } = useParams<{ id: string }>();
movies.find(m => m.id === 1);          // ❌ '1' !== 1
movies.find(m => m.id === id);         // ✅ both strings
movies.find(m => m.id === Number(id)); // ✅ if your data has numeric ids
```

### Pitfall B — Forgetting the guard

```tsx
const { id } = useParams<{ id: string }>();
return <h1>{id.toUpperCase()}</h1>;    // ❌ id may be undefined
```

Handle it explicitly:

```tsx
if (!id) return <p>Missing id</p>;
```

### Pitfall C — Wrong hook

`useParams` reads path segments. For query strings (`?q=abc`), use `useSearchParams`. For the full location, use `useLocation`.

---

## 6. Related hooks (quick comparison)

| Hook | Reads | Example URL | Result |
|---|---|---|---|
| `useParams` | path segments | `/movies/42` | `{ id: "42" }` |
| `useSearchParams` | query string | `/movies?year=2010` | `URLSearchParams` |
| `useLocation` | full location object | `/movies/42?year=2010` | `{ pathname, search, hash, ... }` |
| `useNavigate` | (not a reader) | — | Function to change URL |

---

## 7. Interview questions

### Q1. What does `useParams` return, and what is the type of its values?

An object of key/value pairs pulled from the matched route's dynamic segments. **All values are strings** (or `undefined`), regardless of what the URL looks like.

### Q2. If a URL is `/products/42`, and the route is `products/:id`, what does `useParams()` return?

```ts
{ id: "42" }   // string, not number
```

### Q3. How do you type `useParams` in TypeScript, and what is the practical limitation?

```ts
useParams<{ id: string }>()
```

The generic only helps naming — values are still `string | undefined`. You must runtime-check for `undefined`.

### Q4. Difference between `useParams` and `useSearchParams`?

- `useParams` → **path** segments defined with `:name` in the route
- `useSearchParams` → **query string** after `?`
- URL `/movies/42?year=2010` → `useParams` gives `id`, `useSearchParams` gives `year`.

### Q5. What happens if you access `useParams` in a component that isn't rendered by a router?

It returns an empty object `{}` (no throw). Any destructured key will be `undefined`, which usually surfaces as a bug downstream.

### Q6. If the route is `users/:userId/posts/:postId`, how do you get both params?

```ts
const { userId, postId } = useParams<{ userId: string; postId: string }>();
```

### Q7. Why is `movies.find(m => m.id === id)` fine, but `m.id === 1` is not?

Because `useParams` returns strings. If your data uses numeric ids, convert one side: `m.id === Number(id)` or store ids as strings.

### Q8. What happens when the URL parameter changes while the component is mounted?

React Router re-renders the component with the new `params`. No manual subscription is needed — you can treat `params` like state that updates on navigation.

### Q9. How would you handle an unknown id (e.g., `/movies/999` when there is no such movie)?

Two idiomatic options:

1. Inline fallback UI (used in this project):
   ```tsx
   if (!movie) return <NotFoundInline />;
   ```
2. Throw a `Response` so React Router's `errorElement` handles it:
   ```tsx
   if (!movie) throw new Response("Not Found", { status: 404 });
   ```

### Q10. Can `useParams` values be non-string primitives if you cast them?

No — they are always strings at runtime. Casting is a TypeScript-only illusion; you must `Number(...)`, `parseInt(...)`, etc., to convert.

---

## 8. How `useParams` is used in this project

The project defines a dynamic route in `src/main.tsx`:

```tsx
{ path: "movies/:id", element: <MovieDetail /> }
```

### The list page — `src/pages/Movies.tsx`

`Movies.tsx` owns the data (`movies` array) and renders a `<Link>` per movie whose URL includes the `id`:

```tsx
export const movies: Movie[] = [
    { id: "1", title: "Inception",    year: 2010, director: "Christopher Nolan" },
    { id: "2", title: "The Matrix",   year: 1999, director: "Lana Wachowski, Lilly Wachowski" },
    { id: "3", title: "Interstellar", year: 2014, director: "Christopher Nolan" },
];

// inside the component
<Link to={`/movies/${m.id}`}>{m.title}</Link>
```

Clicking a link changes the URL to `/movies/1`, `/movies/2`, etc. React Router matches `movies/:id` and mounts `MovieDetail`.

### The detail page — `src/pages/MovieDetail.tsx`

```tsx
import { Link, useParams } from "react-router";
import { movies } from "./Movies";

export default function MovieDetail() {
    const { id } = useParams<{ id: string }>();
    const movie = movies.find(m => m.id === id);

    if (!movie) {
        return (
            <>
                <h1>No Movie Selected</h1>
                <Link to="/movies">Back to Movies</Link>
            </>
        );
    }

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

Step-by-step:

1. **`useParams<{ id: string }>()`** — reads the dynamic `id` segment from the URL. For `/movies/2`, `id === "2"`.
2. **`movies.find(m => m.id === id)`** — both sides are strings, so the comparison is safe. Returns the matching movie or `undefined`.
3. **`if (!movie)` guard** — covers two situations:
   - `id` is `undefined` (shouldn't happen with a valid route match, but TS still requires it).
   - `id` doesn't match any entry (e.g., user typed `/movies/999`).
   In both cases, show a friendly fallback with a back link instead of crashing.
4. **Happy path** — render the movie's title, year, and director, plus a back link.

### End-to-end flow

```
/movies  ──click "Inception"──►  /movies/1
                                      │
                                      ▼
                        MovieDetail mounts
                                      │
                        useParams() → { id: "1" }
                                      │
                        movies.find(m => m.id === "1")
                                      │
                        renders <h1>Inception</h1> …
```

If the user navigates directly to `/movies/xyz`:

```
useParams() → { id: "xyz" }
movies.find(...) → undefined
guard triggers → "No Movie Selected" + Back link
```

---

## 9. Suggested improvements (optional)

- **Split data out of `Movies.tsx`** into `src/data/movies.ts` so both pages import from a neutral location (avoids the `eslint-disable react-refresh/only-export-components` comment).
- **Use a `NotFound`-style route response** for unknown ids by throwing a `Response`, unifying error handling with `ErrorPage`.
- **Prefetch or lazy-load** the detail page as the app grows.
