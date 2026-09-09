import { type ComponentProps } from "react";

type InputProps = ComponentProps<"input"> & {
  label: string;
};

export default function Input({label, id, type="text", ...rest}: InputProps) {
    return (
        <label htmlFor={id}>
            {label}
            <input type={type} id={id} {...rest} />
        </label>
    );
}


//ComponentProps<"input"> resolves to React.InputHTMLAttributes<HTMLInputElement> & React.RefAttributes<HTMLInputElement> — the exact prop shape React accepts on <input>.

//Intersecting with { label: string } adds your custom prop without losing any native ones.

//label is destructured out so it isn't forwarded to the DOM <input> (which would cause a React warning).

//...rest is still fully typed, so event handlers are inferred correctly (e.g. onChange gives you ChangeEvent<HTMLInputElement> with no annotation).


{/* <Input type="email" />                          // 'label' is missing
<Input label="X" type="banana" />               // "banana" not assignable to HTMLInputTypeAttribute
<Input label="X" onChange={(e: string) => {}} /> // wrong event type
<Input label="X" foo="bar" />                   // unknown prop 'foo' */}


// Note on ComponentProps vs alternatives:

// ComponentProps<"input"> — includes ref. Use this by default.
// ComponentPropsWithoutRef<"input"> — same but strips ref. Use when you're not forwarding a ref.
// ComponentPropsWithRef<"input"> — explicit ref-included variant, mainly relevant with forwardRef.
// JSX.IntrinsicElements["input"] also works but is a bit less idiomatic in modern React code.