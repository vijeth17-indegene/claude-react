import type { ReactNode, MouseEvent } from "react";

type ModalProps = {
    isOpen: boolean;
    onClose: () => void;
    title: ReactNode;
    children: ReactNode;
}

export default function Modal({ isOpen, onClose, title, children}: ModalProps) {

    if (!isOpen) return null;

    const handleBackdropClick = () => onClose();
    const stopPropagation = (e: MouseEvent) => e.stopPropagation();

    return(
        <div
            onClick={handleBackdropClick}
            style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1000,
            }}
        >
            <div role="dialog" aria-modal="true" onClick={stopPropagation} 
                style={{
                    background: "#fff",
                    borderRadius: 8,
                    padding: 20,
                    minWidth: 320,
                    maxWidth: "90vw",
                }}
            >
                <header style={{marginBottom: 12, borderBottom: "1px solid #eee"}}>
                    {title}
                </header>
                <div>{children}</div>
            </div>
        </div>
    );
}