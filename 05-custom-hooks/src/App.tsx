import ModalWithoutHook from './useToggle/ModalWithoutHook';
import Modal from './useToggle/Modal';
import LsWithoutHook from './useLocalStorage/LsWithoutHook';
import DebouncedInput from './debounce/debounced-input';
import FetchData from './fetch/FetchData';

export default function App() {
  return(
    <> 
      <p>Modal Without Custom Hook</p>
      <ModalWithoutHook />
      <p>Modal with custom Hook</p>
      <Modal />
      <p>Local Storage without custom Hook</p>
      <LsWithoutHook />
      <p></p>
      <p></p>
      <p>Debounced</p>
      <DebouncedInput />

      <FetchData />
    </>
  );
}