# Custom Hooks in React with TypeScript — A Guided Lesson

Welcome. Before we touch any of the three hooks, let me set the frame you should carry through the whole lesson.

## The one mental model to hold onto

> **A custom hook is just a JavaScript function that follows two rules: its name starts with `use`, and it is allowed to call other hooks inside it.**

There is no special React API called "createHook". No registration. No decorator. Nothing. It is a plain function — the `use` prefix is a *social contract* that tells React (and the linter) "treat me like a hook, apply the Rules of Hooks to me."

Why does that matter? Because it demystifies everything. Anything you can do inside a component with `useState`, `useEffect`, `useRef`, `useReducer` — you can do inside a custom hook. The custom hook then becomes a **reusable package of behavior** that any component can plug into.

Now let's go.

---

# Hook 1 — `useToggle`

## 1. Start with the problem

Imagine you're building an app with a Modal, a Dropdown, and a Sidebar. Each of these has an "open / closed" state.

Here's what the code looks like **without a custom hook**. Look at your existing `05-custom-hooks/src/useToggle/Modal.tsx` — it's exactly this pattern:

```tsx
// Modal.tsx
function Modal() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const toggle = () => setIsOpen(prev => !prev);
  return (
    <>
      <button onClick={toggle}>{isOpen ? "Close" : "Open"}</button>
      {isOpen && <div>Modal Content</div>}
    </>
  );
}

// Dropdown.tsx
function Dropdown() {
  const [isOpen, setIsOpen] = useState<boolean>(false);   // duplicated
  const toggle = () => setIsOpen(prev => !prev);          // duplicated
  ...
}

// Sidebar.tsx
function Sidebar() {
  const [isOpen, setIsOpen] = useState<boolean>(false);   // duplicated again
  const toggle = () => setIsOpen(prev => !prev);          // duplicated again
  ...
}
```

### What is duplicated?

Two lines. Every. Single. Time.

```ts
const [isOpen, setIsOpen] = useState<boolean>(false);
const toggle = () => setIsOpen(prev => !prev);
```

### Why is this a problem?

- **DRY violation.** If tomorrow you want every toggle to log to analytics, you have to edit every component.
- **Mixing concerns.** The Modal component should be about *rendering a modal*, not about *managing a boolean*. Right now, both responsibilities live in the same file.
- **Testing.** You can't unit-test "the toggle behavior" in isolation, because it's welded to the component.

### Why a custom hook fixes it

We lift the two duplicated lines into a function called `useToggle`. The Modal, Dropdown, and Sidebar all call `useToggle()` and share the *behavior* — but each gets its **own independent state**, because each call to `useState` inside the hook creates a fresh slot in that component's fiber.

That last sentence is important. New students often ask: *"If three components use the same hook, do they share state?"* No. They share **code**, not **state**. Every call to `useToggle()` runs a fresh `useState`, and React associates that state with the calling component.

---

## 2. Explain the concept in simple language

| Question | Answer |
|---|---|
| What does it do? | Manages a boolean value that can be flipped between `true` and `false`. |
| What does it accept? | An **optional** initial boolean value. Defaults to `false`. |
| What does it return? | A tuple: `[currentValue, toggleFunction]`. |
| How does a component use it? | `const [isOpen, toggle] = useToggle(false);` |
| When should I use it? | Anywhere you have an on/off, open/closed, shown/hidden binary state. |
| When should I **not** use it? | When your boolean depends on complex logic (e.g., "only toggle if user is admin AND value is valid"). At that point, `useState` in the component itself is clearer. |

---

## 3. Step-by-step implementation

### Step 1 — The simplest possible version (no TypeScript)

```js
import { useState } from "react";

function useToggle() {
  const [value, setValue] = useState(false);

  function toggle() {
    setValue(prev => !prev);
  }

  return [value, toggle];
}
```

Line-by-line:

- `function useToggle()` — a plain function. The `use` prefix is what makes React's linter treat it as a hook.
- `const [value, setValue] = useState(false)` — we're calling `useState` *inside our function*. This is legal because `useToggle` itself is a hook. The state belongs to whichever component ultimately calls `useToggle`.
- `setValue(prev => !prev)` — this is the **functional updater form**. Why not `setValue(!value)`? Because if two toggles fire back-to-back, `value` might be stale. `prev` is always the freshest value React has. Rule of thumb: when the new state depends on the old state, use the functional form.
- `return [value, toggle]` — returning an **array** (not an object) so the caller can rename the pair however they like with destructuring: `const [isOpen, openToggle] = useToggle()` or `const [isDark, toggleDark] = useToggle()`.

### Step 2 — Accept an optional initial value

```js
function useToggle(initialValue = false) {
  const [value, setValue] = useState(initialValue);

  function toggle() {
    setValue(prev => !prev);
  }

  return [value, toggle];
}
```

Why did we add this? Because sometimes you want a modal to be open by default, or a "dark mode" toggle that reads `true` on first render. The `= false` is a default parameter, so `useToggle()` still works exactly like before.

### Step 3 — Add TypeScript

```ts
import { useState } from "react";

function useToggle(initialValue: boolean = false): [boolean, () => void] {
  const [value, setValue] = useState<boolean>(initialValue);

  const toggle = (): void => {
    setValue(prev => !prev);
  };

  return [value, toggle];
}

export default useToggle;
```

Let's break every type down carefully.

#### `initialValue: boolean = false`

- **Meaning:** the parameter is a `boolean`, defaulting to `false`.
- **Why needed?** So a caller can't accidentally do `useToggle("yes")` or `useToggle(1)`. TypeScript will yell at compile time.
- **What if we removed the type?** TypeScript would *infer* it as `boolean` because of the default `= false`. So in this specific case, TypeScript can figure it out. But writing it explicitly documents your intent and protects you if you later change the default.

#### The return type: `: [boolean, () => void]`

- **Meaning:** a **tuple** of exactly two elements — a `boolean` first, then a function that takes no arguments and returns nothing.
- **Why needed?** Here's the critical part. Without an explicit return type, TypeScript would infer the return as `(boolean | (() => void))[]` — an *array* of "either a boolean or a function." Then when the caller writes `const [isOpen, toggle] = useToggle()`, TypeScript would think `isOpen` might be a function and `toggle` might be a boolean. That destroys type safety.
- **What if we removed it?** The consumer would have to add `as const` or type-assert at the call site. Much messier. **Always annotate the return type of a custom hook that returns a tuple.**
- **Alternative:** use `as const` inside the hook: `return [value, toggle] as const;` — that also narrows the return to a tuple. Both approaches are valid; the explicit annotation is more readable for teaching.

#### `useState<boolean>(initialValue)`

- **Meaning:** we're explicitly telling `useState` the state's type is `boolean`.
- **Why needed?** In this case, TypeScript would infer `boolean` from `initialValue`, so the generic is technically redundant. It becomes *essential* when the initial value is `null` or `undefined` (e.g., `useState<User | null>(null)`), because otherwise TypeScript would lock the state to just `null`.
- **What if we removed it?** Nothing — inference handles it here. Keep it for explicitness while learning; drop it when it's obvious.

#### `toggle: (): void`

- **Meaning:** a function that returns nothing (`void`).
- **Why?** The toggle exists purely for its side effect (updating state). It has no useful return value.
- **What if we removed it?** TypeScript would infer `void` anyway. Explicit is fine but not required.

### Step 4 — Final implementation

```ts
// custom-hooks/useToggle.ts
import { useState } from "react";

export default function useToggle(
  initialValue: boolean = false
): [boolean, () => void] {
  const [value, setValue] = useState<boolean>(initialValue);
  const toggle = (): void => setValue(prev => !prev);
  return [value, toggle];
}
```

This is the version you should put in your currently-empty `05-custom-hooks/src/custom-hooks/useToggle.ts`.
- Rename to useToggle.ts instead .tsx?
- The `.tsx` extension is typically used for files that contain JSX syntax, which is a syntax extension for JavaScript that allows you to write HTML-like code within your JavaScript. Since the `useToggle` custom hook does not contain any JSX and is purely a TypeScript function, it is more appropriate to use the `.ts` extension. This helps to clearly indicate that the file is a TypeScript module without any JSX content.

- setValue(!value) vs setValue(prev => !prev)
- Using `setValue(!value)` directly can lead to potential issues in scenarios where the state update is asynchronous or when multiple state updates are queued. This is because `value` may not reflect the most recent state at the time of the update, leading to unexpected behavior.
- Using the functional form `setValue(prev => !prev)` ensures that the update is based on the most recent state, avoiding such issues.

### Step 5 — Consuming it in a component

Refactor your `05-custom-hooks/src/useToggle/Modal.tsx`:

```tsx
import useToggle from "../custom-hooks/useToggle";

export default function Modal() {
  const [isOpen, toggle] = useToggle(false);

  return (
    <>
      <button onClick={toggle}>{isOpen ? "Close Modal" : "Open Modal"}</button>
      {isOpen && <div className="modal">Modal Content</div>}
    </>
  );
}
```

Look at how much shrunk. The behavior is identical, but the Modal now only speaks about "modal-ness." The boolean plumbing is gone.

### Step 6 — Walk through the execution

Imagine a user clicks the button:

1. React mounts `<Modal />`. React begins rendering.
2. Inside `Modal`, JavaScript hits `useToggle(false)`. It calls the function.
3. Inside `useToggle`, `useState<boolean>(false)` runs. React allocates a state slot for **this Modal instance**, initial value `false`. Returns `[false, setValue]`.
4. `useToggle` defines `toggle` and returns `[false, toggle]`.
5. Back in `Modal`, `isOpen = false`, `toggle = <function>`. The button renders "Open Modal".
6. User clicks the button. `toggle()` runs. Inside, `setValue(prev => !prev)` runs with `prev = false`, so it sets state to `true`.
7. React schedules a re-render of `Modal`.
8. `Modal` re-renders. `useToggle(false)` runs *again* — but `useState` doesn't reset, it returns the *current* state (`true`) from the same slot.
9. `isOpen = true`, button now reads "Close Modal", and `<div className="modal">` renders.

The key insight: **the state lives on the component's fiber, not on the hook**. The hook is a recipe. Every component that calls it gets its own kitchen.

---

# Hook 2 — `useLocalStorage`

## 1. Start with the problem

You have a settings screen. The user picks a username. They refresh the page. The username is gone. Frustrating.

**Without a custom hook:**

```tsx
function SettingsForm() {
  const [name, setName] = useState<string>(() => {
    const raw = localStorage.getItem("username");
    if (raw === null) return "";
    try {
      return JSON.parse(raw);
    } catch {
      return "";
    }
  });

  useEffect(() => {
    localStorage.setItem("username", JSON.stringify(name));
  }, [name]);

  return <input value={name} onChange={e => setName(e.target.value)} />;
}
```

Now imagine you also need `theme`, `language`, `fontSize`, `sidebarCollapsed` — each requires:

- A lazy initializer that reads from `localStorage`.
- A `try/catch` around `JSON.parse`.
- A `useEffect` that writes back on change.

That's 15 lines of duplication per piece of state. And every developer on your team writes the `try/catch` slightly differently. Some forget it entirely and crash the app when localStorage contains bad data.

### Why a custom hook fixes it

We hide all that plumbing inside a `useLocalStorage` hook. Callers just write:

```ts
const [name, setName] = useLocalStorage("username", "");
```

It **feels like** `useState`, but the value is transparently persisted.

---

## 2. Explain the concept in simple language

| Question | Answer |
|---|---|
| What does it do? | Acts like `useState`, but reads/writes the value to `localStorage`. |
| What does it accept? | A `key` (string, the localStorage key) and an `initialValue` (fallback if nothing is stored). |
| What does it return? | The same shape as `useState`: `[value, setValue]`. |
| When should I use it? | User preferences, form drafts, "remember me" flags, cart contents. |
| When should I **not** use it? | Sensitive data (localStorage is plain text and accessible to any script on the page). Large data (there's ~5MB per origin). Data that needs to sync across tabs — that requires extra work with the `storage` event. |

There are **three subtleties** we must handle:

1. **Read from localStorage in a lazy initializer** — `useState(() => ...)`. Passing a *function* to `useState` means "run this only on the first render." If we did `useState(localStorage.getItem(key))` directly, we'd touch localStorage on *every* render — wasteful, and worse: on server-side rendering, `localStorage` doesn't exist and the app would crash immediately.
2. **`localStorage` only stores strings.** If you save `{ theme: "dark" }`, calling `localStorage.setItem("prefs", { theme: "dark" })` stores the literal string `"[object Object]"`. So we `JSON.stringify` on write and `JSON.parse` on read.
3. **Wrap `JSON.parse` in `try/catch`.** A user could open DevTools and hand-edit localStorage. If it's not valid JSON, `JSON.parse` throws and takes down your app. Defensive parsing keeps you safe.

---

## 3. Step-by-step implementation

### Step 1 — Naïve version (broken on purpose so you see the pitfalls)

```js
function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(localStorage.getItem(key) ?? initialValue);

  useEffect(() => {
    localStorage.setItem(key, value);
  }, [key, value]);

  return [value, setValue];
}
```

Problems:
- `localStorage.getItem(key)` runs on every render (small perf hit, big SSR crash).
- No JSON handling — if `initialValue` is a number or object, we get bugs.
- No `try/catch` — corrupted storage crashes the app.

### Step 2 — Lazy initializer

```js
function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    const stored = localStorage.getItem(key);
    return stored !== null ? stored : initialValue;
  });

  useEffect(() => {
    localStorage.setItem(key, value);
  }, [key, value]);

  return [value, setValue];
}
```

The `() => { ... }` inside `useState` is what makes this a **lazy initializer**. React runs this function *once*, on the first render only. On subsequent renders, React ignores it entirely and returns the stored state.

### Step 3 — Add JSON parse/stringify + try/catch

```js
function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored !== null ? JSON.parse(stored) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}
```

Now:
- We `JSON.parse` when reading (handles numbers, objects, arrays, booleans).
- We `JSON.stringify` when writing.
- If parsing fails, we silently fall back to `initialValue` rather than crashing.

### Step 4 — Add TypeScript with a generic

```ts
import { useState, useEffect } from "react";

function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored !== null ? (JSON.parse(stored) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // storage might be full or disabled (private mode)
    }
  }, [key, value]);

  return [value, setValue];
}

export default useLocalStorage;
```

Let's walk through every type.

#### `<T>` — the generic type parameter

- **Meaning:** "This hook works with *any* type. Whoever calls me, tell me what `T` is, and I'll be consistent about it."
- **Why needed?** Because a user might store a string, a number, a `User` object, or a boolean array. We don't want to hardcode `string`. The generic lets one hook serve every case.
- **What if we removed it?** We'd have to type `initialValue` as `unknown` or `any`, and the return type would leak — `setName("Alice")` might accept numbers. TypeScript's protection would evaporate.
- **Can TypeScript infer it?** Yes! When you write `useLocalStorage("username", "")`, TypeScript sees `""` (a string) and sets `T = string`. You rarely need to write `useLocalStorage<string>(...)` explicitly. However, if the initial value is `null` or `[]`, you *do* need to write it explicitly, e.g. `useLocalStorage<User | null>("user", null)`, otherwise `T` would be inferred as just `null`.

#### `key: string`

- **Meaning:** the localStorage key must be a string.
- **Why?** `localStorage.setItem` requires a string. Preventing accidents like `useLocalStorage(42, "hi")`.

#### `initialValue: T`

- **Meaning:** the fallback value must be the same type as everything else.
- **Why?** So if you say `T = string`, you can't pass `initialValue = 5`. Consistency.

#### The return type: `[T, React.Dispatch<React.SetStateAction<T>>]`

This is the fiddly one. Let's dissect it.

- `T` — the current value's type. Simple.
- `React.Dispatch<React.SetStateAction<T>>` — the type of `useState`'s setter.
  - `React.SetStateAction<T>` = `T | ((prev: T) => T)`. In plain English: the setter accepts either a new value directly, or a function that computes the new value from the previous one.
  - `React.Dispatch<X>` = `(value: X) => void`. A function that accepts `X` and returns nothing.
- Combined: **"a function that accepts either a new `T` or a `(prev: T) => T` updater, and returns nothing."** That's exactly how `useState`'s setter behaves.
- **Why not just `(v: T) => void`?** Because then callers couldn't do `setName(prev => prev + "!")` — the type would reject the functional updater.
- **Can TypeScript infer it?** Yes — if you drop the explicit return type, TS infers a tuple correctly *as long as you use `as const` or the tuple syntax `[T, typeof setValue]`*. Being explicit here is a good teaching habit.

#### `JSON.parse(stored) as T`

- **Meaning:** we're telling TypeScript, "trust me, I know the parsed value matches `T`."
- **Why?** `JSON.parse` returns `any`. We use a **type assertion** to narrow it to `T`.
- **Is this safe?** No, not really — at runtime the stored data could have been corrupted or written with a different shape. For a teaching hook, the `try/catch` gives us a safety net. In production, you'd validate with a library like Zod.

### Step 5 — Consuming it

```tsx
import useLocalStorage from "./custom-hooks/useLocalStorage";

function Settings() {
  const [name, setName] = useLocalStorage<string>("username", "");
  const [theme, setTheme] = useLocalStorage<"light" | "dark">("theme", "light");

  return (
    <>
      <input value={name} onChange={e => setName(e.target.value)} />
      <button onClick={() => setTheme(t => (t === "light" ? "dark" : "light"))}>
        Switch theme
      </button>
    </>
  );
}
```

Notice: consuming it looks **identical to `useState`**, except the values survive a refresh. That's the whole point.

### Step 6 — Walk through the execution

Scenario: First-time visit, then refresh, then edit.

**First visit:**
1. `<Settings />` mounts, calls `useLocalStorage("username", "")`.
2. `useState`'s lazy initializer runs. `localStorage.getItem("username")` returns `null`. We fall back to `""`.
3. Component renders with empty input.
4. User types "Alice". `onChange` fires, calls `setName("Alice")`.
5. State updates to `"Alice"`. React re-renders.
6. After render, `useEffect` runs. `localStorage.setItem("username", JSON.stringify("Alice"))` writes `"\"Alice\""` to storage.

**On refresh:**
1. `<Settings />` mounts. Lazy initializer runs.
2. `localStorage.getItem("username")` returns `"\"Alice\""` (a JSON-encoded string).
3. `JSON.parse` gives us back `"Alice"`.
4. Input renders with `"Alice"`. Persistence achieved.

**If someone tampered with storage:**
1. Lazy initializer runs. `localStorage.getItem("username")` returns `"{{{corrupt"`.
2. `JSON.parse` throws.
3. `catch` block returns `initialValue` (`""`). App does not crash.

---

# Hook 3 — `useDebounce`

## 1. Start with the problem

You've built a search bar that hits an API on every keystroke:

```tsx
function Search() {
  const [term, setTerm] = useState("");

  useEffect(() => {
    fetch(`/api/search?q=${term}`).then(...);
  }, [term]);

  return <input value={term} onChange={e => setTerm(e.target.value)} />;
}
```

Type "javascript" and you fire **10 API calls** — one for `"j"`, one for `"ja"`, one for `"jav"`, and so on. Your server hates you. The user's screen flickers with stale results arriving out of order.

What you *actually* want: wait until the user pauses typing for, say, 500ms, then fire *one* API call with the final value.

**Without a custom hook** you'd write this inline in every search-like component:

```tsx
function Search() {
  const [term, setTerm] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const id = setTimeout(() => setDebounced(term), 500);
    return () => clearTimeout(id);
  }, [term]);

  useEffect(() => {
    fetch(`/api/search?q=${debounced}`).then(...);
  }, [debounced]);

  return <input value={term} onChange={e => setTerm(e.target.value)} />;
}
```

Every component that wants debouncing repeats those five lines. And they're subtle — miss the cleanup and you spawn a timer per keystroke that never gets cancelled.

### Why a custom hook fixes it

Extract the debounce logic. Then every component just says:

```ts
const debouncedTerm = useDebounce(term, 500);
```

And uses `debouncedTerm` wherever they used to use `term` in effects.

---

## 2. Explain the concept in simple language

| Question | Answer |
|---|---|
| What does it do? | Returns a "delayed" copy of a value that only updates after the value has been stable for `delay` ms. |
| What does it accept? | A `value` (the live value) and a `delay` (ms to wait). |
| What does it return? | The debounced value. Only that. |
| When should I use it? | Search inputs, autosave, window-resize handlers, form validation on typing. |
| When should I **not** use it? | For button-click rate limiting — that's throttling, a different concept. For animations — use `requestAnimationFrame`. |

**The core trick — read this twice:**

We hold the debounced value in `useState`. We use `useEffect` with `[value, delay]` as dependencies. Inside, we `setTimeout` to update the debounced state after `delay` ms. We return a **cleanup function that calls `clearTimeout`**.

Here's what happens on each keystroke:
1. Parent re-renders with new `value`.
2. Our hook's `useEffect` sees `value` changed, so React runs the **cleanup** of the previous effect — cancelling the old timeout.
3. Then React runs the new effect — starting a fresh 500ms timer.
4. If the user types again before 500ms is up, cleanup fires again, cancelling that timer, starting a new one.
5. If the user finally stops for 500ms, the timer fires uninterrupted, `setDebouncedValue` runs, and the debounced state updates.

**The cleanup is the trick.** Without it, every keystroke would spawn a timer that eventually fires. You'd get all the updates, just delayed. With cleanup, only the last surviving timer fires.

---

## 3. Step-by-step implementation

### Step 1 — Just state, no debouncing yet

```js
function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  return debounced;
}
```

This does nothing useful — it just captures the *initial* value and never updates. But it establishes the shape.

### Step 2 — Add the effect and setTimeout

```js
function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
  }, [value, delay]);

  return debounced;
}
```

This *almost* works, but has the bug I described: every keystroke schedules a timeout, and none of them are cancelled. Type "abc" quickly, and 500ms later you'll get three updates, one after another.

### Step 3 — Add the cleanup

```js
function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}
```

The `return () => clearTimeout(id)` is the payoff. Every time `value` changes, React runs the cleanup of the previous effect *before* running the new one. That cancels the pending timeout. Only when `value` stays still does the timeout survive long enough to fire.

### Step 4 — Add TypeScript with a generic

```ts
import { useState, useEffect } from "react";

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}

export default useDebounce;
```

Types explained:

#### `<T>` — the generic

- **Meaning:** the hook is agnostic to what kind of value is being debounced.
- **Why needed?** You might debounce a string (search box), a number (a slider), or an object (a form state). Making it generic keeps the hook reusable.
- **Can TypeScript infer it?** Yes. If you call `useDebounce(searchTerm, 500)` and `searchTerm` is `string`, then `T = string` and the returned debounced value is also `string`. You almost never need to write `useDebounce<string>(...)`.
- **What if we removed it?** You'd need to hardcode a type like `unknown` or `any`, and callers would lose type safety on the return.

#### `value: T` and return type `: T`

- **Meaning:** the input and output are the same type.
- **Why?** Debouncing doesn't transform the shape — it delays it. If you feed in a string, you get a string back.
- **What if we removed the return type?** TS would still infer `T`. Explicit is documentation.

#### `delay: number`

- **Meaning:** must be a number of milliseconds.
- **Why?** `setTimeout` accepts a number. Prevents `useDebounce(value, "500")`.

#### One subtle typing gotcha — `setTimeout`'s return

`setTimeout` returns `number` in the browser and `NodeJS.Timeout` in Node. In a browser-only React app, `const id = setTimeout(...)` types correctly as `number`. If you write tests with Jest and it complains, you can annotate: `const id: ReturnType<typeof setTimeout> = setTimeout(...)`. Good to know, not critical here.

### Step 5 — Consuming it

```tsx
import useDebounce from "./custom-hooks/useDebounce";

function SearchBox() {
  const [term, setTerm] = useState<string>("");
  const debouncedTerm = useDebounce(term, 500);

  useEffect(() => {
    if (!debouncedTerm) return;
    fetch(`/api/search?q=${debouncedTerm}`);
  }, [debouncedTerm]);

  return <input value={term} onChange={e => setTerm(e.target.value)} />;
}
```

Note the pattern:
- `term` is the *live* value bound to the input (must update immediately for responsive UX).
- `debouncedTerm` is the *delayed* value that triggers the expensive work.
- We depend on `debouncedTerm` in the fetch effect, not `term`.

### Step 6 — Walk through the execution

User types "js" then pauses, then types "on", then pauses.

**Time 0ms:** Mount. `term = ""`, `debounced = ""`. Effect runs, schedules a timeout (id=1) that would set debounced to `""` after 500ms. Nothing to fetch.

**Time 100ms:** User types "j". Parent re-renders with `term = "j"`.
- Hook re-runs. `useDebounce("j", 500)` is called.
- `useState` returns the current debounced (`""`), not `"j"`.
- `useEffect` sees deps changed. React runs **cleanup of previous effect**: `clearTimeout(1)`. Old timer dies.
- New effect runs: schedules timer id=2 to set debounced to `"j"` after 500ms.

**Time 200ms:** User types "s". Parent re-renders with `term = "js"`.
- Same sequence. Cleanup cancels timer 2. New timer 3 scheduled to set debounced to `"js"` after 500ms.

**Time 200ms → 700ms:** No input. Timer 3 is not cancelled. At 700ms, it fires. `setDebounced("js")` runs.
- Parent re-renders with `debouncedTerm = "js"`.
- Fetch effect fires. One API call for `"js"`.

**Time 900ms:** User types "o". Repeats the pattern.

**Result:** Instead of one API call per keystroke, we get one API call per **pause**. Server relieved. UI still snappy because the input itself uses `term`, not `debouncedTerm`.

---

# Cross-cutting rules to remember

1. **A custom hook is a function whose name starts with `use` and can call other hooks.** No magic.
2. **State is per-component, not per-hook.** Two components calling the same hook get independent state.
3. **Return tuples for `useState`-like hooks, objects for larger APIs.** Tuples let callers rename. Objects work better when you have 3+ things to return.
4. **Always annotate the return type** if you're returning a tuple — TS won't infer a tuple by default.
5. **Use generics `<T>`** when your hook is agnostic to the data's shape.
6. **The lazy initializer `useState(() => ...)`** is essential when the initial value is expensive to compute or reads from browser APIs like `localStorage`.
7. **The `useEffect` cleanup is where timers and subscriptions are cancelled.** It's not optional — it's the whole trick behind debouncing.
8. **Functional updates `setX(prev => ...)`** protect you from stale-closure bugs when the new state depends on the old.

---

# Suggested next topics

- Extending `useLocalStorage` to sync across tabs using the `storage` event.
- Writing a `useThrottle` and comparing it to `useDebounce`.
- Testing custom hooks with `@testing-library/react`'s `renderHook`.
- Understanding why the `use` prefix isn't just a convention — it's how the ESLint rule `react-hooks/rules-of-hooks` decides what to lint.
