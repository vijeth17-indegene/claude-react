# Event Bubbling and Event Capturing in JavaScript

When you click a button that sits inside a `<div>` that sits inside a `<section>`, **all three elements** technically "see" the click. The browser has to decide the order in which they see it. That order is called **event propagation**, and it has two phases:

1. **Capturing phase** — the event travels **down** from the root (`window` → `document` → `<html>` → … → target).
2. **Bubbling phase** — the event travels **back up** from the target to the root.

The element you actually clicked is called the **target**, and it sits in the middle.

```
                        window
                          │  ▲
                          ▼  │
                       document
                          │  ▲
                          ▼  │
                        <html>
                          │  ▲
                          ▼  │
                        <body>
                          │  ▲
                          ▼  │
                       <section>
                          │  ▲
                          ▼  │
                        <div>
                          │  ▲
                          ▼  │
                       <button>  ← target
       ─────────────►     ●     ◄─────────────
        capturing                  bubbling
        (down)                      (up)
```

---

## 1. Bubbling (the default)

By default, event listeners fire during the **bubbling** phase.

```html
<section id="outer">
  <div id="middle">
    <button id="inner">Click me</button>
  </div>
</section>
```

```js
document.getElementById("outer").addEventListener("click", () => console.log("outer"));
document.getElementById("middle").addEventListener("click", () => console.log("middle"));
document.getElementById("inner").addEventListener("click", () => console.log("inner"));
```

Click the button → console shows:

```
inner
middle
outer
```

The click starts at the button and **bubbles up** through its ancestors. Each ancestor's listener runs on the way up.

> Think of it like dropping a pebble into water — the ripple starts at the point of impact and spreads outward.

---

## 2. Capturing (opt-in)

Capturing is the opposite direction: outer → inner. You have to explicitly ask for it by passing `true` (or `{ capture: true }`) as the third argument to `addEventListener`.

```js
document.getElementById("outer").addEventListener("click", () => console.log("outer"), true);
document.getElementById("middle").addEventListener("click", () => console.log("middle"), true);
document.getElementById("inner").addEventListener("click", () => console.log("inner"), true);
```

Click the button → console shows:

```
outer
middle
inner
```

The event travels **down** first, and each capturing listener runs on the way down.

---

## 3. Both phases together

If some listeners capture and others bubble, the order is always:

1. All **capturing** listeners (outer → inner)
2. The **target** itself
3. All **bubbling** listeners (inner → outer)

```js
outer.addEventListener("click", () => console.log("outer capture"), true);
outer.addEventListener("click", () => console.log("outer bubble"));

inner.addEventListener("click", () => console.log("inner"));
```

Click → output:

```
outer capture
inner
outer bubble
```

---

## 4. Stopping propagation

You can halt the journey mid-way.

### `event.stopPropagation()`
Stops the event from reaching any *further* elements in either direction.

```js
inner.addEventListener("click", (e) => {
  e.stopPropagation();
  console.log("inner");
});
// "outer" will NOT log — the event never bubbles up to it.
```

### `event.stopImmediatePropagation()`
Same as above, **plus** it prevents any *other listeners on the same element* from running.

### `event.preventDefault()`
Different thing — it doesn't stop propagation, it stops the browser's **default action** (e.g. form submission, link navigation).

| Method                         | Stops other elements? | Stops other listeners on same element? | Stops default browser action? |
| ------------------------------ | :-------------------: | :------------------------------------: | :---------------------------: |
| `stopPropagation()`            | ✅                    | ❌                                     | ❌                            |
| `stopImmediatePropagation()`   | ✅                    | ✅                                     | ❌                            |
| `preventDefault()`             | ❌                    | ❌                                     | ✅                            |

---

## 5. Why does this matter? — Event Delegation

Bubbling is what makes **event delegation** possible: attach one listener to a parent instead of many listeners to each child.

```html
<ul id="list">
  <li>Apple</li>
  <li>Banana</li>
  <li>Cherry</li>
</ul>
```

Instead of adding a listener to every `<li>`:

```js
document.getElementById("list").addEventListener("click", (e) => {
  if (e.target.tagName === "LI") {
    console.log("Clicked:", e.target.textContent);
  }
});
```

- One listener handles all children.
- Works for `<li>` elements added *later* — the parent is still listening.
- Big performance win on long lists.

`event.target` = the element actually clicked.
`event.currentTarget` = the element the listener is attached to.

---

## 6. Events that do NOT bubble

Most events bubble, but a few don't. Common non-bubbling ones:

- `focus`, `blur` (use `focusin` / `focusout` if you need bubbling)
- `mouseenter`, `mouseleave` (use `mouseover` / `mouseout` for bubbling versions)
- `load`, `unload`, `scroll` (on most elements)

For these, capturing is often the only way to catch them at an ancestor.

---

## 7. Quick summary

- Every event travels **down (capture)** then **up (bubble)** through the DOM.
- Listeners bubble by default; pass `true` to `addEventListener` to capture.
- `stopPropagation()` halts the journey; `preventDefault()` blocks the browser's default behavior — they're independent.
- Bubbling enables **event delegation**, one of JS's most useful patterns.
- `event.target` is where it happened; `event.currentTarget` is who's listening.

---

## Interview Questions (Senior Dev)

---

### 1. Walk me through the three phases of DOM event propagation. Which phase does `addEventListener` use by default, and how do you opt into the other one?

**Answer.** Every DOM event goes through three phases:

1. **Capturing phase** — the event starts at `window` and travels *down* the DOM tree toward the target. Each ancestor is visited on the way down.
2. **Target phase** — the event reaches the actual element that was interacted with. Listeners on the target itself run here (regardless of `capture` flag).
3. **Bubbling phase** — the event travels *back up* from the target to `window`. Each ancestor gets a second chance to handle it.

`addEventListener` uses the **bubbling** phase by default. To listen during the capturing phase, pass a third argument:

```js
el.addEventListener("click", handler, true);          // legacy boolean form
el.addEventListener("click", handler, { capture: true }); // modern options form
```

The options form is preferred because you can combine it with `once`, `passive`, and `signal`.

---

### 2. What's the difference between `event.target` and `event.currentTarget`? Give a scenario where they differ and where relying on the wrong one would cause a bug.

**Answer.**
- `event.target` — the **innermost element** that was actually interacted with (where the event originated).
- `event.currentTarget` — the element the **listener is attached to** (the element currently processing the event).

They differ whenever the event bubbles or captures across multiple elements.

**Bug scenario — event delegation on a list:**

```html
<ul id="list">
  <li data-id="1"><span>Delete</span></li>
  <li data-id="2"><span>Delete</span></li>
</ul>
```

```js
list.addEventListener("click", (e) => {
  const id = e.currentTarget.dataset.id; // ❌ always undefined — currentTarget is <ul>
  deleteItem(id);
});
```

You wanted the clicked `<li>`, but `currentTarget` is the `<ul>` the listener sits on. Worse, if the user clicks the `<span>`, `e.target` is the `<span>`, not the `<li>`. Correct version:

```js
list.addEventListener("click", (e) => {
  const li = e.target.closest("li");
  if (!li) return;
  deleteItem(li.dataset.id);
});
```

`closest()` walks up from `e.target` to find the ancestor you actually care about — the delegation idiom.

---

### 3. `stopPropagation()` vs `stopImmediatePropagation()` vs `preventDefault()` — explain when you'd reach for each. Can you use them together?

**Answer.**

| Method | What it stops |
|---|---|
| `stopPropagation()` | Prevents the event from continuing to **other elements** (up or down the tree). Other listeners on the *same* element still run. |
| `stopImmediatePropagation()` | Everything `stopPropagation` does, **plus** cancels any **other listeners on the same element** that haven't run yet. |
| `preventDefault()` | Cancels the browser's **default action** (form submit, link navigation, checkbox toggle, right-click menu). Does NOT stop propagation. |

**When to use each:**
- `preventDefault()` → intercepting a form submit for AJAX, disabling a link, custom drag behavior.
- `stopPropagation()` → rare; only when an ancestor listener would misbehave (and it usually means the ancestor should be smarter instead).
- `stopImmediatePropagation()` → very rare; typically inside plugins/libraries to override earlier listeners.

**Can you combine them?** Yes — they're orthogonal. Common pattern in form validation:

```js
form.addEventListener("submit", (e) => {
  if (!valid) {
    e.preventDefault();       // don't submit
    e.stopPropagation();      // and don't let a parent form (in nested UI) see it
  }
});
```

---

### 4. Explain event delegation. What are its benefits, and what are its pitfalls?

**Answer.** Event delegation = attaching **one listener to a common ancestor** instead of one listener per child, and using `event.target` (usually with `closest()`) to figure out which child was hit.

**Benefits:**
- **Memory** — one listener instead of thousands.
- **Dynamic content** — children added later are automatically covered; no need to re-bind.
- **Simpler teardown** — remove one listener instead of many.

**Pitfalls:**
- **`e.target` may be a nested descendant**, not the element you expected. Always narrow with `closest("selector")`.
- **Non-bubbling events** (`focus`, `blur`, `mouseenter`, `scroll` on most elements) can't be delegated normally — use their bubbling counterparts (`focusin`/`focusout`, `mouseover`/`mouseout`) or capturing.
- **`stopPropagation()` upstream** by other code will silently break your delegated handler.
- **Root-level listeners run for every event of that type** in the subtree — filter cheaply and early to avoid perf regressions.
- **Framework interference** — React attaches its own root listener; mixing native delegation with React handlers can cause ordering surprises.

---

### 5. Why don't `focus` and `blur` bubble? How would you catch a focus event on any input inside a form using a single listener on the form?

**Answer.** `focus` and `blur` were defined in the DOM Level 2 era as **non-bubbling** because focus is conceptually a property of a single element, not a tree-wide event. This made delegation impossible, so the spec later added `focusin` and `focusout`, which are identical but **do** bubble.

Two ways to catch focus at the form level:

```js
// Option A — bubbling counterparts (preferred)
form.addEventListener("focusin",  (e) => console.log("focused", e.target));
form.addEventListener("focusout", (e) => console.log("blurred", e.target));

// Option B — attach 'focus' in the capturing phase (it still reaches ancestors that way)
form.addEventListener("focus", handler, true);
```

Option A is cleaner and more intent-revealing.

---

### 6. You attach a click listener to a `<div>` in the capturing phase and another on the same `<div>` in the bubbling phase. A click occurs on a child `<button>`. In what order do the two listeners fire, and why?

**Answer.**

1. **Capturing listener on the `<div>`** fires **first** — the event is travelling *down* from the root toward the button, and the `<div>` is on that path.
2. The event reaches the `<button>` (target phase).
3. **Bubbling listener on the `<div>`** fires **last** — the event is now travelling *back up* from the button to the root.

Order: `div capture → button → div bubble`.

The `<div>` is visited **twice** in the same event dispatch because it's on the path in both directions. This is what enables patterns like "install a modal-wide capture listener that inspects clicks *before* any child sees them."

---

### 7. A colleague adds `e.stopPropagation()` inside a dropdown component to "prevent it from closing when clicked inside." What could go wrong with that approach in a larger app?

**Answer.** It's a code smell that works in isolation and breaks the moment the app grows. Things that break:

- **Analytics / telemetry listeners on `document`** stop firing for clicks inside the dropdown — you lose data silently.
- **Other "click-outside-to-close" components** (menus, tooltips, popovers) rely on seeing the click bubble to `document`; blocking it means clicking your dropdown won't close *their* menus.
- **Portal-rendered UI** — if the dropdown is portaled to `document.body`, the DOM ancestor chain is different from the React tree; developers get confused about why "outside" clicks don't behave as expected.
- **Global keyboard-shortcut managers** or **command palettes** attached higher up stop receiving events.
- **Testing frameworks** and **accessibility tools** that observe events at the root get an incomplete picture.

**Better approach:** in the "click outside" logic, check whether `e.target` is *inside* the dropdown (`dropdownRef.current.contains(e.target)`) and bail out if so. Let the event propagate normally.

---

### 8. How does React's synthetic event system relate to native DOM bubbling/capturing? Where are events attached in React 17+, and how does that affect `stopPropagation` interactions?

**Answer.**

- React wraps native events in a **SyntheticEvent** — a cross-browser normalized wrapper. Bubbling/capturing semantics still apply, but the traversal is over the **React tree**, not the DOM tree.
- **React ≤16:** all events were delegated to `document`.
- **React 17+:** events are delegated to the **root React container** (the element you called `createRoot` on). This was done to make multiple React versions coexist on one page and to improve portal semantics.
- React supports both phases: `onClick` (bubble) and `onClickCapture` (capture).

**Interaction gotchas with `stopPropagation`:**

- Calling `e.stopPropagation()` on a **React synthetic event** only stops propagation **through the React tree**. The underlying native event still reaches the root container and any listeners above it.
- Calling `stopPropagation()` on a **native listener attached to `document`** stops it *before* React's root listener sees it → your React `onClick` never fires.
- Because React 17+ listens on the app root (not `document`), native `document`-level listeners run **after** React's handlers — the opposite of React 16.
- Mixing `e.stopPropagation()` in React with `document.addEventListener` code (common in third-party libs) is a frequent source of subtle bugs; prefer `e.nativeEvent.stopImmediatePropagation()` when you truly need to block native listeners too.

---

### 9. Given a list of 10,000 rows where each row has a delete button, how would you wire up click handling?

**Answer.** **Event delegation on the list container**, not 10,000 individual listeners.

```js
list.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-action='delete']");
  if (!btn) return;
  const id = btn.closest("[data-row-id]").dataset.rowId;
  deleteRow(id);
});
```

**Justification:**
- **Memory** — one listener vs 10,000. Each listener has overhead (closure, event target reference); at 10k it's measurable.
- **Init performance** — attaching 10k listeners on mount blocks the main thread; a single listener is O(1).
- **Dynamic rows** — rows added via infinite scroll or virtualization are auto-covered.
- **Teardown** — one `removeEventListener` on unmount; no per-row cleanup bookkeeping.
- **Filtering cost** — `closest()` is a short DOM walk from the click point; negligible compared to the alternative.

In React, this often looks like `onClick` on the row (React already does delegation internally), but for **very large or virtualized lists**, hoisting the handler to the container and reading `data-*` attributes off `e.target` avoids re-creating 10k function props on every render.

---

### 10. Can you cancel an event during the capturing phase before it reaches the target? Show how, and give a legitimate use case.

**Answer.** Yes. A capturing listener runs *before* the target listener, and can call `stopPropagation()` (or `stopImmediatePropagation()`) to prevent the event from ever reaching descendants.

```js
document.addEventListener("keydown", (e) => {
  if (isCommandPaletteOpen && e.key === "Escape") {
    closeCommandPalette();
    e.stopPropagation();   // prevent any child from also handling Escape
    e.preventDefault();
  }
}, true); // <-- capture
```

**Legitimate use cases:**
- **Global keyboard-shortcut manager** — intercept `Ctrl+K`, `Escape`, `/` before any input, editor, or child component can consume them.
- **Modal / overlay** — swallow clicks and keystrokes outside the modal so background UI can't be interacted with while it's open.
- **Feature-flag kill switch** — a top-level capturing listener that disables a whole subtree's events without touching individual components.
- **Analytics wrapper** — record every click at the root before app code potentially calls `stopPropagation`.

---

### 11. What's the difference between `mouseenter`/`mouseleave` and `mouseover`/`mouseout`? Why does this matter for hover behavior on a parent with nested children?

**Answer.**

| Event | Bubbles? | Fires when the cursor moves between the element and its own children? |
|---|:---:|:---:|
| `mouseover` / `mouseout` | ✅ Yes | ✅ Yes — fires *repeatedly* as the cursor crosses child boundaries |
| `mouseenter` / `mouseleave` | ❌ No | ❌ No — fires **once** when entering/leaving the element as a whole |

**Why it matters:** Suppose you have a card with a title and a button inside, and you show a tooltip on hover:

```js
card.addEventListener("mouseover", showTooltip);
card.addEventListener("mouseout",  hideTooltip);
```

As the user moves from the card background over the title, `mouseout` fires on the card, then `mouseover` fires again — the tooltip **flickers** every time the cursor crosses a child boundary.

Fix:

```js
card.addEventListener("mouseenter", showTooltip);
card.addEventListener("mouseleave", hideTooltip);
```

`mouseenter`/`mouseleave` treat the card + all descendants as one region, so the tooltip stays stable.

The trade-off: they don't bubble, so you can't delegate them. If you need delegation *and* enter/leave semantics, use `mouseover`/`mouseout` and check `e.relatedTarget` (the element the cursor came from / is going to) to filter out internal transitions.

---

### 12. The `passive: true` option on a scroll or touch listener — what does it do, how does it interact with `preventDefault()`, and why do browsers warn about non-passive scroll listeners?

**Answer.**

```js
window.addEventListener("touchmove", handler, { passive: true });
```

**What it does:** promises the browser that this listener **will not call `preventDefault()`**. That promise lets the browser start **scrolling immediately in parallel**, without waiting to see whether JS wants to cancel the scroll.

**Interaction with `preventDefault()`:**
- If a listener is `passive: true` and calls `preventDefault()`, the call is **ignored** and the browser logs a warning.
- If `passive` is not set, the browser must **block scrolling until the JS handler finishes** — because the handler might cancel it. Even a fast handler causes jank on 60/120fps scroll.

**Defaults (modern browsers):** `touchstart`, `touchmove`, and `wheel` are **passive by default** when attached to `window`, `document`, or `document.body`. You must opt out with `passive: false` if you genuinely need to call `preventDefault()`.

**Why browsers warn:** a non-passive scroll/touch listener is one of the top causes of scroll jank on mobile. Chrome logs "Added non-passive event listener to a scroll-blocking event" to nudge developers toward `passive: true` whenever `preventDefault` isn't actually needed. In performance audits (Lighthouse, DevTools), non-passive scroll listeners show up as a red flag.

**Rule of thumb:** default to `{ passive: true }` for scroll/touch/wheel listeners. Only opt out (`{ passive: false }`) when you legitimately need `preventDefault()` — e.g. implementing a custom pull-to-refresh or preventing horizontal swipe from triggering the browser's back gesture.
