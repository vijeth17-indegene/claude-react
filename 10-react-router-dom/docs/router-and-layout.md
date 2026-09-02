# React Router — `createBrowserRouter`, `RouterProvider`, `Layout`, `Outlet`, `Link` & `NavLink`

A single reference doc covering how the router is wired in this project, how the shared `Layout` uses `<Outlet />`, and how `<Link>` vs `<NavLink>` navigate between pages. Each section ends with interview questions.

---

## 1. `createBrowserRouter`

### What it is

A factory that builds a **data router** using the browser's HTML5 History API (`pushState` / `popState`). It takes a **route configuration** (an array of route objects) and returns a `router` instance you hand to `<RouterProvider>`.

### Basic shape

```tsx
import { createBrowserRouter } from 'react-router';

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    errorElement: <ErrorPage />,
    children: [ /* nested routes */ ]
  }
]);
```

### Common route properties

| Property | Purpose |
|---|---|
| `path` | URL pattern (`"/"`, `"movies"`, `"movies/:id"`, `"*"`) |
| `element` | React element rendered when the route matches |
| `index: true` | Marks a **default child** — renders at the parent's exact path |
| `children` | Nested routes rendered inside a parent's `<Outlet />` |
| `errorElement` | Rendered if this route (or a child) throws |
| `loader` | Async function to fetch data before render (data-router feature) |
| `action` | Handles form submissions (data-router feature) |

### Why "browser" router?

React Router ships several router creators:

| Router | Use case |
|---|---|
| `createBrowserRouter` | Standard web apps served over HTTP (clean URLs) |
| `createHashRouter` | Static hosts where you can't configure server rewrites (`/#/movies`) |
| `createMemoryRouter` | Tests, React Native, non-URL environments |

### Interview questions

**Q1. What does `createBrowserRouter` do?**
Creates a data-aware router instance from a route config, using the browser's History API. It enables SPA navigation, nested routes, `errorElement`, and (optionally) loaders/actions.

**Q2. Difference between `createBrowserRouter` and `createHashRouter`?**
`createBrowserRouter` produces clean URLs (`/movies/1`) and requires the server to rewrite unknown paths to `index.html`. `createHashRouter` uses the URL hash (`/#/movies/1`), so no server config is needed but URLs look uglier.

**Q3. What is the difference between `path: "movies"` and `index: true`?**
`path: "movies"` matches `/movies`. `index: true` marks a **default child** that renders at the parent's exact path (here, `/`), without any additional segment.

**Q4. What does the `*` path match?**
A catch-all — any URL not matched by a sibling route. Commonly used for a `NotFound` page.

**Q5. Do you have to use `createBrowserRouter` in v6+?**
No — the legacy JSX `<BrowserRouter>` + `<Routes>` still works. `createBrowserRouter` unlocks **data APIs** (`loader`, `action`, `errorElement`, deferred data). Prefer it for new apps.

---

## 2. `RouterProvider`

### What it is

The React component that connects the router instance to the React tree. It subscribes components to route state and renders the matched route's element.

### Usage

```tsx
import { RouterProvider } from 'react-router';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
```

Notice there's **no `<Routes>` / `<Route>` JSX** anywhere. The route tree is fully described in the config passed to `createBrowserRouter`, and `RouterProvider` renders whatever matches.

### Rules

- Exactly **one** `RouterProvider` at the root.
- Do not put other routing components (`<BrowserRouter>`) around it — that's the old API.
- Everything below it can call routing hooks (`useParams`, `useNavigate`, `useLocation`, `useRouteError`, etc.).

### Interview questions

**Q1. What is the role of `RouterProvider`?**
It's the React component that hosts the router instance and renders the matched routes. It also provides the context that routing hooks read from.

**Q2. Can you nest multiple `RouterProvider`s?**
Not in the same app — you'd get context collisions and duplicated URL subscriptions. One app, one router.

**Q3. Why doesn't this project use `<BrowserRouter>` / `<Routes>` / `<Route>`?**
Because it uses the **data router API** (`createBrowserRouter` + `RouterProvider`), which is the modern approach and required for `loader`, `action`, and `errorElement`.

---

## 3. How the `Layout` is built

### The pattern

A **layout route** is a route that renders shared chrome (nav bar, header, footer, sidebar) and delegates the page-specific area to `<Outlet />`. Its child routes render *inside* that outlet.

### This project's layout — `src/Layout.tsx`

```tsx
import { NavLink, Outlet } from 'react-router';

export default function Layout() {
    return (
        <>
            <nav>
                <NavLink to="/" end>Home</NavLink> |
                <NavLink to="/movies">Movies</NavLink> |
                <NavLink to="/about">About</NavLink> |
                <NavLink to="/contact">Contact</NavLink>
            </nav>
            <main>
                <Outlet />
            </main>
        </>
    );
}
```

### How it's wired

In `main.tsx`, `Layout` is the `element` of the root route, and every page is a **child** of that root:

```tsx
{
  path: "/",
  element: <Layout />,          // shared shell
  errorElement: <ErrorPage />,
  children: [
    { index: true,        element: <Home /> },        // renders at "/"
    { path: "movies",     element: <Movies /> },      // renders at "/movies"
    { path: "movies/:id", element: <MovieDetail /> }, // renders at "/movies/:id"
    { path: "about",      element: <About /> },
    { path: "contact",    element: <Contact /> },
    { path: "*",          element: <NotFound /> }
  ]
}
```

### Rendered tree at `/movies`

```
<Layout>
  <nav> …NavLinks… </nav>
  <main>
    <Outlet />   ⇒  <Movies />
  </main>
</Layout>
```

### Why do it this way?

- **DRY**: nav bar written once, appears on every page.
- **Preserved state**: `Layout` doesn't unmount between page changes, so anything it holds (state, subscriptions) survives navigation.
- **Composable**: you can add nested layouts (e.g., a `MoviesLayout` with its own outlet for `Movies` vs `MovieDetail`).

### Interview questions

**Q1. What is a layout route?**
A parent route whose `element` renders shared UI and includes `<Outlet />` where child route elements are rendered.

**Q2. Where does the child page appear inside `Layout`?**
Wherever `<Outlet />` is placed. In this project, inside `<main>`.

**Q3. Does `Layout` re-mount on navigation?**
No — as long as you're navigating between sibling routes under the same layout, `Layout` stays mounted and only the outlet contents swap.

**Q4. How would you add a second layout, e.g., for auth pages without the nav bar?**
Add another top-level route with its own layout element, e.g.:

```tsx
[
  { path: "/", element: <Layout />, children: [...] },
  { path: "/auth", element: <AuthLayout />, children: [...] }
]
```

---

## 4. `<Outlet />`

### What it is

A placeholder component that renders the **matched child route's element** inside its parent's layout. Think of it as `{children}` for routing.

### Rules

- Only meaningful inside a **layout route** (a route with `children`).
- One `<Outlet />` per layout (usually). You *can* have multiple named outlets, but that's an advanced use case.
- If no child matches (and the parent has no `index` route), the outlet renders nothing.

### Passing data down: `useOutletContext`

You can pass data from layout → child without prop drilling:

```tsx
// Layout
<Outlet context={{ user }} />

// Child page
const { user } = useOutletContext<{ user: User }>();
```

### Interview questions

**Q1. What is `<Outlet />` used for?**
It marks the spot inside a parent (layout) route where the matched child route element should be rendered.

**Q2. What happens if a layout route has no `<Outlet />`?**
Child routes still match, but nothing they render appears — they're mounted "into thin air." Almost always a bug.

**Q3. How would you share state (e.g., the current user) from a layout to nested pages without prop-drilling?**
Use `<Outlet context={value} />` in the layout and `useOutletContext()` in the child.

**Q4. Can a route have both an `element` and children?**
Yes — that's exactly the layout pattern. The `element` is the layout wrapper; `children` are what appears in its `<Outlet />`.

---

## 5. `<Link>`

### What it is

A drop-in replacement for `<a href>` that performs **client-side navigation** — no full page reload, no server round-trip. The URL updates, React Router matches the new route, and only the changed parts re-render.

### Basic usage

```tsx
import { Link } from 'react-router';

<Link to="/movies">All Movies</Link>
<Link to={`/movies/${movie.id}`}>{movie.title}</Link>
```

### Absolute vs relative paths

```tsx
<Link to="/movies/1" />   // absolute — always /movies/1
<Link to="1" />           // relative — appended to current URL
```

### Common props

| Prop | Effect |
|---|---|
| `to` | Destination — string or path object |
| `replace` | Replaces history entry instead of pushing (back button skips it) |
| `state` | Attach state accessible via `useLocation().state` |
| `reloadDocument` | Force full page reload (rarely needed) |
| `preventScrollReset` | Keep current scroll position after navigation |

### Why not just `<a href>`?

A plain `<a href="/movies">` triggers a full page reload — you lose React state, refetch everything, and see a flash. `<Link>` uses `history.pushState` under the hood to update the URL without leaving the SPA.

### Interview questions

**Q1. Difference between `<Link>` and `<a>`?**
`<Link>` performs client-side navigation via the History API — no reload, React state preserved. `<a>` causes a full document load unless you intercept it manually.

**Q2. When would you use `<Link replace>`?**
When you don't want the current page in the back-history stack — e.g., after login, redirecting from a splash page, or replacing a modal state.

**Q3. Absolute vs relative `to`?**
Absolute (`to="/movies/1"`) is anchored to the app root. Relative (`to="1"` from `/movies`) resolves against the current URL to `/movies/1`.

**Q4. How do you pass data to the next page without putting it in the URL?**
`<Link to="/movies" state={{ from: "home" }} />`, then `useLocation().state` on the destination.

---

## 6. `<NavLink>`

### What it is

A specialized `<Link>` that is **aware of whether it's active** — i.e., whether its `to` matches the current URL. It automatically applies an `active` class you can style.

### Automatic active class

```tsx
<NavLink to="/movies">Movies</NavLink>
```

When the URL is `/movies`, the rendered anchor gets `class="active"`. Style it globally:

```css
nav a.active { color: crimson; font-weight: 600; }
```

### Function form (for custom classes, CSS Modules, Tailwind)

```tsx
<NavLink
  to="/movies"
  className={({ isActive }) => isActive ? 'link link--active' : 'link'}
>
  Movies
</NavLink>
```

Also works with `style`:

```tsx
<NavLink
  to="/movies"
  style={({ isActive }) => ({ color: isActive ? 'crimson' : 'inherit' })}
>
  Movies
</NavLink>
```

### The `end` prop — a critical gotcha

Without `end`, matching is by **prefix**. Because every path starts with `/`, a `<NavLink to="/">` would stay active on `/movies`, `/about`, `/contact`.

```tsx
<NavLink to="/" end>Home</NavLink>   // active ONLY on "/"
<NavLink to="/movies">Movies</NavLink> // active on "/movies" AND "/movies/:id"
```

The comment in `src/Layout.tsx` documents this exact gotcha — that's why `end` is applied to the Home link.

### Other props

| Prop | Effect |
|---|---|
| `end` | Match exactly, not by prefix |
| `caseSensitive` | Case-sensitive URL matching |
| `aria-current` | Automatically set to `"page"` when active (accessibility) |

### `<Link>` vs `<NavLink>` — when to use which

| Use `<Link>` when | Use `<NavLink>` when |
|---|---|
| Navigating in body content, cards, buttons | Building navigation menus / tabs |
| You don't need active styling | You want the active item highlighted |
| Inside lists (list item → detail) | Persistent nav bars, sidebars, breadcrumbs |

### Interview questions

**Q1. What does `<NavLink>` do that `<Link>` doesn't?**
It knows whether it points to the current route. It adds an `active` class (and `aria-current="page"`) automatically, and exposes `isActive` to `className`/`style` render-prop functions.

**Q2. Why does the Home link need `end` but Movies doesn't?**
Default matching is **prefix-based**. `/` is a prefix of every URL, so without `end` the Home link would always look active. `end` forces exact matching. Movies is fine because `/movies` is only a prefix of `/movies/*`, which we usually *want* to highlight the "Movies" tab for.

**Q3. How do you use `<NavLink>` with CSS Modules or Tailwind?**
Use the function form of `className`:
```tsx
<NavLink className={({ isActive }) => isActive ? styles.active : styles.link} />
```

**Q4. Is `<NavLink>` an accessibility win?**
Yes — it sets `aria-current="page"` on the active link automatically, so screen readers announce it.

**Q5. Can `<NavLink>` do partial matching for section highlighting?**
Yes — that's the default. `<NavLink to="/movies">` stays active on `/movies/1`, which is usually what you want for a top-level "Movies" tab.

---

## 7. Putting it all together — the request/render flow

For URL `/movies/2`:

```
User clicks <Link to="/movies/2">The Matrix</Link>
                       │
                       ▼
       history.pushState → URL becomes /movies/2
                       │
                       ▼
       RouterProvider re-matches routes against the config
                       │
                       ▼
       Match tree:  "/"  →  "movies/:id"
                       │
                       ▼
                 <Layout>
                   <nav> …NavLinks with active updated… </nav>
                   <main>
                     <Outlet />  ⇒  <MovieDetail />
                   </main>
                 </Layout>
                       │
                       ▼
       <MovieDetail> calls useParams() → { id: "2" } → renders movie
```

- `createBrowserRouter` defined the tree.
- `RouterProvider` handled matching and rendering.
- `Layout` provided shared chrome.
- `<Outlet />` hosted the page.
- `<NavLink>` reflected the active section.
- `<Link>` triggered the navigation without a reload.

---

## 8. Suggested exercises

1. Add a `<Link>` from `Home.tsx` to `/movies/1` and confirm no full reload happens (open DevTools → Network → JS/Fetch only).
2. Add a second layout (`/admin`) with its own nav bar and a couple of child routes.
3. Replace one `<NavLink>` with `<Link>` and observe the loss of active styling.
4. Use `useOutletContext` to pass a `theme` object from `Layout` to `Home`.
5. Remove `end` from the Home `<NavLink>` and confirm it stays active on `/movies` — then add it back.
