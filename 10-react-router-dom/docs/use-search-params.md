# `useSearchParams` — Guide & Interview Questions

`useSearchParams` is a React Router hook that reads and writes the **query string** portion of the URL (`?key=value&other=thing`). It behaves like `useState`, but the value **lives in the URL** — so filters, sorts, pagination, and search queries survive page reloads, are bookmarkable, and are shareable.

---

## 1. What is `useSearchParams`?

The query string comes after `?` in a URL. `useSearchParams` gives you a tuple to read and update it, without leaving your SPA.

```tsx
import { useSearchParams } from 'react-router';

// URL: /movies?category=action
const [searchParams, setSearchParams] = useSearchParams();
searchParams.get('category');   // "action"
```

- `searchParams` → a **`URLSearchParams`** instance (browser-native class)
- `setSearchParams` → function to update the query string (also updates the URL)

---

## 2. Basic syntax

```tsx
const [searchParams, setSearchParams] = useSearchParams();

const query = searchParams.get('q') ?? '';                // string | null → string
const page  = Number(searchParams.get('page') ?? '1');    // convert to number

setSearchParams({ q: 'batman', page: '2' });              // URL → ?q=batman&page=2
```

Values you pass to `setSearchParams` must be **strings** — the URL doesn't know about numbers or booleans.

---

## 3. The `URLSearchParams` API you'll actually use

`searchParams` is not a plain object — it's a `URLSearchParams` instance. Common methods:

| Method | Returns | Example |
|---|---|---|
| `.get(key)` | `string \| null` | `params.get('q')` → `"batman"` or `null` |
| `.getAll(key)` | `string[]` | For repeated params: `?tag=a&tag=b` → `["a", "b"]` |
| `.has(key)` | `boolean` | `params.has('page')` |
| `.set(key, value)` | `void` | Mutates in place — pair with `setSearchParams(params)` to apply |
| `.delete(key)` | `void` | Mutates in place |
| `.toString()` | `string` | Serializes to `"q=batman&page=2"` |
| `for…of` | iterator | `for (const [k, v] of params) {…}` |

> Important: `.set` and `.delete` **mutate the instance in place**. Nothing changes in the URL until you call `setSearchParams(params)`.

---

## 4. Key rules & gotchas

| Rule | Why it matters |
|---|---|
| Values are **always strings** (or `null`) | `?page=2` gives `"2"`, not `2`. Convert with `Number(...)`. |
| `.get()` returns **`null`** when absent | Not `undefined`. Use `?? default` to handle it. |
| `setSearchParams(object)` **replaces the whole query string** | Any params not in the object are wiped. Use a merge pattern if you want to preserve them. |
| Values must be **strings** when calling `setSearchParams` | `{ page: 2 }` won't type-check — use `{ page: "2" }`. |
| Each change pushes a **history entry** by default | Use `{ replace: true }` for search-as-you-type to avoid polluting Back history. |
| Prefer `??` over `\|\|` | `\|\|` treats `""` and `"0"` as "missing"; `??` only falls back for `null`/`undefined`. |
| The hook triggers re-renders | Just like `useState`, calling `setSearchParams` re-renders the component. |

---

## 5. Common pitfalls

### Pitfall A — Accidentally wiping other params

```tsx
// URL: /movies?category=action&sort=year
setSearchParams({ category: 'drama' });   // ❌ URL becomes /movies?category=drama
```

Fix with the merge pattern:

```tsx
const next = new URLSearchParams(searchParams);
next.set('category', 'drama');
setSearchParams(next);                    // ✅ preserves sort=year
```

### Pitfall B — Confusing `null` and `undefined`

```tsx
const raw = searchParams.get('page');       // string | null
const page = raw ?? '1';                    // ✅ '1' when missing
const bad  = raw || '1';                    // ❌ also '1' when raw === "0"
```

### Pitfall C — Passing numbers/booleans

```tsx
setSearchParams({ page: 2 });               // ❌ TypeScript error, values must be strings
setSearchParams({ page: String(2) });       // ✅
```

### Pitfall D — Reading stale search params in a closure

`searchParams` is a value captured on render — if you read it inside an async callback, it may be stale. Use the **functional updater** form:

```tsx
setSearchParams(prev => {
  const next = new URLSearchParams(prev);
  next.set('page', String(Number(next.get('page') ?? '1') + 1));
  return next;
});
```

### Pitfall E — Filling every keystroke into browser history

For search-as-you-type, add `{ replace: true }` so Back doesn't step through every letter:

```tsx
setSearchParams({ q: value }, { replace: true });
```

---

## 6. Related hooks (quick comparison)

| Hook | Reads | Example URL | Result |
|---|---|---|---|
| `useParams` | path segments | `/movies/42` | `{ id: "42" }` |
| `useSearchParams` | query string | `/movies?category=action` | `URLSearchParams` |
| `useLocation` | full location object | `/movies/42?category=action#reviews` | `{ pathname, search, hash, state, key }` |
| `useNavigate` | (not a reader) | — | Function to change URL programmatically |

Rule of thumb:

- **Path segments** identify *what* the page is (`/movies/42` → movie 42) → `useParams`
- **Query strings** describe *how* to display or filter that page (`?sort=year`) → `useSearchParams`

---

## 7. State vs. URL — when to use `useSearchParams`

| Concern | `useState` | `useSearchParams` |
|---|---|---|
| Survives page reload | ❌ | ✅ |
| Shareable / bookmarkable | ❌ | ✅ |
| Browser back/forward works | ❌ | ✅ |
| SEO-friendly deep links | ❌ | ✅ |
| Sync effort with URL | manual | automatic |
| Good for private/transient UI (modal open?) | ✅ | overkill |

Move to `useSearchParams` whenever a user might want to **bookmark, share, or return to** that view.

---

## 8. Interview questions

### Q1. What does `useSearchParams` return, and how is it different from `useState`?

A tuple `[searchParams, setSearchParams]`, similar in shape to `useState`. The difference: the value lives in the URL's query string, not React memory — so it survives reload, is bookmarkable, and integrates with browser Back/Forward.

### Q2. What is the type of `searchParams`?

A `URLSearchParams` instance (browser-native). You interact with it via `.get`, `.getAll`, `.set`, `.has`, `.delete`, etc.

### Q3. What does `.get(key)` return when the key isn't present?

`null`. Not `undefined`. Guard with `?? defaultValue`.

### Q4. What are the types of query-string values?

Always `string` (or `null`). URLs have no notion of numbers or booleans — you must convert (`Number(...)`, `value === "true"`).

### Q5. Why does `setSearchParams({ category: "drama" })` sometimes wipe unrelated params?

Because passing a plain object **replaces** the entire query string. To preserve other params, build a new `URLSearchParams` from the existing one and mutate it:

```tsx
const next = new URLSearchParams(searchParams);
next.set('category', 'drama');
setSearchParams(next);
```

### Q6. When would you pass `{ replace: true }` to `setSearchParams`?

When you don't want each change to add a Back-history entry. Typical for search-as-you-type, filter dropdowns, and pagination — avoids requiring 20 Back presses to escape a search input.

### Q7. Difference between `useParams` and `useSearchParams`?

- `useParams` reads **path segments** (`:id` in the route pattern) — identifies *which* resource.
- `useSearchParams` reads the **query string** after `?` — describes *how* to filter/sort/paginate.

URL `/movies/42?sort=year`: `useParams()` → `{ id: "42" }`, `useSearchParams()` → `?sort=year`.

### Q8. How do you read a numeric param safely?

```tsx
const raw = searchParams.get('page');
const page = Number.isFinite(Number(raw)) ? Number(raw) : 1;
```

Never trust the URL — someone can type `?page=abc`.

### Q9. How do you handle multiple values for the same key (`?tag=a&tag=b`)?

Use `.getAll('tag')` → `["a", "b"]`. To set multiple values, append repeatedly:

```tsx
const next = new URLSearchParams();
next.append('tag', 'a');
next.append('tag', 'b');
setSearchParams(next);
```

### Q10. Why prefer `?? ''` over `|| ''` when defaulting a search param?

`??` only falls back for `null`/`undefined`. `||` also treats `""` and `"0"` as "missing", which can hide legitimate values (e.g., a search box that was intentionally cleared, or a `page=0` value).

### Q11. Can you call `useSearchParams` outside a route?

No — it requires being inside a `RouterProvider`'s tree. Outside, it will throw or return unusable values depending on the version.

### Q12. Does changing search params re-render the component?

Yes. `useSearchParams` subscribes to URL changes; navigating (via `setSearchParams`, `<Link>`, Back/Forward buttons, or address-bar edits) triggers a re-render.

---

## 9. How `useSearchParams` is used in this project

The `Movies.tsx` page lets the user filter by **category** entirely through the URL — no `useState`. The URL is the source of truth.

> **Scope note:** Only the `category` param is used in the current implementation. Pagination via `?page=N` is intentionally **skipped for now** — the list is small (5 movies) and doesn't need it. Sections that mention `?page=…` in earlier examples are generic `useSearchParams` API demos, not features of this project. Revisit pagination when the list grows or when data is fetched from an API.

### The setup

```tsx
export type Category = 'action' | 'sci-fi' | 'drama';

export const movies: Movie[] = [
    { id: "1", title: "Inception",       year: 2010, director: "Christopher Nolan",              category: "sci-fi" },
    { id: "2", title: "The Matrix",      year: 1999, director: "Lana Wachowski, Lilly Wachowski", category: "action" },
    { id: "3", title: "Interstellar",    year: 2014, director: "Christopher Nolan",              category: "sci-fi" },
    { id: "4", title: "The Dark Knight", year: 2008, director: "Christopher Nolan",              category: "action" },
    { id: "5", title: "The Prestige",    year: 2006, director: "Christopher Nolan",              category: "drama"  },
];

const CATEGORIES: Category[] = ['action', 'sci-fi', 'drama'];
```

### Reading the current filter

```tsx
const [searchParams, setSearchParams] = useSearchParams();
const category = searchParams.get('category');   // string | null

const visible = category
    ? movies.filter(m => m.category === category)
    : movies;
```

- No filter set → `category === null` → show everything.
- Filter set → filter the list.

### Writing the filter

```tsx
function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    if (value === 'all') {
        searchParams.delete('category');    // remove from URL
        setSearchParams(searchParams);      // must call setter to apply mutation
    } else {
        setSearchParams({ category: value });
    }
}
```

- Choosing **All** → remove the `category` param, URL becomes `/movies`.
- Choosing a category → URL becomes `/movies?category=action` (or whatever).

### Keeping the dropdown in sync with the URL

```tsx
<select value={category ?? 'all'} onChange={handleChange}>
    <option value="all">All</option>
    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
</select>
```

- The dropdown's `value` comes from the URL, not local state.
- Pasting `/movies?category=drama` directly → dropdown shows "drama" on load.
- Back/Forward navigation → dropdown updates automatically because the component re-renders when `searchParams` changes.

### End-to-end flow

```
User picks "action"
      │
      ▼
handleChange fires
      │
      ▼
setSearchParams({ category: "action" })
      │
      ▼
URL becomes /movies?category=action
      │
      ▼
Component re-renders
      │
      ▼
category === "action"
visible = movies.filter(m => m.category === "action")
      │
      ▼
Only The Matrix and The Dark Knight render
```

### Why this beats `useState` here

- **Reload** `/movies?category=action` → filter is preserved.
- **Share the URL** → recipient lands on the same filtered view.
- **Back button** → returns to the previous filter, not to the home page.
- **Deep-linkable from anywhere else in the app** (e.g., a `<Link to="/movies?category=drama">Dramas</Link>` on Home).

---

## 10. Suggested improvements (optional)

- **Type-guard the raw string** so `category` is `Category | null`, not just `string | null`:
  ```tsx
  const raw = searchParams.get('category');
  const category: Category | null =
      CATEGORIES.includes(raw as Category) ? (raw as Category) : null;
  ```
- **Use `replace: true`** if you don't want each filter change in Back history:
  ```tsx
  setSearchParams({ category: value }, { replace: true });
  ```
- **Extend to multiple filters** (e.g., add sort) using the merge pattern to avoid wiping siblings:
  ```tsx
  const next = new URLSearchParams(searchParams);
  next.set('category', value);
  setSearchParams(next);
  ```
- **Add a "Clear filters" button** that calls `setSearchParams({})` to reset the whole query string.
- **Deep-link from Home**: `<Link to="/movies?category=sci-fi">Sci-Fi Movies</Link>` — no extra work required, `Movies.tsx` already reads from the URL.
