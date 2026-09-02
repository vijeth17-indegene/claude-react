# React Context — Interview Notes

Deep, practical, and interview-oriented notes on React Context: what it is, when to use it, TS + non-TS examples, legacy vs modern React, pitfalls, and Q&A.

---

## 1. What is Context?

Context is React's built-in mechanism for passing values down the component tree **without prop drilling**. Any descendant of a `Provider` can read the value via `useContext` (or the new `use()` hook in React 19).

Think of it as **dependency injection scoped to a subtree**.

```
<Provider value={X}>
  └─ <Any depth of components>
       └─ read X with useContext
```

### When to use it

Good fits:
- **Theme** (light/dark)
- **Current user / auth session**
- **Locale / i18n**
- **Router state** (React Router uses context internally)
- **Design-system primitives** (e.g., `Tabs`, `Accordion`, `Form` compound components)

Bad fits:
- **High-frequency updating values** (mouse position, animation frames, counters ticking every second) — causes every consumer to re-render.
- **Server data** — use React Query / SWR / RTK Query instead.
- **Complex global state with many independent slices** — use Zustand / Redux / Jotai.
- **Values needed only by one subtree of 2–3 components** — just prop-drill.

### Rule of thumb

> Use Context for values that are **truly global** to a subtree and change **infrequently**.

---

## 2. The problem Context solves — prop drilling

```jsx
// Without context: theme is drilled through every level
<App theme="dark">
  <Layout theme="dark">
    <Sidebar theme="dark">
      <UserMenu theme="dark">
        <Avatar theme="dark" />
```

`Layout`, `Sidebar`, `UserMenu` don't use `theme` — they just forward it. Context removes the forwarding.

---

## 3. Modern Context — Step by Step (JavaScript, no TS)

### Step 1 — Create the context

```jsx
// ThemeContext.js
import { createContext } from "react";

export const ThemeContext = createContext(null);
```

### Step 2 — Provide a value at the top

```jsx
// App.js
import { useState } from "react";
import { ThemeContext } from "./ThemeContext";
import Page from "./Page";

export default function App() {
  const [theme, setTheme] = useState("light");
  const toggle = () => setTheme(t => (t === "light" ? "dark" : "light"));

  return (
    <ThemeContext value={{ theme, toggle }}>
      <Page />
    </ThemeContext>
  );
}
```

> **React 19 note:** `<ThemeContext value={...}>` works directly. In older React you had to write `<ThemeContext.Provider value={...}>`.

### Step 3 — Consume anywhere below

```jsx
// ThemedButton.js
import { useContext } from "react";
import { ThemeContext } from "./ThemeContext";

export default function ThemedButton() {
  const { theme, toggle } = useContext(ThemeContext);
  return <button onClick={toggle}>Current: {theme}</button>;
}
```

That's it. No prop drilling, no `theme` in `Page` or any intermediate component.

---

## 4. Same example with TypeScript

```tsx
// ThemeContext.tsx
import { createContext, useContext, useState } from "react";

type Theme = "light" | "dark";

type ThemeContextValue = {
  theme: Theme;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const toggle = () => setTheme(t => (t === "light" ? "dark" : "light"));

  return (
    <ThemeContext value={{ theme, toggle }}>
      {children}
    </ThemeContext>
  );
}

// Guarded consumer hook — throws if used outside provider
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}
```

### TS concepts in play

| Concept | Where | Why |
|---|---|---|
| **Union literal type** `"light" \| "dark"` | `type Theme` | Prevents typos like `"drak"`; enables exhaustive switches. |
| **Generic type argument** `createContext<T>` | `createContext<ThemeContextValue \| null>(null)` | Tells TS what shape consumers will get. |
| **Nullable default** `\| null` | Context default | Real value only exists inside the Provider. Guard forces callers to be inside it. |
| **`React.ReactNode`** | `children` prop | Widest type covering strings, elements, arrays, portals, `null`, etc. |
| **Custom hook return type** | `useTheme(): ThemeContextValue` | After the `if (!ctx) throw`, TS narrows away `null` — consumers get a fully-typed non-null value. |

### Why the null-guard pattern is idiomatic

If you seed the context with a fake default like `createContext({ theme: "light", toggle: () => {} })`, TS is happy but you lose the safety net: forgetting to wrap in `<ThemeProvider>` silently uses the fake defaults. The `null` + guard pattern converts a subtle bug into a loud error at runtime.

---

## 5. Legacy Context — how it used to look

### 5a. Very old (React <16.3): `contextTypes` (class components)

```jsx
// Provider - class using childContextTypes
class App extends React.Component {
  getChildContext() {
    return { theme: "dark" };
  }
  render() {
    return <Toolbar />;
  }
}
App.childContextTypes = {
  theme: PropTypes.string,
};

// Consumer
class ThemedButton extends React.Component {
  render() {
    return <button>{this.context.theme}</button>;
  }
}
ThemedButton.contextTypes = {
  theme: PropTypes.string,
};
```

**Problems:** string-typed, `PropTypes`-based, undocumented and unsafe, no updates propagation guarantees, considered experimental for years.

### 5b. React 16.3 – 18: `Provider` / `Consumer` render-prop API

```jsx
const ThemeContext = React.createContext("light");

// Provide
<ThemeContext.Provider value="dark">
  <Toolbar />
</ThemeContext.Provider>

// Consume — render prop
<ThemeContext.Consumer>
  {theme => <button>{theme}</button>}
</ThemeContext.Consumer>

// Class components — static contextType
class ThemedButton extends React.Component {
  static contextType = ThemeContext;
  render() { return <button>{this.context}</button>; }
}
```

Works, but the `<Consumer>` render-prop form causes **nesting hell** when a component reads several contexts:

```jsx
<ThemeContext.Consumer>
  {theme => (
    <UserContext.Consumer>
      {user => (
        <LocaleContext.Consumer>
          {locale => <UI theme={theme} user={user} locale={locale} />}
        </LocaleContext.Consumer>
      )}
    </UserContext.Consumer>
  )}
</ThemeContext.Consumer>
```

### 5c. React 16.8+: `useContext` hook (game changer)

```jsx
const theme  = useContext(ThemeContext);
const user   = useContext(UserContext);
const locale = useContext(LocaleContext);
```

Flat, readable, composable. This is what "modern context" usually means today.

### 5d. React 19: `<Context>` as JSX + `use(Context)`

```jsx
// Providers — no more .Provider
<ThemeContext value={themeValue}>
  <App />
</ThemeContext>

// Consumers — use() can be called conditionally, unlike useContext
import { use } from "react";
const theme = use(ThemeContext);
```

`use()` accepts contexts **and** promises, and (unlike hooks) can be called inside `if` / `for` blocks. Prefer it for new code in React 19+.

### Legacy → Modern comparison

| Aspect | Legacy (`<Consumer>`) | Modern (`useContext` / `use`) |
|---|---|---|
| Reading | Render-prop callback | Straight variable |
| Multiple contexts | Nested JSX pyramid | Flat sequential calls |
| Class support | `static contextType` (1 only) | N/A (hooks are for function components) |
| Conditional read | Awkward | `use()` allows conditional read |
| Readability | Poor at scale | Excellent |

---

## 6. Common Mistakes (interviewer favorites)

### Mistake 1 — New object every render → mass re-renders

```tsx
// ❌ New reference each render; every consumer re-renders
<AuthContext value={{ user, login, logout }}>
```

Fix with `useMemo` **when the value's own inputs are stable**:

```tsx
const value = useMemo(() => ({ user, login, logout }), [user, login, logout]);
<AuthContext value={value}>
```

Also memoize the callbacks:

```tsx
const login  = useCallback(async (creds) => {...}, []);
const logout = useCallback(() => {...}, []);
```

### Mistake 2 — Putting high-frequency values in context

A ticking counter or mouse-position context re-renders **every** consumer of that context on every tick, even those reading unrelated fields. `useMemo` won't save you because the ticking value itself is in the deps. **Solution: split contexts by update cadence.**

### Mistake 3 — Reading context outside a Provider

Returns the default value silently → confusing bugs. Fix with the null-guard hook pattern shown in §4.

### Mistake 4 — Using context for server data

Refetch, cache invalidation, retries, stale data — Context doesn't solve any of this. Use React Query / SWR.

### Mistake 5 — Assuming `useContext` supports selectors

It doesn't. A consumer re-renders whenever the whole context value changes reference — you can't subscribe to just one field. If you need selectors, use `use-context-selector`, Zustand, or Redux.

### Mistake 6 — One giant AppContext

Bundling theme + auth + cart + settings into one provider means changing any of them re-renders all consumers of all of them. Split by concern **and** cadence.

### Mistake 7 — Forgetting to memoize the Provider itself

If the Provider component re-renders for parent reasons and the `value` is a fresh object, all consumers re-render. `useMemo` on the value guards against this.

---

## 7. Real-world Use Cases

1. **Auth** — `AuthContext` exposes `user`, `login`, `logout`, `isAuthenticated`.
2. **Theme** — `ThemeContext` writes `data-theme` on `<html>` (see the `useEffect` pattern below).
3. **i18n** — `LocaleContext` exposes `t(key)` and current locale.
4. **Feature flags** — read once at app start, rarely change.
5. **Router** — React Router's `<BrowserRouter>` is a stack of Providers.
6. **Compound components** — `Tabs.List`, `Tabs.Tab`, `Tabs.Panel` share `activeTab` via a small internal `TabsContext`. This is context used **within** a component, not app-wide.
7. **Form libraries** — Formik / React Hook Form expose form state via context to nested fields.

### Compound-component pattern (very common in senior interviews)

```tsx
type TabsCtx = { active: string; setActive: (id: string) => void };
const TabsContext = createContext<TabsCtx | null>(null);
const useTabs = () => {
  const c = useContext(TabsContext);
  if (!c) throw new Error("Tabs.* must be used inside <Tabs>");
  return c;
};

export function Tabs({ defaultTab, children }: { defaultTab: string; children: React.ReactNode }) {
  const [active, setActive] = useState(defaultTab);
  const value = useMemo(() => ({ active, setActive }), [active]);
  return <TabsContext value={value}>{children}</TabsContext>;
}

Tabs.Tab = function Tab({ id, children }: { id: string; children: React.ReactNode }) {
  const { active, setActive } = useTabs();
  return (
    <button aria-selected={active === id} onClick={() => setActive(id)}>
      {children}
    </button>
  );
};

Tabs.Panel = function Panel({ id, children }: { id: string; children: React.ReactNode }) {
  const { active } = useTabs();
  return active === id ? <div>{children}</div> : null;
};
```

Consumers write natural JSX — no prop drilling of `active`/`setActive`.

---

## 8. Theme Context with `useEffect` — a full modern example

Legit use of Context because theme is global, changes rarely, and needs a DOM side effect.

```tsx
import { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";

type Theme = "light" | "dark";
type Value = { theme: Theme; toggleTheme: () => void };

const ThemeContext = createContext<Value | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const toggleTheme = useCallback(
    () => setTheme(t => (t === "light" ? "dark" : "light")),
    []
  );

  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);
  return <ThemeContext value={value}>{children}</ThemeContext>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
```

CSS:

```css
:root            { --bg: #fff; --fg: #111; }
[data-theme="dark"] { --bg: #111; --fg: #eee; }
body { background: var(--bg); color: var(--fg); }
```

---

## 9. Splitting contexts to avoid re-renders

If you find yourself putting fast-changing and slow-changing state in one context, **split**:

```tsx
// ❌ One giant context — theme consumers re-render every second
<AppContext value={{ theme, toggleTheme, count }}>

// ✅ Two focused contexts
<ThemeContext value={themeValue}>
  <CounterContext value={count}>
    <App />
  </CounterContext>
</ThemeContext>
```

Advanced pattern: **state + dispatch split** (used by Redux Toolkit alternatives):

```tsx
const StateContext    = createContext<State | null>(null);
const DispatchContext = createContext<Dispatch | null>(null);
```

Components that only need `dispatch` never re-render on state changes — because `dispatch` reference is stable across renders.

---

## 10. Performance mental model

1. A consumer subscribes to the **entire value** of the context via `Object.is` reference check.
2. When the Provider's `value` prop is a **new reference**, every consumer re-renders (regardless of `React.memo`).
3. `React.memo` does **not** protect against context updates — it only skips renders triggered by parent prop changes.
4. To reduce re-renders: **stable references** (`useMemo` on value, `useCallback` on functions) + **split by cadence/concern**.

---

## 11. Interview Questions & Answers

### Q1. What is React Context and when should you use it?
Context passes data to nested components without prop drilling. Use it for values that are truly global to a subtree and change infrequently — theme, auth, locale, router. Don't use it for high-frequency updates or server data.

### Q2. How is Context different from Redux/Zustand?
Context is a **transport mechanism** — it doesn't manage state, batch updates, provide selectors, dev tools, or middleware. State libraries add slice-level subscriptions, so components only re-render when the specific field they read changes. Context re-renders **every** consumer on any value change.

### Q3. Does `useContext` cause re-renders?
Yes. Whenever the Provider's `value` prop changes by reference (`Object.is`), every consumer re-renders. `React.memo` around consumers cannot stop this.

### Q4. How do you prevent unnecessary Context re-renders?
- Wrap the value in `useMemo`.
- Wrap callbacks in `useCallback`.
- **Split contexts** by update cadence (fast-changing vs slow-changing) or by concern.
- Split into state/dispatch contexts.
- For selector-style subscriptions, use `use-context-selector` or a state library.

### Q5. Why is `<MyContext.Provider>` no longer required in React 19?
React 19 lets you use the context object itself as a JSX component: `<MyContext value={...}>`. It's shorter and matches the new `use(MyContext)` reader API. Old `.Provider` still works for backward compatibility.

### Q6. What is the difference between `useContext` and `use`?
Both read a context. `useContext` is a hook and follows the rules of hooks (top-level only). `use()` (React 19) can be called **conditionally** — inside `if`, `for`, early return — and also unwraps promises. Prefer `use()` in new React 19 code when you need conditional reads.

### Q7. What's a common bug with default context values?
Passing a "fake" default like `createContext({ user: null, login: () => {} })` hides missing-Provider bugs — the app runs with the fake login. Use `createContext<T | null>(null)` and a guarded custom hook that throws if not inside a Provider.

### Q8. Can Context replace Redux?
For small apps or narrow slices (auth, theme) — yes. For large apps with complex state, cross-cutting concerns, time-travel debugging, middleware, or selector-based performance — no. Redux/Zustand are still better.

### Q9. Why not put everything into one AppContext?
Any state change re-renders every consumer of the whole thing. Splitting keeps re-renders scoped to actual subscribers.

### Q10. How would you share state between two sibling components?
Lift state to the closest common parent. If the parent is far up, consider a small Context around that subtree. Don't reach for global state unless the data is truly cross-cutting.

### Q11. What is the compound component pattern and how does Context enable it?
A parent component (`<Tabs>`) exposes children (`<Tabs.List>`, `<Tabs.Tab>`, `<Tabs.Panel>`) that read shared state from an internal Context. Consumers write natural JSX; the parent hides state plumbing. See §7.

### Q12. Is Context server-safe (SSR / RSC)?
Yes for SSR — Providers render on the server just like anywhere else. In React Server Components, contexts created for client components only work within the **Client** boundary; RSCs don't consume client contexts and vice versa. For RSC-side "context", pass data via props or use React 19 server-side context APIs.

### Q13. How do you type `createContext` in TypeScript?
```ts
const Ctx = createContext<Value | null>(null);
```
Then wrap `useContext` in a custom hook that narrows away `null` with a runtime throw. This gives consumers a non-null typed value and catches missing-Provider bugs.

### Q14. What happens if you nest two Providers of the same context?
The **nearest** Provider wins for descendants below it. This is useful for overrides — e.g., a modal that flips theme to dark for its subtree.

### Q15. Can a Provider read its own context?
Not the value it's currently providing (it's not below itself). It can read a parent Provider's value of the same context if one exists.

---

## 12. Cheat Sheet

```tsx
// Create
const Ctx = createContext<Value | null>(null);

// Provide (React 19)
<Ctx value={memoizedValue}>{children}</Ctx>

// Provide (React 16.3–18)
<Ctx.Provider value={memoizedValue}>{children}</Ctx.Provider>

// Consume (function component)
const v = useContext(Ctx);        // any React 16.8+
const v = use(Ctx);               // React 19+, allows conditional

// Consume (class component, legacy)
static contextType = Ctx;
this.context // -> Value

// Guarded hook (recommended)
function useCtx() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useCtx must be used inside CtxProvider");
  return v;
}
```

---

## 13. TL;DR

- Context = built-in DI for a subtree, not a state manager.
- Best for global-ish, low-frequency values.
- Modern: `useContext` / `use()` + `<Context value>` JSX (React 19).
- Legacy: `<Context.Consumer>` render props, `static contextType`.
- Perf: memoize value, split by cadence, don't put ticking values in shared contexts.
- Typed pattern: `createContext<T | null>(null)` + guarded hook.
