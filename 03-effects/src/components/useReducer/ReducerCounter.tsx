import { useReducer } from 'react';

type State = {
  count: number;
  step: number;
};

// The `Action` type is a union type that defines the possible actions that can be dispatched to the reducer function. Each action has a `type` property that indicates the type of action being performed, and some actions may have an additional `payload` property that carries additional data needed for the action. The four possible actions are:
// 1. 'increment': Increases the count by the current step value.
// 2. 'decrement': Decreases the count by the current step value.
// 3. 'reset': Resets the count to zero.
// 4. 'setStep': Sets a new step value, which is provided in the `payload` property of the action.

//why | The `|` symbol in the `Action` type definition is used to create a union type in TypeScript. A union type allows a variable to hold one of several types. In this case, the `Action` type can be one of four different object shapes, each representing a different action that can be dispatched to the reducer. This means that when you dispatch an action, it must match one of the defined shapes, ensuring type safety and helping prevent errors in your code.
type Action =
  | { type: 'increment' }
  | { type: 'decrement' }
  | { type: 'reset' }
  | { type: 'setStep'; payload: number };

function reducer(state: State, action: Action): State { //explain this line
  // This line defines a function called `reducer` that takes two parameters: `state` and `action`. The `state` parameter is of type `State`, which is an object containing two properties: `count` (a number) and `step` (also a number). The `action` parameter is of type `Action`, which can be one of four possible action objects: 'increment', 'decrement', 'reset', or 'setStep' (with an associated payload of type number).

  //function reducer(state: State, action: Action): after the colon (:) indicates the return type of the function, which is also of type `State`. This means that the `reducer` function will return a new state object that conforms to the `State` type definition. The purpose of this function is to handle state transitions based on the dispatched actions, updating the state accordingly and returning the new state.
  switch (action.type) {
    case 'increment':
      return { ...state, count: state.count + state.step };
    case 'decrement':
      return { ...state, count: state.count - state.step };
    case 'reset':
      return { ...state, count: 0 };
    case 'setStep':
      return { ...state, step: action.payload }; //payload is the new step value that is passed in when the 'setStep' action is dispatched. The reducer function updates the state by creating a new state object that spreads the existing state properties and updates the `step` property with the new value from `action.payload`.
    default:
      return state;
  }
}

const initialState: State = { count: 0, step: 1 };

export default function StepCounter() {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <div>
      <p>Count: {state.count}</p>
      <label>
        Step:
        <input
          type="number"
          value={state.step}
          onChange={(e) => dispatch({ type: 'setStep', payload: Number(e.target.value) })}
        />
        {/* This line is an event handler for the `onChange` event of the input field. When the user changes the value in the input field, this function is called with the event object `e`. The function dispatches an action of type 'setStep' to the reducer, with a payload that is the new step value converted to a number using `Number(e.target.value)`. This updates the state with the new step value, allowing the user to control how much the count increments or decrements when the buttons are clicked. */}
        {/* why payload? The `payload` property is used to carry additional data needed for the action. In this case, it carries the new step value that the user has entered in the input field. */}
      </label>
      <button onClick={() => dispatch({ type: 'decrement' })}>-</button>
      <button onClick={() => dispatch({ type: 'increment' })}>+</button>
      <button onClick={() => dispatch({ type: 'reset' })}>Reset</button>
    </div>
  );
}