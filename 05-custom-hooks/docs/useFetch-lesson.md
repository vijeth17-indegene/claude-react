# `useFetch` — From Naive Code to Production Hook

Phase 4 of the custom hooks lesson. Building `useFetch` incrementally: we start
with a naive fetch inside a component, then add loading state, error state,
cleanup on unmount, race-condition protection, and finally `AbortController`.
Each problem is explained **before** we fix it, so the code grows for a reason.

---

## Table of contents

1. [What `useFetch` needs to do — the honest scope](#1-what-usefetch-needs-to-do--the-honest-scope)
2. [The naive version — no hook, no state](#2-the-naive-version--no-hook-no-state)
3. [Move 1 — Adding loading state](#3-move-1--adding-loading-state)
4. [Move 2 — Adding error state](#4-move-2--adding-error-state)
5. [Move 3 — Extract into `useFetch`](#5-move-3--extract-into-usefetch)
6. [Move 4 — The unmount bug (`Can't perform a React state update…`)](#6-move-4--the-unmount-bug-cant-perform-a-react-state-update)
7. [Move 5 — The race condition (stale response wins)](#7-move-5--the-race-condition-stale-response-wins)
8. [Move 6 — `AbortController` (cancel the request itself)](#8-move-6--abortcontroller-cancel-the-request-itself)
9. [Final JS version](#9-final-js-version)
10. [Line-by-line walkthrough](#10-line-by-line-walkthrough)
11. [Expected behavior](#11-expected-behavior)
12. [TypeScript version](#12-typescript-version)
13. [What was added, and WHY (TS explanations)](#13-what-was-added-and-why-ts-explanations)
14. [Recap — the ideas you now own](#14-recap--the-ideas-you-now-own)
15. [Comprehension check](#15-comprehension-check)

---

## 1. What `useFetch` needs to do — the honest scope

Before we write anything, let's be precise about what we're building. "Fetch
some data" is not a single problem — it's a bundle of problems that appear one
after the other.

A production-grade fetch hook needs to answer:

1. **Where's the data?** (`data`)
2. **Are we still waiting?** (`loading`)
3. **Did it fail? Why?** (`error`)
4. **What happens if the component unmounts before the response arrives?**
   (memory leak / warning)
5. **What if the URL changes while a request is in flight — can the old
   response overwrite the new one?** (race condition)
6. **What if we want to cancel the network request itself, not just ignore
   its response?** (`AbortController`)

We'll add each of these one at a time, in that order. If your instinct is "why
not just write the final version?" — because you won't understand *why* it
looks the way it does. Every piece of the final code exists to solve a
specific bug. Skipping the bug means the fix looks arbitrary.

Out of scope (deliberately): caching, revalidation, retries, pagination,
mutation. Those are what libraries like React Query and SWR are for. We're
building the *foundations* those libraries are built on.

---

## 2. The naive version — no hook, no state

Let's start with the simplest thing that could possibly work. A component that
loads a user profile by ID:

```jsx
import { useEffect } from 'react';

function UserProfile({ userId }) {
  useEffect(() => {
    fetch(`/api/users/${userId}`)
      .then(r => r.json())
      .then(user => console.log(user));
  }, [userId]);

  return <div>...</div>;
}
```

This "works" — a request goes out, the response gets logged. But it's useless
because the data never reaches the UI. We need state. Let's add it.

---

## 3. Move 1 — Adding loading state

First problem: even a two-second network request leaves the user staring at
nothing. We need to *show* that we're loading.

```jsx
import { useState, useEffect } from 'react';

function UserProfile({ userId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/users/${userId}`)
      .then(r => r.json())
      .then(user => {
        setData(user);
        setLoading(false);
      });
  }, [userId]);

  if (loading) return <div>Loading…</div>;
  return <div>Hello {data.name}</div>;
}
```

Two important details in this move:

- **`loading` starts as `true`, not `false`.** On the very first render, before
  the effect has even run, we're conceptually already loading. Starting at
  `false` would flash "no data" for one frame before switching to loading.
- **We call `setLoading(true)` at the top of the effect too.** If `userId`
  changes later, we want to re-enter the loading state, not keep showing the
  old user while the new one is fetching.

But there's still a hole: what if the request fails?

---

## 4. Move 2 — Adding error state

If the server returns 500, or the network is down, or the JSON is corrupt,
the promise rejects and our component crashes silently — `data` stays `null`,
`loading` stays `false`, and the user sees `data.name` blow up with
`Cannot read properties of null`.

```jsx
function UserProfile({ userId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    fetch(`/api/users/${userId}`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(user => {
        setData(user);
        setLoading(false);
      })
      .catch(err => {
        setError(err);
        setLoading(false);
      });
  }, [userId]);

  if (loading) return <div>Loading…</div>;
  if (error)   return <div>Failed: {error.message}</div>;
  return <div>Hello {data.name}</div>;
}
```

Two things worth naming here, because most tutorials get them wrong:

### Why `if (!r.ok) throw`?

**`fetch` does not reject on HTTP errors.** A `404` or `500` still resolves —
`response.ok` is `false`, but the promise chain continues happily. So you must
manually check `r.ok` and throw. Otherwise a 500 sails through `.then` and you
try to parse the HTML error page as JSON, get a *different* error later, and
spend an hour debugging.

### Why reset `error` at the top of the effect?

If a previous fetch failed and then `userId` changes, we don't want the old
error message hanging around while the new request is in flight. Reset it.

We now have three state variables that always move together: `data`, `loading`,
`error`. That's our clue to extract.

---

## 5. Move 3 — Extract into `useFetch`

Time to lift this into a hook. First cut:

```js
import { useState, useEffect } from 'react';

function useFetch(url) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    fetch(url)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(err => {
        setError(err);
        setLoading(false);
      });
  }, [url]);

  return { data, loading, error };
}
```

Consumer becomes wonderfully small:

```jsx
function UserProfile({ userId }) {
  const { data, loading, error } = useFetch(`/api/users/${userId}`);

  if (loading) return <div>Loading…</div>;
  if (error)   return <div>Failed: {error.message}</div>;
  return <div>Hello {data.name}</div>;
}
```

We return an **object** rather than an array — three named things, callers may
want any subset. Same rule from Phase 2.

But this hook still has two lurking bugs. They're subtle, they don't show up
on the happy path, and they're the difference between "works in a demo" and
"works in production."

---

## 6. Move 4 — The unmount bug (`Can't perform a React state update…`)

Scenario:

1. `UserProfile` mounts with `userId = 1`. Request goes out.
2. Before the response arrives, the user navigates away. `UserProfile`
   unmounts.
3. 200ms later, the response comes back. The `.then` handler tries to call
   `setData(...)` on an unmounted component.

You get a console warning (or in some setups, a real error):

> Warning: Can't perform a React state update on an unmounted component.

More importantly, you're **holding onto memory the component was supposed to
release** — the state setters, closures, and any DOM references captured in the
promise chain.

### The fix — track "am I still mounted?" with a flag in cleanup

```js
useEffect(() => {
  let cancelled = false;

  setLoading(true);
  setError(null);

  fetch(url)
    .then(r => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    })
    .then(json => {
      if (cancelled) return;
      setData(json);
      setLoading(false);
    })
    .catch(err => {
      if (cancelled) return;
      setError(err);
      setLoading(false);
    });

  return () => {
    cancelled = true;
  };
}, [url]);
```

### Why this works

`let cancelled = false` is a **local variable** inside the effect. It gets
**captured by closure** in the `.then` and `.catch` handlers — they don't read
from React state, they read from that specific effect run's local variable.

When the component unmounts (or the effect re-runs because `url` changed),
React invokes the cleanup function. Cleanup flips `cancelled = true`. The
in-flight promise still resolves later, but its handlers now bail out early
because their captured `cancelled` is `true`.

This is closure being used *deliberately* — same idea as `useDebounce`, where
the closure was the mechanism, not the bug.

### Question worth pausing on: why not a ref?

You *could* use `useRef` for the same job. A local `let` inside the effect is
cleaner here because:

- Each effect run gets its **own** `cancelled` flag. Old effect runs bail out
  independently of newer ones — perfect for our race-condition fix in the
  next move.
- A single ref across all runs would need to be reset carefully at the start
  of each effect, which is another line of code and another chance to get it
  wrong.

Rule of thumb: **use `let` when the value is scoped to one effect run; use
`useRef` when the value needs to persist across renders/effects.**

---

## 7. Move 5 — The race condition (stale response wins)

This is the bug most tutorials skip. It matters more than you'd think.

Scenario:

1. User searches for "react". Request A goes out for `/api/search?q=react`.
2. 50ms later, before A responds, user types more → search is now "reactjs".
   `url` changes.
3. React cleans up the old effect (`cancelled = true` for A) and starts a new
   effect. Request B goes out for `/api/search?q=reactjs`.
4. **Request B is fast, responds in 100ms.** Sets state → user sees results
   for "reactjs". Correct.
5. **Request A was slow, responds in 400ms.**

Wait — but we set `cancelled = true` for A when the effect re-ran, right?
Correct. A's handlers bail out. So A can *not* overwrite B's data.

**So the `cancelled` flag from Move 4 also solves this.** Two different bugs
(unmount, race) — one mechanism.

Let me draw it, because seeing it once is worth a thousand words:

```
t=0    Effect run 1 starts. cancelled_1 = false. Request A fires.
t=50   URL changes. React runs cleanup of run 1 → cancelled_1 = true.
       Effect run 2 starts. cancelled_2 = false. Request B fires.
t=150  Request B resolves.
        - handler reads cancelled_2 (still false)  → setState(B). ✔
t=400  Request A resolves (late).
        - handler reads cancelled_1 (true)         → bail out.   ✔ no stale write
```

Same for unmount:

```
t=0    Effect run 1 starts. cancelled_1 = false. Request A fires.
t=50   Component unmounts. React runs cleanup → cancelled_1 = true.
t=400  Request A resolves.
        - handler reads cancelled_1 (true) → bail out. ✔ no state update on
                                                        unmounted component.
```

That's a lot of value from one `let cancelled = false`.

### But the network request itself is still happening

Even though we've ignored the response, the browser still spent bandwidth
downloading it, the server still spent CPU generating it, and if the user
kept typing, we could have five in-flight requests we're going to ignore.
Wasteful. That's what `AbortController` fixes.

---

## 8. Move 6 — `AbortController` (cancel the request itself)

`AbortController` is a browser API for cancelling async operations. It has two
parts:

- **`AbortController`** — the "remote control." Has an `abort()` method and a
  `.signal` property.
- **`AbortSignal`** — the "receiver." You pass it into `fetch`, and when
  `abort()` is called, the fetch rejects with an `AbortError`.

Usage:

```js
const controller = new AbortController();
fetch(url, { signal: controller.signal });
// later…
controller.abort(); // fetch rejects with AbortError
```

Let's wire it into our hook:

```js
useEffect(() => {
  const controller = new AbortController();

  setLoading(true);
  setError(null);

  fetch(url, { signal: controller.signal })
    .then(r => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    })
    .then(json => {
      setData(json);
      setLoading(false);
    })
    .catch(err => {
      if (err.name === 'AbortError') return; // cancellation, not a real error
      setError(err);
      setLoading(false);
    });

  return () => {
    controller.abort();
  };
}, [url]);
```

### What changed and why

- **`new AbortController()` inside the effect.** One controller per effect
  run. When the effect re-runs (URL changed) or the component unmounts, cleanup
  fires `controller.abort()` — the browser cancels the in-flight fetch, freeing
  the socket.
- **`fetch(url, { signal: controller.signal })`** — hand the signal to `fetch`.
- **`if (err.name === 'AbortError') return;`** — when we abort, the promise
  rejects with an error whose `name` is `'AbortError'`. That's not a real
  failure, that's us cancelling ourselves. We must silently ignore it,
  otherwise the UI shows "Failed: The user aborted a request" every time the
  URL changes. Very confusing.

### Do we still need the `cancelled` flag?

Now, here's a nuance most articles get wrong: **`AbortController` doesn't
replace the mount/race guard 100%.**

- If the fetch is *already* resolved and its `.then` handlers are already
  scheduled in the microtask queue, calling `abort()` in cleanup **does not**
  un-schedule them. They still run.
- Between the fetch resolving and `setData` executing, cleanup may already
  have flipped things.

In practice, the `AbortError` catch handles most cases, but a defensive
production hook often keeps *both*: the abort (to cancel the network) and a
mounted flag (to guard the state updates). We'll include both in the final
version.

---

## 9. Final JS version

```js
// src/hooks/useFetch.js
import { useState, useEffect } from 'react';

export function useFetch(url, options) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    setLoading(true);
    setError(null);

    fetch(url, { ...options, signal: controller.signal })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(json => {
        if (cancelled) return;
        setData(json);
        setLoading(false);
      })
      .catch(err => {
        if (cancelled) return;
        if (err.name === 'AbortError') return;
        setError(err);
        setLoading(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [url]);

  return { data, loading, error };
}
```

> **Caveat about `options`:** we intentionally left `options` out of the
> dependency array. If you pass `useFetch(url, { headers: { ... } })`, the
> `options` object is a new reference on every render — including it in the
> deps would re-run the effect on every render (see the `useDebounce` object
> pitfall). Callers should memoize `options` with `useMemo`, or we should
> deep-compare, or accept `options` only via a ref. This is the same
> trade-off React Query wrestles with. For our teaching hook, we accept the
> limitation and document it: **memoize `options` on the caller side.**

---

## 10. Line-by-line walkthrough

```js
export function useFetch(url, options) {
```
Two parameters. `url` is required. `options` is optional and passes straight
through to `fetch` (headers, method, body). This mirrors the native `fetch`
signature, which callers already know.

```js
const [data, setData]       = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError]     = useState(null);
```
Three pieces of state that move together. `data` starts `null` (no data yet).
`loading` starts `true` (we begin in the loading state — no flash). `error`
starts `null` (no error yet).

```js
useEffect(() => {
  let cancelled = false;
  const controller = new AbortController();
```
`cancelled` is our closure-captured flag for guarding state updates.
`controller` is our handle for aborting the actual network request. Both are
scoped to this one effect run — each run gets its own pair.

```js
  setLoading(true);
  setError(null);
```
Reset the "loading" and "error" indicators every time we start a new request.
Necessary when `url` changes — otherwise a previous error would linger, or the
UI would show old data as if it's still fresh.

```js
  fetch(url, { ...options, signal: controller.signal })
```
Kick off the request. We spread `options` in first so the caller's options are
honored, then set `signal` last so the caller can't accidentally override our
cancellation wiring.

```js
    .then(r => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    })
```
The critical `!r.ok` check. `fetch` doesn't reject on HTTP errors, so we
convert them into thrown errors that the `.catch` will catch. Then parse the
body as JSON.

```js
    .then(json => {
      if (cancelled) return;
      setData(json);
      setLoading(false);
    })
```
Success. Before touching state, check `cancelled`. If the effect was cleaned
up (unmount or `url` change), bail out silently. Otherwise commit the data and
end loading.

```js
    .catch(err => {
      if (cancelled) return;
      if (err.name === 'AbortError') return;
      setError(err);
      setLoading(false);
    });
```
Failure path. Same `cancelled` guard. Additionally, if the error is our own
`AbortError`, treat it as "we cancelled, not a real failure" and stay silent.
Otherwise expose the error and end loading.

```js
  return () => {
    cancelled = true;
    controller.abort();
  };
}, [url]);
```
Cleanup. Flip the flag (guards state updates from the promise chain). Abort
the controller (cancels the in-flight network request). Two lines, two
different bugs solved.

Dependency array: only `url`. Not `options`, for the memoization reason
described above.

```js
return { data, loading, error };
```
Object with three named fields. Consumer destructures whichever ones they
need.

---

## 11. Expected behavior

Given `<UserProfile userId={1} />` mounted, then quickly changed to `userId={2}`:

| Time | What happens internally | What user sees |
|---|---|---|
| t=0 | Mount. Effect run #1. `cancelled_1=false`, controller A. Request A fires for `/api/users/1`. | "Loading…" |
| t=50 | Prop change to `userId=2`. Cleanup of run #1: `cancelled_1=true`, `controller.abort()` on A. Request A is cancelled — server never even bothers to finish. | "Loading…" |
| t=51 | Effect run #2. `cancelled_2=false`, controller B. Request B fires for `/api/users/2`. | "Loading…" |
| t=150 | Request B resolves. Handler reads `cancelled_2` (false), calls `setData(userB)`, `setLoading(false)`. | "Hello Bob" |

Compare to the naive version: Request A would have gone through, arrived
later, and either (a) overwritten Bob with Alice (race condition), or (b)
thrown a warning if the component unmounted.

Second scenario — user closes the page during load:

| Time | What happens | Result |
|---|---|---|
| t=0 | Mount, effect runs, request fires. | Loading… |
| t=100 | User navigates away. Unmount. Cleanup fires: `cancelled=true`, abort. | Component gone. |
| t=300 | Request would have resolved. Both `cancelled` and `AbortError` guards fire. | No state update. No warning. Clean. |

---

## 12. TypeScript version

```ts
// src/hooks/useFetch.ts
import { useState, useEffect } from 'react';

interface UseFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export function useFetch<T>(
  url: string,
  options?: RequestInit
): UseFetchResult<T> {
  const [data, setData]       = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError]     = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    setLoading(true);
    setError(null);

    fetch(url, { ...options, signal: controller.signal })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<T>;
      })
      .then(json => {
        if (cancelled) return;
        setData(json);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof Error && err.name === 'AbortError') return;
        setError(err instanceof Error ? err : new Error(String(err)));
        setLoading(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [url]);

  return { data, loading, error };
}
```

Consumer example, showing type-driven autocomplete:

```ts
interface User { id: number; name: string; email: string; }

function UserProfile({ userId }: { userId: number }) {
  const { data, loading, error } = useFetch<User>(`/api/users/${userId}`);
  //          ^ inferred as User | null

  if (loading) return <div>Loading…</div>;
  if (error)   return <div>Failed: {error.message}</div>;
  if (!data)   return null; // TS forces this null-check; see below.
  return <div>Hello {data.name}</div>;
}
```

---

## 13. What was added, and WHY (TS explanations)

### 1. `<T>` — the generic response type

- **What it is:** a generic type parameter. The caller decides what shape the
  JSON response has.
- **Where it flows:** into `data` (typed as `T | null`), and into the JSON
  parse (`r.json() as Promise<T>`), and out through the return type.
- **Bug it prevents:** without a generic, `data` would have to be typed as
  `unknown` or `any`. `any` gives you no autocomplete on `data.name` and no
  errors when you typo `data.nmae`. `unknown` forces the caller to narrow
  before using anything. Generic gives you both safety *and* ergonomics.
- **Editor benefit:** call `useFetch<User>(url)` and hover `data` — it's
  `User | null`. Autocomplete on `data.` shows `id`, `name`, `email`.

### 2. `url: string`

Prevents `useFetch(42)`. Not a common mistake, but the type is essentially
free and blocks entire classes of coercion bugs.

### 3. `options?: RequestInit`

- **Term:** `RequestInit` is TypeScript's built-in type for the second
  argument to `fetch` — headers, method, body, signal, cache, credentials,
  etc. It's provided by TS's DOM lib.
- **Why `?`:** the `?` makes it optional. `useFetch(url)` works;
  `useFetch(url, { method: 'POST' })` also works.
- **Bug it prevents:** passing garbage as options. If you write
  `useFetch(url, { methd: 'POST' })` (typo), TS flags it — `methd` isn't a
  valid `RequestInit` key.

### 4. `interface UseFetchResult<T>` — the return-shape contract

- **What it is:** an interface with a generic. Same idea as
  `UseToggleReturn` from Phase 2, but parameterized by `T`.
- **Why bake `T` into the interface:** so the caller only writes the type
  parameter once. `useFetch<User>(url)` produces
  `UseFetchResult<User>`, which is `{ data: User | null; loading: boolean;
  error: Error | null }`. All three fields carry the right type.
- **Bug it prevents:** if we return the wrong shape (say, forget `error`),
  the compiler catches it at the return statement, not later at some
  destructuring site. Same argument as always: annotate the public API
  explicitly.

### 5. `data: T | null` — the union

- **Why `| null`:** at first render, before the fetch has resolved, `data`
  really is `null`. Being honest about that in the type forces every consumer
  to null-check before touching `data.name`.
- **Bug it prevents:** without `| null`, TS would let you write `data.name`
  during loading, and you'd get a runtime `Cannot read properties of null`.
  With `| null`, TS refuses `data.name` until you've narrowed the type with
  something like `if (!data) return null;` or checked `loading` first.

### 6. `error: Error | null` and `catch((err: unknown) => ...)`

- **Why `unknown` on the catch:** as of TypeScript 4.4, catch clauses default
  to `unknown`, which is the most honest type — you truly don't know what got
  thrown. It could be an `Error`, a string, `null`, whatever.
- **The narrowing dance:**
  ```ts
  if (err instanceof Error && err.name === 'AbortError') return;
  setError(err instanceof Error ? err : new Error(String(err)));
  ```
  We check `err instanceof Error` before touching `.name` (otherwise TS
  refuses, because `.name` doesn't exist on `unknown`). And when we set state,
  we normalize non-Error throws into `new Error(String(err))` so `error` is
  always an `Error`, never something weird.
- **Bug it prevents:** callers reading `error.message` will always get a real
  string, not `undefined`. Whatever weirdness the network layer throws, the
  hook's contract stays clean.

### 7. `r.json() as Promise<T>` — the parse assertion

- **What it is:** a type assertion. `Response.json()` returns `Promise<any>`
  in the DOM types. We're promising the compiler "the JSON body matches `T`."
- **Runtime reality:** no runtime check. If the server returns garbage that
  doesn't match `T`, TS won't help you — you'll get runtime errors when you
  try to use fields that aren't there.
- **When to worry:** if the API is under your control, this is fine — you
  own both sides of the contract. If it isn't, use Zod or Valibot to parse
  and validate the response, then the return type flows from the validator.
  That's beyond this lesson but worth naming.

### 8. Explicit `useState<T | null>(null)` etc.

Not strictly required — TS can often infer these. Explicit is safer for
exported hooks because it locks the intent: `data` will always be `T` or
`null`, never `undefined` or `T | undefined`.

### What TypeScript now gives you at the editor level

- `useFetch<User>(url)` → destructured `data` is `User | null`, autocomplete
  works after narrowing.
- Try `useFetch<User>(url).data.name` without the null check → red squiggle:
  `'data' is possibly 'null'`.
- Typo `data.nmae` → red squiggle: `Property 'nmae' does not exist on type
  'User'`.
- Pass `useFetch(url, { methd: 'POST' })` → red squiggle on the misspelled
  key.
- Read `error.mesage` → red squiggle on the typo, thanks to `Error | null`.

---

## 14. Recap — the ideas you now own

- **`fetch` doesn't reject on HTTP errors.** You must check `response.ok` and
  throw manually. Otherwise 500s masquerade as success.
- **Loading state starts `true`.** No flash of "no data" before the first
  effect runs.
- **`let cancelled = false` inside the effect** is a per-run closure flag that
  guards state updates from unmount and race conditions with one mechanism.
- **`AbortController` cancels the network request itself,** freeing sockets
  and bandwidth. Its `AbortError` must be silently ignored in `.catch`.
- **Keep both `cancelled` and `abort`.** They cover slightly different windows
  in the lifecycle.
- **Object identity in `options` is a trap.** Either leave it out of deps
  (with a documented caveat), or force callers to memoize. Don't put a raw
  `options` in deps — the effect will loop.
- **In TypeScript, `<T>` for the response type + `Error | null` for the error
  + `T | null` for the data gives callers a fully-typed hook with no
  guesswork.**

---

## 15. Comprehension check

Answer briefly:

1. Why do we throw manually on `!response.ok` inside our `.then`? What real
   bug does this catch that most tutorials miss?
2. Explain how a single `let cancelled = false` inside the effect solves
   *both* the unmount warning and the race condition where a slow request
   overwrites a fast one.
3. What's the difference between the `cancelled` flag and `AbortController`?
   Do we need both? Why?
4. In the TS version, `data` is typed as `T | null`. What would go wrong if
   we typed it as just `T`? Give a concrete runtime error the current typing
   prevents.
5. Why is `options` deliberately NOT in the dependency array, and what's the
   trade-off that decision creates?
