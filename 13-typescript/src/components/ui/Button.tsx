type ButtonProps = 
    | { variant: "link"; href: string; children: React.ReactNode }
    | { variant: "button"; onClick: () => void;  children: React.ReactNode };

export default function Button(props: ButtonProps) {
    if(props.variant === "link") {
        return <a href={props.href}>{props.children}</a>;
    }
    return <button onClick={props.onClick}>{props.children}</button>;
}

//Discriminated unions are a way to create a type that can represent multiple different shapes of data, while still allowing TypeScript to narrow down the type based on a specific property. 
// In this example, the ButtonProps type is defined as a discriminated union with two possible shapes: one for a link button and one for a regular button. T
// he variant property is used to discriminate between the two shapes, allowing TypeScript to infer the correct type for the other properties based on the value of variant.

//href is required when variant is "link", and onClick is required when variant is "button". This allows for type safety and ensures that the correct props are passed to the Button component based on its variant.


//Discriminated unions let me make invalid prop combinations unrepresentable rather than validating them at runtime. 
// This is a powerful feature of TypeScript that helps catch errors early in the development process and improves the overall reliability of the code.