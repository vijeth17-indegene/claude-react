import { useState } from "react";
import Modal from "./Modal";


export default function ModalDemo() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button onClick={() => setIsOpen(true)}>
                Open Modal
            </button>

            <Modal
                isOpen= {isOpen}
                onClose={() => setIsOpen(false)}
                title="Composition"
            >
                <p>Hello Modal!</p>
                <button onClick={() => setIsOpen(false)}>Cancel</button>
            </Modal>
        </>
    );
}