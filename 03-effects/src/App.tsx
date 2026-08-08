import LiveClock from "./components/LiveClock";
import TitleCounter from "./components/TitleCounter";
import AutoFocusInput from "./components/useRef/AutoFocusInput";
import RenderCounter from "./components/useRef/RenderCounter";
import StepCounter_with_useState from "./components/useReducer/StepCounter_with_useState";
import StepCounter_with_reducerts from "./components/useReducer/StepCounter_with_reducerts"

export default function App() {
  return(
    <>
      <h1>Effects</h1>
      <LiveClock /><br />
      <TitleCounter /><br />
      <AutoFocusInput /><br />
      <RenderCounter /> <br />
      <h2>Step Counter with useState</h2>
      <StepCounter_with_useState />
      <h2>Step Counter with useReducer</h2>
      <StepCounter_with_reducerts />
    </>
  );
}