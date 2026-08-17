# `useDebounce` — From Naive Code to Production Hook

A complete walkthrough of building the `useDebounce` custom hook incrementally,
covering the reasoning, the mechanism, edge cases, and the TypeScript version.

---

## Table of contents

1. [What is "debouncing," really?](#1-what-is-debouncing-really)
2. [The naive version — feel the pain](#2-the-naive-version--feel-the-pain)
3. [What `useDebounce` should look like (API before code)](#3-what-usedebounce-should-look-like-api-before-code)
4. [Building `useDebounce` — Move 1: get it working](#4-building-usedebounce--move-1-get-it-working)
5. [Line-by-line walkthrough](#5-line-by-line-walkthrough)
6. [Mental model — one render's timeline](#6-mental-model--one-renders-timeline)
7. [Edge cases and pitfalls](#7-edge-cases-and-pitfalls)
8. [Expected behavior — a demo you can trace](#8-expected-behavior--a-demo-you-can-trace)
9. [TypeScript version](#9-typescript-version)
10. [What was added, and WHY (TS explanations)](#10-what-was-added-and-why-ts-explanations)
11. [Recap — the ideas you now own](#11-recap--the-ideas-you-now-own)
12. [Comprehension check](#12-comprehension-check)

---

## 1. What is "debouncing," really?

You've probably heard "debounce" thrown around. Here's a concrete definition
and an analogy, because most people get it fuzzy.

> **Debouncing:** given a value or event that changes rapidly, only act on it
> after it has been *stable* for some period of time.

### Analogy — the impatient friend

Imagine a friend who keeps changing their mind about dinner. Every 200ms they
text you a different restaurant. You *could* start driving toward each one as
they text — but you'd never actually get anywhere.

A sensible response: "Text me your final answer. If you don't change it for 2
seconds, I'll assume that's it and start driving."

That waiting-until-they're-quiet behavior is debouncing.

### The real-world scenarios

- **Search-as-you-type.** User is typing "reactjs". You don't want to fire an
  API request on every keystroke (`r`, `re`, `rea`, `reac`…). You want to wait
  until they've stopped typing, then fire *one* request.
- **Window resize.** User drags the window. `resize` fires dozens of times per
  second. You want to recompute layout once, after they let go.
- **Auto-save.** User is editing a document. Save 500ms after the last edit,
  not on every keystroke.

Debouncing is not the same as **throttling** (which caps the *rate* — "at most
once every 500ms, even if events keep firing"). Debouncing waits for silence.
Throttling enforces a maximum rate. Different tools, different jobs.

---

## 2. The naive version — feel the pain

Here's a search box that hits an API on every keystroke:

```jsx
import { useState, useEffect } from 'react';

function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (!query) return;
    fetch(`/api/search?q=${query}`)
      .then(r => r.json())
      .then(setResults);
  }, [query]);

  return (
    <div>
      <input value={query} onChange={e => setQuery(e.target.value)} />
      <ul>{results.map(r => <li key={r.id}>{r.name}</li>)}</ul>
    </div>
  );
}
```

Type "reactjs" — the effect fires **seven times**, one per keystroke. Seven
network requests. Seven renders when the responses come back. Money burned,
users annoyed, results flickering (because responses may arrive out of order).

The instinct is: "I need to wait until they stop typing before firing the
request." That's a debounce.

### Wrong first attempt — put the timeout inside the fetch effect

```jsx
useEffect(() => {
  const id = setTimeout(() => {
    fetch(`/api/search?q=${query}`).then(r => r.json()).then(setResults);
  }, 500);
  return () => clearTimeout(id);
}, [query]);
```

This *works* — but notice what we've done: we've mixed two responsibilities in
one effect: **"wait for typing to stop"** and **"fetch when the query
stabilizes."** If tomorrow we want to debounce the query for *another* reason
(highlighting, analytics, URL sync), we copy-paste this pattern each time.

The right decomposition is: **debounce the value itself.** Then anyone
downstream — the fetcher, the analytics, the URL — can react to the debounced
value normally.

That's exactly what `useDebounce` gives us.

---

## 3. What `useDebounce` should look like (API before code)

Before writing anything, imagine how we want to use it:

```jsx
function Search() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 500);

  useEffect(() => {
    if (!debouncedQuery) return;
    fetch(`/api/search?q=${debouncedQuery}`)
      .then(r => r.json())
      .then(setResults);
  }, [debouncedQuery]);
  // ...
}
```

Notice the shape:

- **Input:** a raw value (`query`) that changes a lot, and a delay (`500` ms).
- **Output:** a *lagging* copy of that value that only updates after the input
  has been stable for `delay` ms.

`query` changes on every keystroke. `debouncedQuery` changes only after typing
stops for 500ms. The fetch effect depends on `debouncedQuery` — so it fires
once per settled query. Clean separation.

Design decisions we just implicitly made:

1. **The hook returns a value, not a function.** (Compare: some libraries give
   you `debouncedFn = useDebounce(fn, delay)`. That's a different hook —
   `useDebouncedCallback`. Both exist; they're not the same. We're building the
   value-debouncing one.)
2. **The caller keeps their raw state.** Our hook doesn't own the input — it
   just observes it and lags behind. This is important; it means anyone can use
   the raw value if they need it (like showing the current text in the input)
   *and* the debounced value (for the fetch).

---

## 4. Building `useDebounce` — Move 1: get it working

Let's think about what needs to happen inside the hook.

1. The hook receives `value` and `delay`.
2. It needs its own state — the debounced value — because it changes on a
   different schedule than `value`.
3. Every time `value` changes, we need to start a timer. When the timer fires,
   we update the debounced state.
4. If `value` changes *again* before the timer fires, we need to **cancel** the
   previous timer and start a new one. (This is the essence of debouncing.)

The last point is the important one. Here's the first cut:

```js
import { useState, useEffect } from 'react';

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(id);
  }, [value, delay]);

  return debouncedValue;
}
```

That's the whole hook. Nine lines. Every one of them is doing important work.

---

## 5. Line-by-line walkthrough

```js
import { useState, useEffect } from 'react';
```
We need `useState` to hold the debounced value (the caller sees only this),
and `useEffect` to schedule the timer.

```js
function useDebounce(value, delay) {
```
Two parameters. `value` is the rapidly-changing input the caller passes in.
`delay` is the "silence duration" in milliseconds.

Why not give `delay` a default? You *could* (`delay = 500`), but different use
cases want different delays — search-as-you-type is usually 300–500ms,
auto-save is often 1–2 seconds, resize handlers are often 100–200ms. Forcing
the caller to specify makes them think about the right value.

```js
const [debouncedValue, setDebouncedValue] = useState(value);
```
This is subtler than it looks. We're **initializing the debounced value with
the current input value**.

Why not initialize with `null` or `''` or `undefined`? Because on the very
first render, there's no "previous value" that we've been waiting for silence
on — the caller just handed us `value` for the first time. The user hasn't
typed anything yet, so the "debounced" version is trivially equal to what we
were given.

If we initialized to `null`, the caller's fetch effect would see
`debouncedQuery === null` on mount and would need special handling.
Initializing to `value` avoids that dance.

```js
useEffect(() => {
```
Effects run **after** the render is committed to the DOM. Perfect for setting
timers — we don't want the timer scheduled during render (side effects during
render are illegal), we want it scheduled once the render is done.

```js
    const id = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
```
Schedule a timer. When it fires (`delay` ms later, if nothing cancels it), it
updates our state to the current `value`.

Question worth pausing on: **which `value` does the timer see?**

Answer: the `value` from the render that set up this effect. Effects close over
the render's variables. So if the effect was created during a render where
`value === 'reac'`, the timer will set the debounced value to `'reac'` — even
if by the time the timer fires, the "current" `value` in a newer render is
`'reactjs'`.

Now here's the beautiful part: **we don't want the timer to see the latest
value.** We want each timer to remember "when I was scheduled, the input was
`X` — set the debounced value to `X` after silence." If a new keystroke
happens, we cancel this timer *before* it can commit `X`, and a new timer with
the newer value takes over.

The closure isn't a bug here. It's the mechanism.

```js
    return () => clearTimeout(id);
```
The **cleanup function**. React runs this in two situations:

1. **Before the next run of this effect** — i.e., before the effect
   re-executes because a dependency changed.
2. **When the component unmounts.**

That first case is the important one. Here's the actual sequence when the user
types "re":

- Render 1: `value = 'r'`. Effect runs. Timer T1 is scheduled to set debounced
  to `'r'` in 500ms.
- 100ms later, user types 'e'. Render 2: `value = 're'`.
- Before Render 2's effect runs, React invokes Render 1's cleanup →
  `clearTimeout(T1)`. T1 is cancelled — it will *never* fire. Good; we don't
  want debounced to become `'r'`.
- Render 2's effect runs. Timer T2 is scheduled to set debounced to `'re'` in
  500ms.
- If the user stops typing → 500ms later T2 fires → debounced becomes `'re'`.
- If the user types again first → same dance repeats.

That's debouncing, implemented purely through effect cleanup. No manual timer
bookkeeping, no ref, no flags. Just the natural rhythm of effects.

**This is the moment to internalize what "cleanup" means.** It's not garbage
collection. It's not "on unmount." It's: *"undo whatever this effect started,
so the next run of the effect (or the unmount) starts from a clean slate."*
Cleanup fires between effects, not just at the end.

```js
}, [value, delay]);
```
The **dependency array**.

React re-runs the effect only when a dependency has changed from the previous
render (compared by `Object.is`, which is basically strict equality with
special handling for `NaN` and `-0`).

- `value` is here because a new value should start a new timer.
- `delay` is here because if the caller changes the delay at runtime (some UIs
  let users configure "search sensitivity"), we want to respect the new delay.

Common mistake: leaving `delay` out of the deps because "it's basically a
constant." Then the caller changes it, and nothing happens until the *next*
value change — because that's the next time the effect re-runs. Debugging that
is unpleasant. Just include it.

Another common mistake: empty deps `[]`. Then the effect runs once with the
initial `value` and never again. Debounced value never updates. The hook is
broken. If ESLint's `react-hooks/exhaustive-deps` rule is on (turn it on), it
flags this.

```js
return debouncedValue;
```
The caller sees only the debounced state. Not the setter, not the timer, not
the delay — just the lagging value.

---

## 6. Mental model — one render's timeline

Sequence for one keystroke, so you can see effects and cleanup in motion.

Suppose the user has typed "reac" and is about to type "t". Debounced is
currently `''` (they've been typing fast enough that no timer has fired yet).

```
Time  Event
────  ──────────────────────────────────────────────────────────────────
t=0   User types 't'. Input's onChange runs. setQuery('react') is called.
t=0   React schedules a re-render.
t=1   Render N: useDebounce('react', 500) executes.
        - useState returns debouncedValue = '' (unchanged)
        - useEffect body is registered but NOT run yet
        - returns ''
t=2   React commits the render to the DOM.
t=3   React runs cleanup of Render N-1's effect → clearTimeout(prev timer)
t=4   React runs Render N's effect → const id = setTimeout(..., 500)
             ↑ this timer will fire at t=504 IF nothing cancels it
...
t=100 User types 's'. Same dance. Timer from t=4 is cancelled by cleanup.
      New timer scheduled at t≈104.
...
t=604 User has been idle since t=100. The t≈104 timer fires.
      setDebouncedValue('reacts')
t=605 React re-renders. useDebounce returns 'reacts'.
t=606 The consumer's fetch effect sees debouncedQuery changed → fires request.
```

The order — commit, cleanup previous, run current — is the *rule* for
`useEffect`. Not `useLayoutEffect`, which runs synchronously before paint. If
this timing ever confuses you, come back to this diagram.

---

## 7. Edge cases and pitfalls

### Pitfall 1 — Passing objects or arrays as `value`

If you write:

```js
const debouncedFilter = useDebounce({ q: query, page }, 500);
```

You're passing a **new object** to `useDebounce` on every render (object
literals are new references each time). React's dependency comparison uses
`Object.is` — two different object references, even with identical contents,
are considered "changed."

Effect: the timer is reset on *every render*, not just when meaningful data
changes. Debouncing effectively never fires because there's always a new
render happening. Bug.

Fix: debounce **primitive** values (strings, numbers, booleans), or wrap the
object in `useMemo`:

```js
const filter = useMemo(() => ({ q: query, page }), [query, page]);
const debouncedFilter = useDebounce(filter, 500);
```

### Pitfall 2 — The initial value is not "debounced"

On mount, `debouncedValue` equals `value` immediately, because we initialized
it that way. If the caller had a non-empty initial `query` (say, from URL
params), the fetch effect will fire immediately on mount, not after 500ms.
Usually that's what you want. If it isn't, guard the consumer:

```js
useEffect(() => {
  if (!debouncedQuery) return;
  // ...
}, [debouncedQuery]);
```

### Pitfall 3 — Very fast typers and a very short delay

If `delay` is `10ms` and the timer resolution / event loop is loaded, the
timer *can* fire before you finish a fast keystroke burst. Don't use debounce
for sub-50ms delays; you're inside browser event-loop noise. If you truly need
sub-50ms, you probably want `requestAnimationFrame` batching, not debouncing.

### Pitfall 4 — Debounce is not a cancel

If a fetch effect has already fired for the debounced value and the user then
keeps typing, the *in-flight fetch* isn't cancelled by this hook — because the
fetch lives in the *consumer's* effect, not here. Cancelling in-flight
requests is `AbortController` territory (covered when we build `useFetch`).

---

## 8. Expected behavior — a demo you can trace

Assume `delay = 500`.

| Time (ms) | User action | `value` (input state) | `debouncedValue` (hook output) |
|---|---|---|---|
| 0 | mount, initial `""` | `""` | `""` |
| 100 | types "r" | `"r"` | `""` |
| 200 | types "re" | `"re"` | `""` |
| 350 | types "rea" | `"rea"` | `""` |
| 500 | types "reac" | `"reac"` | `""` |
| 700 | types "react" | `"react"` | `""` |
| 1200 | idle (500ms passed) | `"react"` | `"react"` ← updates now |
| 1300 | types "reactj" | `"reactj"` | `"react"` |
| 1400 | types "reactjs" | `"reactjs"` | `"react"` |
| 1900 | idle (500ms passed) | `"reactjs"` | `"reactjs"` ← updates now |

Notice that between t=700 and t=1200, the input value didn't change but the
effect *didn't* re-run either — because the last render was at t=700, its
effect scheduled a timer for t=1200, and no dependency has changed since. The
timer fires naturally.

Two API calls total, not seven. Money saved.

---

## 9. TypeScript version

```ts
// src/hooks/useDebounce.ts
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const id = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(id);
  }, [value, delay]);

  return debouncedValue;
}
```

---

## 10. What was added, and WHY (TS explanations)

### 1. `<T>` — a generic type parameter

- **What it is:** `T` is a placeholder for whatever type the caller's `value`
  is. The same generic idea used in `useLocalStorage`.
- **What it does here:** connects three things — the input parameter's type,
  the internal state's type, and the return type. All three are the same `T`.
- **Bug it prevents:** without a generic, you'd have to pick one concrete
  type. If you typed it as `unknown`, callers would have to narrow the return
  before using it (`if (typeof debounced === 'string')`), which is ugly. With
  `<T>`, `useDebounce('hello', 500)` infers `T = string`,
  `useDebounce(42, 500)` infers `T = number`, and the return type follows
  automatically.
- **Editor benefit:** hover over `debouncedQuery` in the consumer and you'll
  see the exact type. Autocomplete works on it. Passing the wrong type to a
  function that consumes it is caught immediately.

### 2. `value: T`

Ties the input parameter to the generic. When you call
`useDebounce(query, 500)` where `query` is a `string`, TypeScript locks
`T = string` for this call.

### 3. `delay: number`

Prevents `useDebounce(query, '500')` (string) and `useDebounce(query, true)`.
Both would misbehave at runtime — `setTimeout` coerces `'500'` to a number but
throws or hangs on other non-numbers. Catch it at compile time.

### 4. `: T` return annotation

Explicit return type. Two reasons:

- **Public API contract.** Anyone reading the signature sees "input `T`,
  output `T`, they always match." No mental math.
- **Refactor safety.** If someone later changes the function to return
  something else (say, a tuple `[T, () => void]` to add a cancel function),
  the compiler forces them to update the signature — which forces callers to
  notice.

### 5. `useState<T>(value)`

Passing the generic to `useState` explicitly. Not strictly required (TS can
infer `T` from `value`), but it locks in the intent: "this state holds the
same type as the input." If someone later changes the initial value to
something else by accident, the mismatch is caught.

### What TypeScript now gives you at the editor level

- `useDebounce('hi', 500)` → return type inferred as `string`.
- `useDebounce({ q: 'react', page: 1 }, 500)` → return type inferred as
  `{ q: string; page: number }`.
- `useDebounce(query, '500')` → red squiggle:
  `Argument of type 'string' is not assignable to parameter of type 'number'`.
- Refactoring the input type propagates to the return type automatically.
  Rename a field on the input object and the debounced value's type updates
  too.

---

## 11. Recap — the ideas you now own

- **Debouncing = "act after silence."** Different from throttling ("act at
  most once per interval").
- **Debounce the *value*, not the *action*.** Consumers react to the debounced
  value normally.
- **The mechanism is `setTimeout` + effect cleanup.** Each new value schedules
  a timer; the next value's cleanup cancels the previous timer before it can
  commit.
- **Effect closures are a feature here, not a bug.** Each timer remembers the
  value at the moment it was scheduled — exactly what we want.
- **Dependency array must include everything the effect reads** (`value` and
  `delay`), or the timer will use stale inputs.
- **Debouncing objects requires memoization** to avoid resetting the timer on
  every render.

---

## 12. Comprehension check

Answer briefly:

1. Why do we initialize `debouncedValue` with `value` on the first render,
   instead of some placeholder like `null`? What would break if we used
   `null`?
2. Walk through what happens if the user types three keystrokes 100ms apart
   with `delay = 500`. How many timers get created? How many actually fire?
3. Why is `delay` in the dependency array? Give one concrete scenario where
   leaving it out causes a bug.
4. In the TS version, what's the relationship between the input `value`'s type
   and the return type — and what real bug does making them share the generic
   `T` prevent?
