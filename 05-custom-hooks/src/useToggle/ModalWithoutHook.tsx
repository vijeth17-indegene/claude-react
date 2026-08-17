import { useState } from 'react';

export default function ModalWithoutHook() {
    const [isOpen, setIsOpen] = useState<boolean>(false);

    const toggle = () => setIsOpen(prev => !prev);

    return(
        <>
            <button onClick={toggle}>{isOpen ? "Close Modal" : "Open Modal" }</button>
            {isOpen && <div className='modal'>Modal Content</div>}
        </>
    );
}