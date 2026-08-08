import { useReducer } from "react";

type State = {
    count: number;
    step: number;
}

type Action = 
    | { type: 'increment' }
    | { type: 'decrement' }
    | { type: 'reset' }
    | { type: 'setStep'; payload: number };

function stepCounterReducer(state:State, action:Action): State {
    switch(action.type) {
        case "increment":
            return { ...state, count: state.count + state.step};
        case "decrement":
            return { ...state, count: state.count - state.step};
        case "reset":
            return { ...state, count: 0 };
        case "setStep":
            return { ...state, step: action.payload };
        default:
            return state;
    }
}

const initialState: State = { count: 0, step: 1};

export default function StepCounter_with_reducerts() {
    const [state, dispatch] = useReducer(stepCounterReducer, initialState);

    return(
        <>
            <p>Count: {state.count}</p>
            <div>
                <label htmlFor="Step">Step</label>
                <input type="Number" id="Step" value={state.step}
                onChange={(e) => dispatch({ type: 'setStep', payload: Number(e.target.value) })} />
                <button onClick={() => dispatch({ type: 'decrement'})}>-</button>
                <button onClick={() => dispatch({ type: 'increment' })}>+</button>
                <button onClick={() => dispatch({type:'reset'})}>Reset</button>
            </div>
        </>
    );
}