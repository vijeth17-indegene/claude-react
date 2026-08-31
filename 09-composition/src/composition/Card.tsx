import type {ReactNode} from "react";

type CardProps = {
    children: ReactNode;
}

export default function Card({ children }: CardProps) {
    return (
        <div 
            className="card" 
            style={{
                border: "1px solid #000",
                borderRadius: 8,
                padding: 16,
                background: "white",
                maxWidth: 320,
            }}
        >
            {children}
        </div>
    );
}


