import LiveClock from "./components/LiveClock";
import TitleCounter from "./components/TitleCounter";
import AutoFocusInput from "./components/useRef/AutoFocusInput";
import RenderCounter from "./components/useRef/RenderCounter"

export default function App() {
  return(
    <>
      <h1>Effects</h1>
      <LiveClock /><br />
      <TitleCounter /><br />
      <AutoFocusInput /><br />
      <RenderCounter />
    </>
  );
}