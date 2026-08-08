import { useReducer } from "react";

function reducer(state, action) {
    switch(action.type) {
        case "increment":
            return { ...state, count: state.count + state.step};
        case "decrement":
            return { ...state, count: state.count - state.step};
        case "reset":
            return { ...state, count: 0 };
        case "setStep":
            return { ...state, step: action.payload }
        default:
            return state;
    }
}

const initialState = { count: 0, step: 1};

function ReducerCounter1() {
    const [state, dispatch] = useReducer(reducer, initialState);

    return(
        <>
            <p>Count</p>
            <div>
                <label htmlFor="Step">Step</label>
                <input type="Number" id="Step" value={state.step}
                onChange={(e) => dispatch({type: 'setStep', payload: Number(e.target.value) })} />
                <button onClick={() => dispatch({ type: 'decrement'})}>-</button>
                <button onClick={() => dispatch({ type: 'increment' })}>+</button>
                <button onClick={() => dispatch({type:'reset'})}>Reset</button>
            </div>
        </>
    );
}