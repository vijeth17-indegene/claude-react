# Compound Components — Interview Guide

A senior-level deep dive on the **compound components** pattern in React. Framed as an interview would ask about it: definitions, mental models, code, trade-offs, and the tricky follow-ups.

---

## 1. The 30-second answer

> Compound components are a set of components that are **designed to work together** and share **implicit state** through a common parent — via React context — while the caller composes them declaratively in JSX. The classic example is native HTML `<select>` and `<option>` — they only make sense together and coordinate behind the scenes.

**Example the interviewer expects:**

```tsx
<Tabs defaultValue="profile">
  <Tabs.List>
    <Tabs.Tab value="profile">Profile</Tabs.Tab>
    <Tabs.Tab value="settings">Settings</Tabs.Tab>
  </Tabs.List>
  <Tabs.Panel value="profile">…</Tabs.Panel>
  <Tabs.Panel value="settings">…</Tabs.Panel>
</Tabs>
```

The caller doesn't pass `activeTab` around. `Tabs` holds the state; `Tab` and `Panel` read it via context.

---

## 2. Why the pattern exists — the problem it solves

Interviewers want to hear you frame it as a **flexibility vs prop-explosion trade-off**.

### The "config prop" alternative
```tsx
<Tabs
  tabs={[
    { id: "profile",  label: "Profile",  content: <ProfileView /> },
    { id: "settings", label: "Settings", content: <SettingsView /> },
  ]}
  defaultActive="profile"
/>
```

**Problems:**
- Hard to add per-tab customization (an icon, a badge, a disabled state) without exploding the config schema.
- The order of labels vs panels isn't visible in JSX — you have to read the array.
- Styling wrappers around a tab require the parent to know about them.

### The compound alternative
```tsx
<Tabs defaultValue="profile">
  <Tabs.List>
    <Tabs.Tab value="profile"><Icon /> Profile <Badge>3</Badge></Tabs.Tab>
    <Tabs.Tab value="settings" disabled>Settings</Tabs.Tab>
  </Tabs.List>
  <Tabs.Panel value="profile">…</Tabs.Panel>
</Tabs>
```

- Layout, ordering, and per-tab content are visible in JSX.
- No prop schema to extend when needs grow.
- Composition all the way down — you can wrap `<Tabs.Tab>` in your own components.

**The one-liner to land the point:**
> "Config-driven APIs are easy to start with but hard to grow. Compound APIs move flexibility to the caller — the parent owns *behavior*, JSX owns *shape*."

---

## 3. The mental model

Three roles:

1. **Root** (`Tabs`) — owns state and provides context.
2. **Children** (`Tabs.Tab`, `Tabs.Panel`) — consume context, render based on it, dispatch updates back through it.
3. **Context** — the invisible bus connecting them.

```
      Tabs (Provider — owns activeTab state)
        │
        │  ── context ──►  Tabs.List
        │                     │
        │                     ├──► Tabs.Tab (reads activeTab, calls setActiveTab)
        │                     └──► Tabs.Tab
        │
        └──►  Tabs.Panel (reads activeTab, renders if match)
```

The caller sees only JSX. The wiring is invisible.

---

## 4. A minimal implementation to walk through

Be ready to write this on a whiteboard:

```tsx
import { createContext, useContext, useState, type ReactNode } from "react";

type TabsContextValue = {
  active: string;
  setActive: (value: string) => void;
};

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabs() {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error("Tabs.* must be rendered inside <Tabs>");
  return ctx;
}

type TabsProps = {
  defaultValue: string;
  children: ReactNode;
};

function Tabs({ defaultValue, children }: TabsProps) {
  const [active, setActive] = useState(defaultValue);
  return (
    <TabsContext.Provider value={{ active, setActive }}>
      {children}
    </TabsContext.Provider>
  );
}

function TabsList({ children }: { children: ReactNode }) {
  return <div role="tablist">{children}</div>;
}

type TabProps = { value: string; children: ReactNode };
function Tab({ value, children }: TabProps) {
  const { active, setActive } = useTabs();
  const isActive = active === value;
  return (
    <button
      role="tab"
      aria-selected={isActive}
      onClick={() => setActive(value)}
    >
      {children}
    </button>
  );
}

type PanelProps = { value: string; children: ReactNode };
function Panel({ value, children }: PanelProps) {
  const { active } = useTabs();
  return active === value ? <div role="tabpanel">{children}</div> : null;
}

Tabs.List = TabsList;
Tabs.Tab = Tab;
Tabs.Panel = Panel;

export default Tabs;
```

**Points to call out while explaining:**
- `createContext<... | null>(null)` + a `useTabs` hook that throws on missing provider — this catches "used outside `<Tabs>`" bugs early.
- `Tabs.List = TabsList` — the **dot notation** is just attaching sub-components as properties of the parent function. Cosmetic; no runtime magic.
- No `React.Children.map` needed for basic cases — context handles it.
- Panels return `null` when inactive; DOM stays clean.

---

## 5. Alternatives — know the trade-offs

The compound pattern isn't the only way. An interviewer often follows with *"When would you NOT use it?"*

| Pattern | Best for | Weakness |
|---|---|---|
| **Config props** (`<Tabs tabs={[...]} />`) | Fixed, symmetric data; CMS-driven UIs | Rigid, hard to customize per item |
| **Render props** (`<Tabs>{({active}) => ...}</Tabs>`) | Total caller control over rendering | Verbose JSX; harder to read |
| **Slot / named-slot props** (`header={...}` `footer={...}`) | Two or three fixed regions | Doesn't scale to many children |
| **Compound components** | Flexible, ordered, dynamic-number children that share state | More boilerplate; context overhead |
| **Headless hooks** (`useTabs()`) | Max flexibility, zero styling coupling | Caller writes more markup |

**The senior-level insight:**
> "Compound components sit between config-driven and headless. They give the caller structural control while keeping behavior encapsulated."

---

## 6. When to use it (and when not to)

**Reach for it when:**
- Components clearly belong together (`Menu` + `MenuItem`, `Accordion` + `Panel`, `Form` + `Field`).
- Children need to share state without the caller managing it.
- The set of children is dynamic in number or order.
- You want the JSX to read like the visual structure.

**Avoid it when:**
- The data is uniform and driven by an array — a `.map()` of `<Tab>` is fine, no need for context.
- Only one child needs the shared state — just use props.
- The pieces aren't tightly coupled — you're forcing a pattern.
- Consumers might render children conditionally deep inside their own components (context still works, but the "look at the JSX" benefit fades).

---

## 7. Follow-up traps

### Q: "Why context instead of just cloning children with `React.Children.map` and injecting props?"

> `React.Children.map` only sees **direct** children. The moment a consumer wraps a `Tab` in their own component (`<MyStyledTab value="x" />`), prop injection stops working. Context traverses the tree without caring about wrappers — that's why every modern library (Radix, Headless UI, Reach) uses context.

### Q: "What are the performance concerns with the context approach?"

> Every child that calls `useContext` re-renders when the context value changes. If the value object is re-created every render (`value={{ active, setActive }}`), consumers re-render even when `active` didn't change. Fix: `useMemo` the value, or split into two contexts (state vs setters).

```tsx
const value = useMemo(() => ({ active, setActive }), [active]);
```

### Q: "How do you prevent someone from using `Tabs.Tab` outside `<Tabs>`?"

> The `useTabs()` hook throws if the context is `null`. That's the standard idiom — clear error at dev time, no silent failure.

### Q: "How do you avoid the `Tabs.List = TabsList` boilerplate?"

> You don't have to. You can export named components — `export { Tabs, TabsList, Tab, TabsPanel }` — and let callers import them individually. The dot syntax is purely ergonomic. Radix uses it; Headless UI uses named exports. Both are valid.

### Q: "What about controlled vs uncontrolled compound components?"

> Same pattern as native inputs. Support both:

```tsx
type TabsProps = {
  value?: string;              // controlled
  defaultValue?: string;       // uncontrolled
  onValueChange?: (v: string) => void;
  children: ReactNode;
};
```

Internally, `active = value ?? internalState`. Every serious library (Radix, MUI, Ant) does this.

### Q: "Can compound components work with server components / SSR?"

> Yes, but only if the state-holding root is a client component. Sub-components that don't consume context can be server components. Modern React libraries (Radix v3+, Ark UI) split their APIs this way.

### Q: "What's the accessibility angle?"

> Compound components make **ARIA relationships** natural — the root owns roles like `tablist`, children own `tab`/`tabpanel`, and the shared context can coordinate `aria-selected`, `aria-controls`, keyboard focus, etc. Config-driven APIs often bolt this on afterwards; compound APIs bake it in.

### Q: "What's a compound component you'd say is over-engineered?"

> A two-part component where the child never needs shared state. E.g., `Card` + `Card.Body` where `Card.Body` is just a styled div and gets no context from `Card`. That's aesthetics, not composition — a plain wrapper does the same job with less indirection.

---

## 8. Real-world examples worth name-dropping

- **Native HTML** — `<select>`/`<option>`, `<table>`/`<tr>`/`<td>`, `<details>`/`<summary>`, `<dl>`/`<dt>`/`<dd>`. The original compound components.
- **Radix UI** — `<Dialog>`/`<Dialog.Trigger>`/`<Dialog.Content>`. Reference-quality implementation.
- **Headless UI** — `<Menu>`/`<Menu.Button>`/`<Menu.Items>`/`<Menu.Item>`.
- **React Router** — `<Routes>`/`<Route>`.
- **Recharts** — `<LineChart>`/`<Line>`/`<XAxis>`/`<YAxis>`.
- **Formik / React Hook Form** — `<Form>`/`<Field>` share form state via context.

Mentioning one or two of these signals you've read production code, not just tutorials.

---

## 9. The senior-level "gotcha" question

**"What happens if I do this?"**

```tsx
<Tabs defaultValue="a">
  {condition ? <Tabs.Tab value="a">A</Tabs.Tab> : null}
</Tabs>
```

Answer: it works. Context doesn't care where in the tree the consumer sits, or whether the JSX conditionally renders it. That's the whole point of using context over `React.Children.map`.

**"What about this?"**

```tsx
const tab = <Tabs.Tab value="a">A</Tabs.Tab>;
{/* rendered outside <Tabs> */}
{tab}
```

Answer: throws (`Tabs.* must be rendered inside <Tabs>`). Because `useContext` runs at render time and the provider isn't in the tree above it. This is why the null-check throw is important.

---

## 10. Quick-fire practice — say these out loud

- **"Compound components = a set of pieces that share implicit state through a common parent, wired via context."**
- **"The caller controls layout in JSX; the parent controls behavior — that's the split."**
- **"Prefer context over `React.Children.map` — it survives wrapper components."**
- **"Memoize the context `value` object to avoid unnecessary consumer re-renders."**
- **"A `useTabs()` hook that throws when the provider is missing gives you free dev-time safety."**
- **"Support controlled and uncontrolled modes — mirror how native inputs behave."**

These six lines cover 90% of the follow-ups an interviewer will throw.

---

## TL;DR

- **What:** A parent + related children that coordinate via context and are composed in JSX.
- **Why:** Move flexibility to the caller without exposing internal state; keep the JSX readable.
- **How:** `createContext` + a custom hook + subcomponents attached to the parent (or exported separately).
- **When to reach for it:** Tightly-related pieces, variable child count, shared state, ordered structure that should be visible in JSX.
- **When not to:** Uniform array data, single-child sharing, purely stylistic wrappers.
- **Common libraries using it:** Radix, Headless UI, React Router, Recharts, Formik.
