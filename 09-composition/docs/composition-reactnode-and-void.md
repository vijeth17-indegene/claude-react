# Composition, `ReactNode`, and `() => void` — Explained Simply

This doc covers four related things you'll use in every real React project:

1. **Composition** in simple terms
2. **`ReactNode`** — what it is
3. **`ReactNode` vs `JSX.Element`** — when to use which
4. **`() => void`** — deep dive on this tiny but common function type

---

## 1. Composition in Simple Terms

**Composition = building bigger things by nesting smaller things inside them.**

In React, it means one component wraps or contains another — and the outer component doesn't need to know what's inside. You pass content *into* it.

### The core idea

```tsx
<Box>
  <p>Hello</p>
</Box>
```

`Box` doesn't hardcode `<p>Hello</p>`. It just says "render whatever is passed to me":

```tsx
function Box({ children }: { children: React.ReactNode }) {
  return <div className="box">{children}</div>;
}
```

That's composition. `Box` provides **the container**; the caller provides **the contents**.

### Why it matters

- **One component, many uses.** The same `Box` can wrap a form, a message, an image, a list.
- **No prop explosion.** Instead of `<Box title="..." body="..." footer="..." icon="..." />`, you just pass JSX.
- **Loose coupling.** `Box` doesn't need to know about `<p>`, `<img>`, `<Form>`, etc.

### Three flavors you'll see everywhere

**a) `children` prop** — the most common:
```tsx
<Card>
  <h2>Title</h2>
  <p>Body</p>
</Card>
```

**b) Named slots** — when you need more than one region:
```tsx
<Layout
  header={<Navbar />}
  sidebar={<Menu />}
  content={<ArticleList />}
/>
```

**c) Specialization** — a component that wraps another with defaults:
```tsx
function ErrorDialog({ message }: { message: string }) {
  return (
    <Dialog title="Error">
      <p style={{ color: "red" }}>{message}</p>
    </Dialog>
  );
}
```

### One-line rule

> If you're thinking *"this component should be like that one, but with different content inside,"* — that's composition.

---

## 2. What Is `ReactNode`?

`ReactNode` is a **TypeScript type** that describes **anything React can render**.

### What React can render

React accepts a wide range of things as valid output:

- A string: `"hello"`
- A number: `42`
- A JSX element: `<div />`
- An array of elements: `[<li />, <li />]`
- `null`, `undefined`, `false`, `true` (render nothing)
- A React fragment: `<>...</>`
- A portal

`ReactNode` is the type that covers **all of them**.

### The type (simplified)

```ts
type ReactNode =
  | ReactElement
  | string
  | number
  | Iterable<ReactNode>
  | ReactPortal
  | boolean
  | null
  | undefined;
```

### Where you'll use it

Any prop that accepts renderable content — `children`, `title`, `header`, `label`, etc.

```tsx
type ModalProps = {
  isOpen: boolean;
  title: ReactNode;      // could be a string, an <h2>, an icon + text
  children: ReactNode;   // whatever you want inside the modal
};
```

### Why `ReactNode` (not `string`) for props like `title`?

Because callers should be free to pass anything React can render:

```tsx
<Modal title="Sign in" ... />                      // string
<Modal title={<h2>Sign in</h2>} ... />             // JSX
<Modal title={<><Icon /> Sign in</>} ... />        // fragment
<Modal title={null} ... />                         // nothing
```

If you typed `title: string`, only the first line would work.

---

## 3. `ReactNode` vs `JSX.Element` — With Examples

Both describe "React stuff you can render," but they're **not the same thing**. Choosing wrong causes real TypeScript errors.

### The short version

| Type | Covers | Use for |
|---|---|---|
| `JSX.Element` | **Only a single JSX element** — `<div />`, `<Foo />` | Function component **return values** (sometimes) |
| `ReactNode` | Elements **plus** strings, numbers, arrays, `null`, `undefined`, `false`, fragments | **Props** that accept renderable content, especially `children` |

**`ReactNode` is a superset.** `JSX.Element` is one small piece of it.

### Example 1 — `children` prop

```tsx
// ❌ Too restrictive — breaks for strings and arrays
type Props = { children: JSX.Element };

<Card>Hello</Card>            // ❌ Error: string isn't JSX.Element
<Card>{items.map(...)}</Card> // ❌ Error: array isn't JSX.Element
<Card>{cond && <X />}</Card>  // ❌ Error: false isn't JSX.Element

// ✅ Correct
type Props = { children: React.ReactNode };
```

Every one of the failing lines above works with `ReactNode`.

### Example 2 — component return values

Old convention (still fine, still common):

```tsx
function Greeting(): JSX.Element {
  return <h1>Hi</h1>;
}
```

But this breaks if you sometimes return `null` or a string:

```tsx
// ❌ Type '"hi"' is not assignable to type 'Element'
function Greeting(): JSX.Element {
  if (!name) return null;    // ❌
  return "hi";               // ❌
}

// ✅ Use ReactNode when the component may return non-element values
function Greeting(): React.ReactNode {
  if (!name) return null;
  return "hi";
}
```

Modern practice: **don't annotate the return type at all** and let TS infer it. But when you do, prefer `ReactNode` for flexibility.

### Example 3 — accepting a component vs an element

This is a subtle senior-level distinction:

```tsx
type Props = {
  icon: JSX.Element;   // callers pass an already-rendered element: <Icon />
};

<Header icon={<StarIcon />} />
```

vs.

```tsx
type Props = {
  Icon: React.ComponentType;   // callers pass the component itself: StarIcon
};

<Header Icon={StarIcon} />     // Header decides when/how to render it
```

Both are valid; they express different intent. `ReactNode` sits on the "already rendered" side of that spectrum but is broader than `JSX.Element`.

### Cheat sheet

```
Prop that renders content?           → ReactNode
Return type that might be null/string? → ReactNode
Something guaranteed to be a single element? → JSX.Element (rare)
```

**Default to `ReactNode` unless you have a reason not to.**

---

## 4. Deep Explanation of `() => void`

You see this type everywhere in React — most often on event handler props:

```tsx
type Props = {
  onClose: () => void;
  onSubmit: () => void;
};
```

It looks simple. It has a subtle rule that trips up even experienced devs.

### The literal reading

`() => void`
- `()` — takes **no arguments**
- `=> void` — returns **nothing you should use**

So it means: *"a function you call, don't pass anything to, and don't read the return value of."*

### What `void` really means in TypeScript

In TypeScript, `void` as a **return type** means "the caller must not rely on any return value." It does **not** mean "the function must return `undefined`."

This is the key distinction. Look at this:

```ts
type Callback = () => void;

const cb: Callback = () => 42;   // ✅ Allowed!
```

Wait — the function returns a number, but the type says `void`. Why is that legal?

Because `void` in a callback type is a **promise to the caller, not a constraint on the implementation**. It says: *"whatever this function returns, the code that calls it will ignore it."*

That flexibility is essential. It's why this works:

```tsx
const nums = [1, 2, 3];
nums.forEach(n => console.log(n));
```

`forEach`'s callback is typed `(value: T) => void`. If `void` meant "must return undefined," then `nums.forEach(n => nums.push(n))` would be an error, because `push` returns a number. TypeScript would be unusable.

### The three "return nothing" types — and how they differ

| Type | Meaning | Function may return... |
|---|---|---|
| `void` | "Caller ignores return value" | Anything — value is discarded |
| `undefined` | "Function must actually return `undefined`" | Only `undefined` (or nothing) |
| `never` | "Function never returns at all" | Nothing — throws or infinite loops |

```ts
const a: () => void       = () => 42;         // ✅
const b: () => undefined  = () => 42;         // ❌ 42 isn't undefined
const c: () => never      = () => { throw new Error(); }; // ✅
```

### Why React handlers use `() => void`

```tsx
type ButtonProps = {
  onClick: () => void;
};
```

React calls your handler and ignores whatever it returns. Typing it as `() => void` means callers can safely do this:

```tsx
<Button onClick={() => setCount(count + 1)} />
```

`setCount` returns `undefined` here, but even if it returned something, `void` would let it slide because *React isn't going to use it*.

### The classic gotcha — `async` handlers

```tsx
type Props = { onSubmit: () => void };

// ✅ Allowed by TypeScript
<Form onSubmit={async () => {
  await save();
}} />
```

An `async` function **always returns a `Promise`**, but `() => void` allows it because "the caller ignores the return." This is usually fine — but it means React won't `await` your promise. If the handler throws, the rejection is unhandled.

If you want to force the caller to handle async correctly:

```ts
type Props = { onSubmit: () => Promise<void> };
```

Now non-async handlers are rejected.

### `void` as a parameter type — completely different meaning

Don't confuse:

```ts
type A = () => void;         // function returning "nothing usable"
type B = (x: void) => number; // ❌ almost never what you want
```

`void` as a **parameter type** is rare and mostly a legacy artifact. When you see `void` in TS, 99% of the time it's the return-type meaning.

### Common patterns using `() => void`

```tsx
// Event handlers
type ButtonProps = { onClick: () => void };

// Cleanup functions (returned from useEffect)
useEffect(() => {
  const id = setInterval(tick, 1000);
  return () => clearInterval(id);   // () => void
}, []);

// Callbacks that trigger side effects but produce no result
type ModalProps = { onClose: () => void };

// Timer / animation callbacks
setTimeout(() => console.log("done"), 1000);
```

### Handlers that take arguments

`() => void` takes zero args. If your handler needs data:

```ts
type Props = {
  onSelect: (id: string) => void;
  onChange: (value: string) => void;
  onError:  (err: Error) => void;
};
```

Same `void` rule applies to the return type — the caller ignores whatever comes back.

### Summary

- `() => void` = "a function I'll call with no arguments and whose return value I don't care about."
- `void` in a return type is a **contract to the caller**, not a constraint on the function.
- Prefer `() => void` for **fire-and-forget** callbacks (event handlers, cleanup).
- Use `() => Promise<void>` when the caller should treat the result as async.
- Don't use `() => undefined` unless you truly need to forbid returning anything else — you almost never do.

---

## TL;DR

- **Composition** — build UI by nesting; outer component provides structure, caller provides content via `children` or named slots.
- **`ReactNode`** — the type for "anything React can render." Use it on props like `children`, `title`, `label`.
- **`ReactNode` vs `JSX.Element`** — `ReactNode` is the flexible superset; use it by default. `JSX.Element` covers only a single JSX element.
- **`() => void`** — a callback that takes no args; `void` means "caller ignores the return." That's why returning a value or a Promise from a `() => void` callback is legal.

---

# Interview-Ready Explanations

Framed the way a senior interviewer wants to hear them — crisp definitions, the "why," the trade-offs, and the common follow-up traps.

---

## 1. Composition in React

### The 30-second answer
> Composition is React's core pattern for **reusing UI structure and behavior by nesting components**, rather than through inheritance. A parent component defines a shape or behavior; the caller supplies the content via `children` or named props. React's docs explicitly recommend composition over inheritance.

### Why interviewers ask
They want to hear that you understand **why** React abandoned inheritance and how composition solves problems inheritance introduces.

### The key points to hit
1. **Container / content separation.** The outer component defines *shape, layout, or behavior*; the caller defines *what goes inside*.
2. **`children` is just a prop.** It's not magic — it's the JSX between opening and closing tags, typed as `ReactNode`.
3. **Named slots for multi-region layouts** — `header`, `sidebar`, `footer` as `ReactNode` props.
4. **Specialization** — a component that wraps another with defaults (`ErrorDialog` wrapping `Dialog`).
5. **No prop drilling for one-level pass-through.** If a wrapper takes props only to hand them to a child, use composition — the wrapper stops needing to know about those props.

### Follow-up traps to be ready for

**Q: "Why not inheritance?"**
> Inheritance couples the child to the parent's implementation. Composition keeps them independent — the container has no knowledge of what's inside. A `Card` doesn't care whether it contains a user profile or a pricing tier; adding a new use case doesn't touch `Card` at all.

**Q: "When does composition NOT help?"**
> When siblings need to share state, composition alone doesn't solve it — you lift state up or use context. Composition organizes the tree; it doesn't manage cross-cutting state.

**Q: "What's the difference between composition and prop drilling?"**
> Prop drilling passes data through components that don't need it. Composition avoids that by letting the caller construct the JSX directly, so intermediate components never see the props at all.

**Concrete example to volunteer:**
> "In one refactor I removed three pass-through props from a `MovieGrid` component — `onSelect`, `isFavorite`, `onToggleFavorite`. The grid didn't use any of them; it just funneled them to `MovieCard`. Switching to `<MovieGrid>{movies.map(m => <MovieCard ... />)}</MovieGrid>` reduced its props from four to one (`children`) and made it a pure layout container."

---

## 2. `ReactNode`

### The 30-second answer
> `ReactNode` is the TypeScript type describing **anything React can render** — JSX elements, strings, numbers, arrays, fragments, portals, `null`, `undefined`, and booleans. It's the correct type for the `children` prop and for any prop that accepts renderable content.

### Why interviewers ask
They want to see if you understand the **spectrum of things React accepts as output** and won't over-restrict prop types.

### The type breakdown

```ts
type ReactNode =
  | ReactElement       // <div />, <MyComponent />
  | string             // "hello"
  | number             // 42
  | Iterable<ReactNode>// arrays, generators
  | ReactPortal        // createPortal(...)
  | boolean            // true / false render nothing
  | null               // renders nothing
  | undefined;         // renders nothing
```

### Key insight
> "React accepts a wide range of return values. `ReactNode` is the type that covers **the intersection of what's valid to render and what's valid to pass as children**. If I want maximum flexibility on a prop, that's the type I reach for."

### Follow-up traps

**Q: "Why is `null` a valid `ReactNode` when it renders nothing?"**
> Because React uses `null` as its "render nothing" signal — it's how conditionally rendered branches like `{isLoading && <Spinner />}` work when the condition is false. The result is `false`, which is also a valid `ReactNode` that renders nothing.

**Q: "Can you return a string from a component?"**
> Yes. `function Label() { return "hello"; }` is valid. React unwraps it and renders a text node. That's why `ReactNode` includes `string`.

**Q: "What's `React.ReactChild`?"**
> Deprecated. It was `ReactElement | string | number` — a subset without `null`, arrays, or fragments. Modern code uses `ReactNode`.

---

## 3. `ReactNode` vs `JSX.Element`

### The 30-second answer
> `ReactNode` is the broad type for anything renderable. `JSX.Element` is only a **single JSX element** — no strings, no arrays, no `null`. `ReactNode` is a superset. **Default to `ReactNode` for props; `JSX.Element` is for narrow cases like return types you're sure will always be one element.**

### Why this question comes up
It's a real TypeScript pain point that trips up mid-level devs. Interviewers use it to separate "used TypeScript" from "understood TypeScript."

### The comparison

| | `ReactNode` | `JSX.Element` |
|---|---|---|
| `<div />` | ✅ | ✅ |
| `"hello"` | ✅ | ❌ |
| `42` | ✅ | ❌ |
| `null` / `undefined` | ✅ | ❌ |
| `false` | ✅ | ❌ |
| `[<li />, <li />]` | ✅ | ❌ |
| `<>...</>` (fragment) | ✅ | ✅ (fragments produce a JSX.Element) |

### Concrete failure to mention

```tsx
type Props = { children: JSX.Element };

<Card>Hello</Card>                    // ❌ string
<Card>{items.map(...)}</Card>         // ❌ array
<Card>{isReady && <X />}</Card>       // ❌ false
```

> "If I saw `children: JSX.Element` in a code review, that's usually a bug. The moment someone tries to conditionally render or map, TypeScript rejects it."

### Follow-up traps

**Q: "When is `JSX.Element` the right choice?"**
> Rare. Mostly for explicit return type annotations on a component you know always returns a single element. Even then, most teams just omit the return type and let TS infer it.

**Q: "What about `React.ReactElement`?"**
> `JSX.Element` is basically an alias for `ReactElement<any, any>` in most setups. In practice they're interchangeable for typical React code. The distinction matters more if you're building a UI library that inspects element types.

**Q: "What's the difference between accepting a rendered element vs a component?"**
> `icon: ReactNode` — caller passes `<StarIcon />`, already rendered. `Icon: ComponentType` — caller passes `StarIcon`, and the parent decides when to render. Different intent, both valid.

---

## 4. `() => void` — the deep one

### The 30-second answer
> `() => void` is a function type that takes no arguments. The `void` return type means **"the caller ignores whatever this function returns"** — it does *not* mean "the function must return `undefined`." That flexibility is intentional and is what lets React event handlers accept any function without complaint.

### Why this trips people up
Because it seems simple. Then the interviewer asks why this compiles:

```ts
const cb: () => void = () => 42;   // ✅ Legal
```

And most candidates freeze.

### The key insight — memorize this
> **`void` in a callback's return type is a contract with the caller, not with the implementation.** It says "I won't use your return value." The function is still free to return whatever it wants.

### Why the language works this way
Because otherwise this would fail:

```ts
[1, 2, 3].forEach(n => arr.push(n));  // push returns a number
```

`forEach`'s callback is `(value: T) => void`. If `void` meant "must return undefined," half the standard library would be unusable. So TS deliberately relaxes the rule for `void` in callback contexts.

### The three "returns nothing" types

| Type | Meaning | Function may return |
|---|---|---|
| `void` | "Caller ignores return" | Anything |
| `undefined` | "Must return `undefined`" | Only `undefined` (or nothing) |
| `never` | "Function never completes" | Nothing — throws or infinite loops |

### The async gotcha — this is the killer follow-up

```ts
type Props = { onSubmit: () => void };

<Form onSubmit={async () => { await save(); }} />  // ✅ TS allows it
```

An `async` function always returns a `Promise`, but `() => void` accepts it because the caller "ignores the return."

> **The problem:** React doesn't `await` your promise. If `save()` rejects, the rejection is silently unhandled. In a production app that's a real bug.

**The fix if you want to force async handling:**

```ts
type Props = { onSubmit: () => Promise<void> };
```

Now non-async handlers fail type-checking.

### Where you'll see `() => void` in real React code

```tsx
onClick: () => void                     // event handlers
onClose: () => void                     // modal / dropdown callbacks
useEffect(() => { return () => {...} }) // cleanup functions
setTimeout(() => {...}, 1000)           // timers
```

### Follow-up traps

**Q: "What's the difference between `() => void` and `() => undefined`?"**
> `() => undefined` **requires** the function body to actually resolve to `undefined`. It rejects `() => 42` and even `() => "hello"`. `() => void` accepts them all. Use `undefined` only when you specifically want to forbid a return value — rare.

**Q: "Is there a difference between `void` and `never`?"**
> Yes. `void` means "returns normally, caller ignores result." `never` means "never returns normally at all" — the function throws or loops forever. `never` is a subtype of every type; `void` is not.

**Q: "Can `void` be used as a parameter type?"**
> Technically yes, but it's almost never useful. `(x: void) => number` accepts only `undefined` as the argument. It's a TypeScript oddity — 99% of the time `void` you see is a return type.

---

## Quick-fire practice — say these out loud

- **"Composition = container + slots. The container owns shape and behavior; the caller owns content."**
- **"`ReactNode` is 'anything renderable'; use it for `children` and any content-shaped prop."**
- **"`JSX.Element` is a single element. `ReactNode` is the superset. Default to `ReactNode` unless you have a reason."**
- **"`void` in a return type is a contract to the caller: 'ignore my return.' The function itself can return anything."**
- **"That's why `async () => await save()` type-checks as `() => void` — and why it silently swallows rejections."**

Those five sentences will carry you through 90% of interview questions on these topics.
