import useToggle from '../custom-hooks/useToggle';
export default function Modal() {
    const [isOpen, toggle]= useToggle(false);
    return(
        <>
            <button onClick={toggle}>{isOpen ? 'Close Modal' : 'Open Modal'}</button>

            {isOpen && <div className="modal">Modal Content</div>}
        </>
    );
}