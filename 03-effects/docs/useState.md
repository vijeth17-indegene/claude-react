# `useState` — A Practical Guide

A deep-dive covering how `useState` is used across this workspace ([TitleCounter.tsx](../src/components/TitleCounter.tsx), [LiveClock.tsx](../src/components/LiveClock.tsx), [ExpenseForm.tsx](../../02-expense-tracker/src/components/ExpenseForm.tsx), [App.tsx](../../02-expense-tracker/src/App.tsx)), the difference between direct and functional updates, and the bugs that appear when you get them wrong.

---

## Table of contents

1. [What `useState` is for](#what-usestate-is-for)
2. [Anatomy of the hook](#anatomy-of-the-hook)
3. [Initial state — eager vs lazy](#initial-state--eager-vs-lazy)
4. [The setter — direct vs functional updates](#the-setter--direct-vs-functional-updates)
5. [State is a snapshot, not a live variable](#state-is-a-snapshot-not-a-live-variable)
6. [Case study 1 — `TitleCounter` (primitive state)](#case-study-1--titlecounter-primitive-state)
7. [Case study 2 — `LiveClock` (object state)](#case-study-2--liveclock-object-state)
8. [Case study 3 — `ExpenseForm` (multiple pieces of state)](#case-study-3--expenseform-multiple-pieces-of-state)
9. [Case study 4 — `App` (array state + derived state)](#case-study-4--app-array-state--derived-state)
10. [Bug lab — what breaks when you get it wrong](#bug-lab--what-breaks-when-you-get-it-wrong)
11. [Batching (React 18+)](#batching-react-18)
12. [Rules of thumb](#rules-of-thumb)

---

## What `useState` is for

Components need to **remember** things between renders — a counter's current value, the text a user typed, whether a menu is open. Plain variables can't do this; they're recreated every time the function runs.

`useState` gives a component a private, per-instance memory slot that:

- Survives re-renders.
- Triggers a re-render when it changes.
- Is scoped to *this specific instance* of the component (two `<TitleCounter />`s each have their own count).

> Think of `useState` as: *"Give me a value I can remember, and a function that both updates it and asks React to re-render."*

---

## Anatomy of the hook

```tsx
const [value, setValue] = useState<T>(initialValue);
//     ^^^^^  ^^^^^^^^                ^^^^^^^^^^^^
//     |      |                       used only on the first render
//     |      updater function — call to change value and re-render
//     current value for this render
```

- **`value`** — the state as of this render. It is a **constant** inside this render; setting it does not mutate this variable.
- **`setValue`** — the updater. Two calling styles:
  - **Direct:** `setValue(next)` — replaces state with `next`.
  - **Functional:** `setValue((prev) => next)` — receives the latest queued value and returns the next one.
- **`initialValue`** — used only on the component's **first render**. Ignored on every subsequent render.
- **`<T>`** — the TypeScript type. React usually infers it from `initialValue`, but you can be explicit: `useState<Expense[]>([])`.

---

## Initial state — eager vs lazy

### Eager (the common case)

```tsx
const [count, setCount] = useState<number>(0);
```

The value `0` is evaluated on every render but only *used* on the first one. Fine for cheap values (numbers, strings, `[]`, `{}`).

### Lazy (for expensive initializers)

```tsx
const [items, setItems] = useState<Item[]>(() => parseLargeJSON(localStorage.getItem("items")));
```

Passing a **function** tells React: *"only call this on the first render."* Without the wrapper, `parseLargeJSON` would run on every render — wasted CPU.

**Rule:** if computing the initial value is expensive (parsing, cloning a big object, `localStorage` access), wrap it in a function.

---

## The setter — direct vs functional updates

### Direct: `setCount(5)`

Use when the next value **doesn't depend** on the current one.

```tsx
setName("Alice");        // replace with a known value
setErrors({});           // reset
setCategory("Food");     // pick from an enum
```

### Functional: `setCount((c) => c + 1)`

Use when the next value **depends** on the current one, especially when multiple updates might queue.

```tsx
setCount((c) => c + 1);
setExpenses((prev) => [...prev, newExpense]);
setExpenses((prev) => prev.filter((e) => e.id !== id));
```

### Why functional is safer

React batches state updates. If you write:

```tsx
setCount(count + 1);
setCount(count + 1);
setCount(count + 1);
```

…all three see the **same** captured `count` (say, `0`) and all queue `setCount(1)`. Result: `1`, not `3`.

With the functional form:

```tsx
setCount((c) => c + 1);
setCount((c) => c + 1);
setCount((c) => c + 1);
```

Each function receives the pending value from the queue: `0 → 1`, `1 → 2`, `2 → 3`. Result: `3`.

This is exactly the pattern used in [TitleCounter.tsx](../src/components/TitleCounter.tsx#L14):

```tsx
<button onClick={() => setCount((c) => c + 1)}>Increment</button>
```

…and in [App.tsx](../../02-expense-tracker/src/App.tsx#L15):

```tsx
setExpenses((prevExpenses) => [...prevExpenses, expense]);
```

---

## State is a snapshot, not a live variable

This is the mental model that trips up most beginners.

```tsx
function Counter() {
    const [count, setCount] = useState(0);

    function handleClick() {
        setCount(count + 1);
        console.log(count);          // logs the OLD value — still 0
        setCount(count + 1);         // still uses 0, queues 1 again
    }

    return <button onClick={handleClick}>{count}</button>;
}
```

Inside `handleClick`, `count` is the value **captured when this render happened**. Calling `setCount` doesn't change `count` in the current function scope — it schedules a **new render** where `count` will have the new value.

Each render sees its own frozen copy of state. If you need to react to the new value in the same handler, use a local variable:

```tsx
const next = count + 1;
setCount(next);
console.log(next);   // ✅ current logic sees the new value
```

Or use the functional updater and put the work in a `useEffect` that depends on the state.

---

## Case study 1 — `TitleCounter` (primitive state)

```tsx
import { useEffect, useState } from "react";

export default function TitleCounter() {
    const [count, setCount] = useState<number>(0);

    useEffect(() => {
        document.title = `Count: ${count}`;
    }, [count]);

    return (
        <>
            <p>Count: {count}</p>
            <button onClick={() => setCount((c) => c + 1)}>Increment</button>
        </>
    );
}
```

### Why `useState<number>(0)`?

`0` is the starting count. `<number>` is optional (TypeScript would infer it) but makes intent explicit.

### Why `setCount((c) => c + 1)` and not `setCount(count + 1)`?

Both work here because the button is clicked one event at a time. But the functional form is a habit worth keeping — if you later add a "+3" button that calls the setter three times, only the functional form gives you `count + 3`.

### Why does `count` appear in `useEffect`'s deps?

The effect **reads** `count`. Any reactive value read inside an effect must appear in its dependency array — otherwise the effect captures a stale value and the title stops updating. See the [`useEffect` guide](./useEffect.md#bug-3--missing-dependency-in-titlecounter).

---

## Case study 2 — `LiveClock` (object state)

```tsx
import { useState, useEffect } from "react";

export default function LiveClock() {
    const [time, setTime] = useState<Date>(new Date());

    useEffect(() => {
        const intervalId = setInterval(() => {
            setTime(new Date());
        }, 1000);

        return () => clearInterval(intervalId);
    }, []);

    return <h2>{time.toLocaleTimeString()}</h2>;
}
```

### Why `new Date()` as the initial value?

We want the clock to show *some* time on the first paint, before the first interval tick fires. `new Date()` gives us "now."

### Why does this not need the lazy form (`() => new Date()`)?

Constructing a `Date` is trivially cheap. Lazy init is for expensive work (parsing large data, reading `localStorage`, etc.).

### Why doesn't the setter need the functional form here?

`setTime(new Date())` doesn't read the previous `time` — it replaces it with a freshly constructed value. There's no dependency on prior state, so `setTime((prev) => new Date())` would just be noise.

### Why isn't `time` in the `useEffect` deps?

The effect doesn't **read** `time` — it only calls `setTime` with a value derived from `new Date()`. Setters are stable (React guarantees the identity of `setTime` never changes), so they don't belong in deps either.

---

## Case study 3 — `ExpenseForm` (multiple pieces of state)

From [ExpenseForm.tsx](../../02-expense-tracker/src/components/ExpenseForm.tsx):

```tsx
const [name, setName] = useState<string>("");
const [amount, setAmount] = useState<string>("");
const [category, setCategory] = useState<Category>("Food");
const [errors, setErrors] = useState<{ name?: string; amount?: string }>({});
```

### Why four `useState` calls instead of one object?

Splitting related-but-independent values into separate states is idiomatic in React because:

- Each field has its own natural update pattern (a text input just calls `setName(e.target.value)`).
- You never need to spread a whole object to update one key: no `setForm({ ...form, name: e.target.value })`.
- Re-render granularity is finer.

When *would* you group them? When the fields are always updated together, or when they naturally form a single logical unit (like a form's `errors` object above — all keys change together).

### Why is `amount` a `string` and not a `number`?

The `<input type="number">` DOM value is a string. Storing it as a string lets the user type `""`, `"1"`, `"1.5"`, `"1.5e"` etc. without fighting the input. Coercion to `Number(amount)` happens at submit-time.

### Why `useState<Category>("Food")` — the explicit generic?

`Category` is a union type (`"Food" | "Travel" | ...`). Without `<Category>`, TypeScript would infer `useState("Food")` as `useState<string>` — you'd lose the union constraint and could accidentally do `setCategory("banana")`.

### Reset pattern

At the end of a successful submit:

```tsx
setName("");
setAmount("");
setCategory("Food");
setErrors({});
```

Each setter is called with a **direct value** (not functional) because none of the resets depend on the previous state. They all batch into a single re-render.

---

## Case study 4 — `App` (array state + derived state)

From [App.tsx](../../02-expense-tracker/src/App.tsx):

```tsx
const [expenses, setExpenses] = useState<Expense[]>([]);
const [catFilter, setCatFilter] = useState<FilteringCategory>("All");

function addExpense(expense: Expense) {
    setExpenses((prevExpenses) => [...prevExpenses, expense]);
}

function deleteExpense(id: string) {
    setExpenses((prevExpenses) => prevExpenses.filter((e) => e.id !== id));
}

const visibleExpenses = catFilter === "All"
    ? expenses
    : expenses.filter((e) => e.category === catFilter);
```

### Why the spread `[...prevExpenses, expense]` instead of `prevExpenses.push(expense)`?

**State must be treated as immutable.** React uses `Object.is` to compare old and new state — if you `push`, the reference is the same, and React may skip the re-render entirely. Always produce a **new array** (`[...prev, item]`, `prev.filter(...)`, `prev.map(...)`).

### Why is `visibleExpenses` not stored in `useState`?

Because it is **derived** — fully computable from `expenses` and `catFilter`. Storing it as state would:

- Duplicate the source of truth (bug risk when they get out of sync).
- Force an extra `useEffect` to re-sync it.
- Cost an unnecessary re-render.

**Rule:** if you can compute it from existing state or props, don't put it in `useState`. Compute it during render.

### Why functional updaters for `add` and `delete`?

Both reads the previous list to derive the next one. If two `addExpense` calls happened in the same tick, the direct form (`setExpenses([...expenses, e])`) would lose one — both would see the same stale `expenses`.

---

## Bug lab — what breaks when you get it wrong

### Bug 1 — Mutating state directly

```tsx
const [expenses, setExpenses] = useState<Expense[]>([]);

function addExpense(e: Expense) {
    expenses.push(e);          // ❌ mutates the existing array
    setExpenses(expenses);     // ❌ same reference — React sees no change
}
```

**What happens:**

- The list appears not to update.
- Sometimes it *does* update (when another state change forces a re-render), which is worse — intermittent bugs.

**Fix:** produce a new array with the spread or a non-mutating method (`filter`, `map`, `slice`, `concat`).

```tsx
setExpenses((prev) => [...prev, e]);
```

The same rule applies to objects: `setUser({ ...user, name: "Alice" })`, never `user.name = "Alice"`.

### Bug 2 — Stale closure in async handlers

```tsx
function handleClick() {
    setTimeout(() => {
        setCount(count + 1);   // ❌ `count` is captured from THIS render
    }, 1000);
}
```

If the user clicks three times quickly, all three timeouts capture the same `count` (say, `0`) and all queue `setCount(1)`. Result after 1s: `1`, not `3`.

**Fix:** functional updater.

```tsx
setTimeout(() => {
    setCount((c) => c + 1);   // ✅ reads latest queued value
}, 1000);
```

### Bug 3 — Reading state right after setting it

```tsx
function handleClick() {
    setCount(count + 1);
    console.log(count);           // ❌ still the old value
    doThingBasedOn(count);        // ❌ still the old value
}
```

`count` is a `const` in this render's scope. `setCount` doesn't retroactively change it — it schedules a new render.

**Fix:** use a local variable, or the functional updater, or move the follow-up work into a `useEffect` that depends on `count`.

```tsx
const next = count + 1;
setCount(next);
doThingBasedOn(next);           // ✅
```

### Bug 4 — Calling the initializer non-lazily on every render

```tsx
const [items, setItems] = useState(parseHugeJSON(localStorage.getItem("items")));
// ❌ runs on every render; result is thrown away after the first
```

**Fix:** wrap in a function.

```tsx
const [items, setItems] = useState(() => parseHugeJSON(localStorage.getItem("items")));
```

### Bug 5 — Treating state like a live database

```tsx
setCount(count + 1);
if (count === 5) {          // ❌ still the old count
    doSomething();
}
```

State updates are queued. The comparison sees the pre-update value. Use the next value directly, or a `useEffect` keyed on `count`.

### Bug 6 — Storing derived data in state

```tsx
const [expenses, setExpenses] = useState<Expense[]>([]);
const [total, setTotal] = useState<number>(0);   // ❌ derivable

useEffect(() => {
    setTotal(expenses.reduce((s, e) => s + e.amount, 0));
}, [expenses]);
```

**What happens:**

- Two sources of truth. If you ever `setTotal` without touching `expenses`, they drift out of sync.
- An extra render every time `expenses` changes (state → effect → state → render).

**Fix:** compute during render.

```tsx
const total = expenses.reduce((s, e) => s + e.amount, 0);
```

### Bug 7 — Conditional or looped hook calls

```tsx
if (loggedIn) {
    const [name, setName] = useState("");   // ❌ breaks the Rules of Hooks
}
```

React identifies each `useState` call by its **call order**, not by a name. Skipping or reordering hook calls corrupts the internal state list, and you'll see: *"Rendered fewer hooks than expected."*

**Fix:** always call the same hooks in the same order. Push conditionals *inside* the hook or into the JSX.

---

## Batching (React 18+)

React 18 batches **all** state updates from the same event tick — synchronous handlers, promises, timeouts, native event listeners — into a single re-render.

```tsx
function handleSubmit() {
    setName("");           // ┐
    setAmount("");         // ├─ one re-render, not four
    setCategory("Food");   // │
    setErrors({});         // ┘
}
```

This is why the reset block in `ExpenseForm` is cheap.

If you *need* to opt out of batching (rare), use `flushSync` from `react-dom`:

```tsx
import { flushSync } from "react-dom";

flushSync(() => setCount(count + 1));
// DOM is now updated; you can read layout, then continue
setOther(true);
```

Almost never needed.

---

## Rules of thumb

1. **Never mutate state — always produce a new value.** Use spread, `filter`, `map` for arrays; object spread for objects.
2. **Use the functional updater whenever the next value depends on the previous one.** `setX((prev) => …)`.
3. **Split unrelated values into separate `useState` calls.** Group only what genuinely changes together.
4. **Don't store what you can derive.** Compute during render.
5. **Wrap expensive initializers in a function** so they run once, not every render.
6. **Treat state as a per-render snapshot.** `count` inside a handler is the value from *this* render, not the latest.
7. **Type the generic when the inferred type would be too wide** (unions, empty arrays, empty objects).
8. **Never call hooks conditionally or in loops.** Same order, every render.

---

## Quick reference table

| Scenario | Pattern |
|---|---|
| Counter / toggle | `useState(0)` / `useState(false)`, functional updater |
| Controlled text input | `useState("")`, `onChange={(e) => setName(e.target.value)}` |
| Enum / union field | `useState<Category>("Food")` — explicit generic |
| List of items | `useState<Item[]>([])`, update with `[...prev, item]` / `.filter` / `.map` |
| Object with several keys | `useState<T>({...})`, update with `{ ...prev, key: next }` |
| Derived value | **Not** state — compute in render |
| Expensive initial value | `useState(() => compute())` — lazy form |
| Multiple queued updates | `setX((prev) => next)` — functional |
| Reading value after setting | Local variable, or `useEffect` on the state |
