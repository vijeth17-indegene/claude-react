# `useLocalStorage` — From Naive Code to Production Hook

This document captures the full incremental journey of building a `useLocalStorage`
custom hook, including every explanation from the lesson and both design variants
(the effect-based version and the setter-wrapper version).

---

## Table of contents

1. [The scenario — naive version](#1-the-scenario--naive-version)
2. [Feel the pain](#2-feel-the-pain)
3. [Move 1 — Extract into a `use*` function](#3-move-1--extract-into-a-use-function)
4. [Move 2 — Fix "runs every render" with lazy initial state](#4-move-2--fix-runs-every-render-with-lazy-initial-state)
5. [Move 3 — Fix "only handles strings" with JSON](#5-move-3--fix-only-handles-strings-with-json)
6. [Move 4 — Functional updates for free](#6-move-4--functional-updates-for-free)
7. [Final JS version (effect-based)](#7-final-js-version-effect-based)
8. [Line-by-line walkthrough](#8-line-by-line-walkthrough)
9. [Expected behavior](#9-expected-behavior)
10. [Known limitation — cross-tab sync](#10-known-limitation--cross-tab-sync)
11. [TypeScript version of `useLocalStorage`](#11-typescript-version-of-uselocalstorage)
12. [What was added, and WHY (TS explanations)](#12-what-was-added-and-why-ts-explanations)
13. [Alternative design — the setter-wrapper version](#13-alternative-design--the-setter-wrapper-version)
14. [What the setter-wrapper gets RIGHT](#14-what-the-setter-wrapper-gets-right)
15. [What the setter-wrapper gets WRONG](#15-what-the-setter-wrapper-gets-wrong)
16. [Honest comparison table](#16-honest-comparison-table)
17. [So which one is "right"?](#17-so-which-one-is-right)
18. [Reviewer-approved setter-wrapper version](#18-reviewer-approved-setter-wrapper-version)
19. [Bottom line](#19-bottom-line)

---

## 1. The scenario — naive version

Let's say we have a **theme toggle** — light or dark mode. Users hate it when they
refresh the page and their theme resets. So we want to persist it.

The naive approach: use `useState` and manually read/write `localStorage` all over
the component.

```jsx
import { useState, useEffect } from 'react';

function ThemeToggle() {
  const [theme, setTheme] = useState(
    localStorage.getItem('theme') || 'light'
  );

  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
      Current: {theme}
    </button>
  );
}
```

---

## 2. Feel the pain

This "works" but it has four problems, and you need to see all of them before
we extract anything.

### Problem 1 — It runs on every render

Look at `useState(localStorage.getItem('theme') || 'light')`. React only *uses*
the initial value on the first render, but the argument is *evaluated every
render*. That means every re-render calls `localStorage.getItem('theme')`, which
is a synchronous disk read. It gets thrown away every time except the first.
Wasteful.

### Problem 2 — It only handles strings

`localStorage` only stores strings. If you want to persist an object like
`{ name: 'Vijeth', role: 'admin' }`, this pattern silently stores the string
`"[object Object]"`. Then reading it back gives you that broken string, not your
object.

### Problem 3 — Duplication if you persist more than one thing

The moment you add a second persisted value (e.g., `language`, `fontSize`), you
copy-paste this whole pattern. And the moment you need to add error handling
(say, storage is disabled in private browsing), you have to change every copy.

### Problem 4 — It's ugly

You have two lines of `useState` + a `useEffect` for what feels like one concept:
"a state variable that persists." Concepts should map to one API, not three lines
of ritual.

---

## 3. Move 1 — Extract into a `use*` function

Let's start dumb and improve it:

```js
function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(
    localStorage.getItem(key) || initialValue
  );

  useEffect(() => {
    localStorage.setItem(key, value);
  }, [key, value]);

  return [value, setValue];
}
```

Now the component becomes:

```jsx
function ThemeToggle() {
  const [theme, setTheme] = useLocalStorage('theme', 'light');
  return (
    <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
      Current: {theme}
    </button>
  );
}
```

Clean. But we still have Problems 1 and 2 to fix.

---

## 4. Move 2 — Fix "runs every render" with lazy initial state

`useState` has a feature almost nobody uses at first: you can pass it a
**function** instead of a value.

```js
useState(() => expensiveComputation()); // function form — LAZY
useState(expensiveComputation());       // value form — EAGER, runs every render
```

When you pass a function, React calls it **exactly once**, on the first render,
and never again. This is called **lazy initial state** or a **lazy initializer**.

Let's use it:

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

Two things happened:

- The whole read is inside a `() => { ... }` — so it only runs once.
- I changed `|| initialValue` to `stored !== null ? stored : initialValue`.
  Why? Because `localStorage.getItem` returns `null` when the key is missing —
  but the user might legitimately have stored the empty string `""`, and
  `"" || 'light'` would incorrectly fall back to `'light'`. Explicit
  `!== null` is safer.

---

## 5. Move 3 — Fix "only handles strings" with JSON

`localStorage` stores strings, we want to support any JSON-serializable value:

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
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // storage might be full or disabled — swallow silently
    }
  }, [key, value]);

  return [value, setValue];
}
```

Now `useLocalStorage('user', { name: 'Vijeth' })` works. So does
`useLocalStorage('count', 0)` and `useLocalStorage('items', [])`.

The `try/catch` around `JSON.parse` handles the case where someone else
(a browser extension, an old version of your app) wrote garbage to that key.

The `try/catch` around `setItem` handles the case where storage is disabled
(private mode on some browsers, quota exceeded on mobile).

---

## 6. Move 4 — Functional updates for free

Right now, if a caller writes:

```js
setTheme(prev => prev === 'light' ? 'dark' : 'light');
```

…does that work? Actually yes — because we're returning `setValue` directly,
which is React's own `useState` setter, and it natively supports the updater
form. Good — we already have this for free.

---

## 7. Final JS version (effect-based)

```js
// src/hooks/useLocalStorage.js
import { useState, useEffect } from 'react';

export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored !== null ? JSON.parse(stored) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // ignore write failures (private mode / quota)
    }
  }, [key, value]);

  return [value, setValue];
}
```

---

## 8. Line-by-line walkthrough

```js
export function useLocalStorage(key, initialValue) {
```
Two parameters: `key` is the localStorage key, `initialValue` is what to use
if there's nothing stored yet. The signature deliberately mirrors
`useState(initial)` so it feels familiar — good hook API design.

```js
const [value, setValue] = useState(() => {
```
Lazy initializer. The function inside runs **only on mount**, not on every
render. This is where we do our (relatively) expensive `localStorage.getItem`
and JSON parse.

```js
    const stored = localStorage.getItem(key);
    return stored !== null ? JSON.parse(stored) : initialValue;
```
Get the raw string. If it's `null` (key doesn't exist), fall back to
`initialValue`. Otherwise parse it. Explicit `!== null` because empty string
is a valid stored value.

```js
  } catch {
    return initialValue;
  }
```
If storage read fails or the stored JSON is corrupt, act as if nothing was
stored. Fail safe, not loud.

```js
useEffect(() => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch { /* ignore */ }
}, [key, value]);
```
Every time `value` (or `key`) changes, write to storage. Note `key` is in the
deps: if the caller changes the key at runtime, we want to write to the new
location.

```js
return [value, setValue];
```
Return **as an array** — arrays are appropriate when there are exactly one or
two return values with obvious positional meaning. This lets callers write
`const [theme, setTheme] = useLocalStorage(...)`, exactly like `useState`.
That's the whole point: it should *feel* like `useState`.

---

## 9. Expected behavior

- First mount, no stored value → state is `'light'`, and after the effect runs,
  `localStorage.theme === '"light"'` (note the quotes — that's JSON).
- Click the button → state becomes `'dark'`, effect fires, `localStorage.theme`
  updates.
- Refresh the page → state initializes to `'dark'` from storage. No flash of
  the wrong theme.
- Open the app in a second tab and change the theme → the first tab does **not**
  update. (We could fix that with the `storage` event; see the next section.)

---

## 10. Known limitation — cross-tab sync

The version above doesn't listen for changes made in other tabs. Browsers fire
a `storage` event on other tabs when localStorage changes. A production
`useLocalStorage` often adds a second `useEffect` that subscribes to
`window.addEventListener('storage', ...)`. It's left out here to focus on the
core pattern.

---

## 11. TypeScript version of `useLocalStorage`

```ts
// src/hooks/useLocalStorage.ts
import { useState, useEffect, Dispatch, SetStateAction } from 'react';

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, Dispatch<SetStateAction<T>>] {
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
      /* ignore */
    }
  }, [key, value]);

  return [value, setValue];
}
```

---

## 12. What was added, and WHY (TS explanations)

### 1. `<T>` — the generic type parameter

- **What it is:** a **generic** is a placeholder type. `<T>` on the function
  means "this function works with *some* type `T`, and the caller decides
  what `T` is."
- **What it does here:** it links three places — the `initialValue` parameter,
  the state, and the return tuple — so they all share the same type.
- **Bug it prevents:** without a generic, we'd have to pick one concrete type.
  If we typed `initialValue: any`, callers would lose all type safety on the
  value they get back. With `<T>`, calling `useLocalStorage('count', 0)` infers
  `T = number`, and calling `useLocalStorage('user', { name: 'Vijeth' })`
  infers `T = { name: string }`. One hook, correctly typed for every caller.
- **Editor benefit:** hover over `theme` in
  `const [theme, setTheme] = useLocalStorage('theme', 'light')` and you'll see
  `theme: string`. No configuration needed.

### 2. `key: string`

Straightforward, but worth noting: prevents calling `useLocalStorage(42, ...)`.
`localStorage.getItem(42)` would coerce to `"42"` in JS and "kind of work,"
which is the *worst* kind of bug — silent and shape-shifting.

### 3. `initialValue: T`

Ties the initial value to the generic. If you say
`useLocalStorage<number>('count', 'zero')`, that's a compile error — the
initial value must match the declared type.

### 4. `Dispatch<SetStateAction<T>>` — the setter type

Let's break this down because it looks intimidating.

- **`Dispatch<X>`** is React's type for "a function that takes an `X` and
  returns void." It's the type of any state setter.
- **`SetStateAction<T>`** is React's type for "either a `T` (a new value) or a
  function `(prev: T) => T` (an updater)."
- Together: `Dispatch<SetStateAction<T>>` = "a function you can call with either
  a new value of type `T`, or a function that computes the next `T` from the
  previous one." Which is *exactly* what `useState`'s setter is.

- **Why not just `(v: T) => void`?** Because that would tell TypeScript the
  setter only accepts values, not updater functions. Then
  `setTheme(prev => 'dark')` would be a compile error even though it works at
  runtime. Using React's built-in `Dispatch<SetStateAction<T>>` keeps our
  hook's setter API identical to `useState`'s.

- **Bug it prevents:** without it, you'd either lose the updater-form capability
  or accidentally type the setter as `(v: T | ((p: T) => T)) => void` yourself
  and get it slightly wrong. Reusing React's canonical type is the right move.

### 5. `: [T, Dispatch<SetStateAction<T>>]` — the return tuple type

- **Term:** a **tuple** in TypeScript is a fixed-length array where each
  position has its own type. `[string, number]` is a two-element array where
  index 0 is a string and index 1 is a number.
- **What it does:** documents that we return exactly two elements, in that
  order, with those types.
- **Bug it prevents:** without an explicit tuple type, TypeScript would infer
  the return as `(T | Dispatch<SetStateAction<T>>)[]` — an array where each
  element could be *either* type. Then
  `const [theme, setTheme] = useLocalStorage(...)` would give you
  `theme: T | Dispatch<...>` and you'd have to narrow it before using it.
  Explicit tuple → destructured names get exact types.

### 6. `JSON.parse(stored) as T`

- **Term:** `as T` is a **type assertion**. It tells TypeScript "trust me, this
  is a `T`," without any runtime check.
- **Why we need it:** `JSON.parse` returns `any` (technically `unknown` in
  strict modes). We're promising the compiler that whatever's in storage
  matches the shape we expect. Runtime doesn't verify — if the stored data is
  corrupt, our `try/catch` catches it.
- **Honest trade-off:** if you want *real* safety here, you'd validate with
  something like Zod. `as T` is the pragmatic middle ground.

---

## 13. Alternative design — the setter-wrapper version

An alternative to the effect-based sync is to wrap the setter and write to
`localStorage` inline. Here's the version you proposed:

```ts
const setStoredValue = (
  newValue: T | ((prev: T) => T)
) => {
  setValue(prev => {
    const resolved =
      newValue instanceof Function
        ? newValue(prev)
        : newValue;

    try {
      localStorage.setItem(
        key,
        JSON.stringify(resolved)
      );
    } catch {
      // handle storage error
    }

    return resolved;
  });
};
```

### What this version is actually doing

You've replaced the `useEffect`-based sync with a **wrapper around the setter**.
Every time the caller calls `setStoredValue(...)`:

1. It runs a state update via `setValue(prev => ...)`.
2. Inside that updater, it resolves the incoming argument — if it's a function,
   call it with `prev`; otherwise use it as-is.
3. Writes the resolved value to `localStorage` **synchronously, inside the
   updater**.
4. Returns the new value so React commits it to state.

So it collapses "update state" and "write to storage" into one action.

---

## 14. What the setter-wrapper gets RIGHT

### 1. It fixes a subtle bug in the effect version

Look back at the effect version:

```js
useEffect(() => {
  localStorage.setItem(key, JSON.stringify(value));
}, [key, value]);
```

That effect runs **on every mount**, including the first one — which means when
the component mounts, we immediately write to storage even if nothing has
changed. If you already had `{ theme: 'dark' }` in storage, the initial render
reads it, then the effect fires and writes the same value back. Wasteful but
harmless… usually.

But here's the sharper edge: if two components both use
`useLocalStorage('theme', 'light')` and one mounts a millisecond after the
other, the *second* one's initial-mount write can race with the *first* one's
user-triggered update. It's rare but real.

The setter-wrapper version writes **only when the user explicitly sets a
value**. No spurious mount write. That's cleaner semantics.

### 2. Storage is in sync with React state, atomically

In the effect version, there's a tiny window between state changing and the
effect running where React state and localStorage disagree. If something reads
localStorage during that window (say, another hook on the same page), it sees
the old value.

In the setter-wrapper version, by the time `setValue`'s update is committed,
storage is already written. State and storage move together.

### 3. It correctly handles the updater form

The `newValue instanceof Function` check is the right pattern. It lets the
caller do
`setTheme(prev => prev === 'light' ? 'dark' : 'light')`,
and you resolve it inside `setValue`'s updater — which means `prev` is
guaranteed to be the latest committed value. No stale-closure risk.

---

## 15. What the setter-wrapper gets WRONG

Three real issues, ranging from "minor" to "you should care."

### Issue 1 — Side effect inside a `setState` updater. Officially discouraged.

React's docs and React 18+ Strict Mode explicitly warn: **state updater
functions must be pure**. That means:

> No side effects. No I/O. No `localStorage.setItem`. No `console.log` that
> matters. No network calls.

Why? Because React reserves the right to **call the updater more than once** to
check for consistency (this is exactly what Strict Mode does in development —
it double-invokes updaters to surface impure logic). If your updater writes to
localStorage, it gets called twice, and localStorage gets written twice per
update in dev.

In practice, `localStorage.setItem` with the same value twice is idempotent, so
nothing visibly breaks — but you're building on sand. If someone later changes
it to a POST request, or a counter increment, or a log entry, they'll silently
ship a bug.

**Fix, if you want to keep this shape:** resolve the value inside the updater,
but write to storage *outside* it:

```js
const setStoredValue = (newValue) => {
  setValue(prev => {
    const resolved = newValue instanceof Function ? newValue(prev) : newValue;
    // schedule the write to happen after the updater returns
    try {
      localStorage.setItem(key, JSON.stringify(resolved));
    } catch { /* ignore */ }
    return resolved;
  });
};
```

…still impure. To make it actually pure, you'd need to compute the next value
first, write to storage, then set state:

```js
const setStoredValue = (newValue) => {
  setValue(prev => {
    const resolved = newValue instanceof Function ? newValue(prev) : newValue;
    return resolved;
  });
  // But now we don't have `resolved` here without duplicating the logic...
};
```

And that's the real trap: **you need `prev` to compute `resolved`, but you can
only get `prev` inside the updater, where you're not supposed to have side
effects.** There's no clean way out with this pattern.

The effect version sidesteps this entirely: the updater is pure, and the write
happens in an effect, which is exactly where side effects belong.

### Issue 2 — Setter identity changes every render

Compare the two return values:

```js
// Effect version
return [value, setValue]; // setValue is React's own setter — STABLE across renders

// Setter-wrapper version
return [value, setStoredValue]; // setStoredValue is a new function every render
```

React guarantees that the setter from `useState` has a **stable reference** —
same function identity for the entire lifetime of the component. That means
callers can safely put it in dependency arrays, pass it to `React.memo`'d
children, or use it inside `useEffect` without triggering re-runs.

`setStoredValue` is redeclared on every render. So:

```js
const [theme, setTheme] = useLocalStorage('theme', 'light');

useEffect(() => {
  // ...uses setTheme...
}, [setTheme]); // this effect now re-runs on every render
```

**Fix:** wrap it in `useCallback`:

```js
const setStoredValue = useCallback((newValue) => {
  setValue(prev => {
    const resolved = newValue instanceof Function ? newValue(prev) : newValue;
    try {
      localStorage.setItem(key, JSON.stringify(resolved));
    } catch {}
    return resolved;
  });
}, [key]);
```

Now the setter identity is stable as long as `key` doesn't change.

### Issue 3 — Doesn't handle a runtime `key` change cleanly

The effect version:

```js
useEffect(() => {
  localStorage.setItem(key, JSON.stringify(value));
}, [key, value]);
```

If `key` changes (say the caller passes a new key based on the user ID), the
effect writes the current value under the new key. Migration for free.

The setter-wrapper version writes to whatever key is closed over at the moment
`setStoredValue` is called. If the caller changes `key` but nobody calls the
setter, storage never gets updated to the new key. Minor issue, but worth
naming.

---

## 16. Honest comparison table

| | Effect version | Setter-wrapper version |
|---|---|---|
| Purity of state updater | Pure | Impure (side effect inside updater) |
| Setter identity stable | Yes (React's own) | No, unless wrapped in `useCallback` |
| Writes on mount | Yes (usually harmless) | No |
| Writes on `key` change | Yes (migrates automatically) | No |
| Feels like `useState` | Yes | Yes |
| Works with Strict Mode double-invoke | Yes | Writes twice in dev |
| Sync state + storage atomically | No (small gap) | Yes |

---

## 17. So which one is "right"?

Honest answer: **the community is split**. You'll find production libraries
(usehooks-ts, react-use) using both patterns. The setter-wrapper approach is
popular precisely because it feels more direct — no "hidden" effect, storage
updates when the user acts, not on some render cycle you don't control.

Recommendation for teaching and for most production code:

**Prefer the effect version, because it keeps the updater pure and the setter
identity stable — both of which are React's own contracts.** The `useEffect` is
doing exactly what effects are *for*: syncing React state to an external
system.

**But** — if you specifically need atomic state+storage writes (e.g., you're
persisting a session token and another part of the app reads localStorage
directly), the setter-wrapper is legitimate. Just:

1. Wrap it in `useCallback` so the setter is stable.
2. Understand that the updater is technically impure and Strict Mode will
   double-write in dev.
3. Document the choice with a comment so the next reader knows it was
   deliberate.

---

## 18. Reviewer-approved setter-wrapper version

Here's the version worth signing off on in code review if you insist on the
setter-wrapper approach:

```js
import { useState, useCallback } from 'react';

export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored !== null ? JSON.parse(stored) : initialValue;
    } catch {
      return initialValue;
    }
  });

  // NOTE: we intentionally write to storage inside the setter (not a useEffect)
  // so state and storage update atomically. The updater is technically impure;
  // Strict Mode will double-invoke it in dev, which is safe because setItem is idempotent.
  const setStoredValue = useCallback((newValue) => {
    setValue(prev => {
      const resolved = newValue instanceof Function ? newValue(prev) : newValue;
      try {
        localStorage.setItem(key, JSON.stringify(resolved));
      } catch {
        /* storage full or disabled */
      }
      return resolved;
    });
  }, [key]);

  return [value, setStoredValue];
}
```

Two changes from the original setter-wrapper: `useCallback` for setter
stability, and an honest comment about the impurity trade-off.

### TypeScript version of the setter-wrapper

```ts
import { useState, useCallback } from 'react';

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (newValue: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored !== null ? (JSON.parse(stored) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setStoredValue = useCallback(
    (newValue: T | ((prev: T) => T)) => {
      setValue(prev => {
        const resolved =
          newValue instanceof Function
            ? (newValue as (p: T) => T)(prev)
            : newValue;
        try {
          localStorage.setItem(key, JSON.stringify(resolved));
        } catch {
          /* storage full or disabled */
        }
        return resolved;
      });
    },
    [key]
  );

  return [value, setStoredValue];
}
```

---

## 19. Bottom line

The setter-wrapper instinct is good — spotting that a `useEffect` for something
as simple as "write when value changes" feels indirect is exactly the kind of
critical eye that makes hooks better.

The trade-off it makes: React's contract says updaters are pure, and setters
from custom hooks should ideally match `useState`'s stability. The
setter-wrapper gives up both to gain atomicity. Sometimes that trade is worth
it. Sometimes it isn't. Now you know both sides — pick deliberately.
