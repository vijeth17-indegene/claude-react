//1
for (var i = 0; i < 3; i++) setTimeout(() => console.log(i), 0); // 3 3 3
for (let j = 0; j < 3; j++) setTimeout(() => console.log(j), 0); // 0 1 2

//Why does let fix it?” The common answer is “block scope,” which is incomplete and interviewers notice. The real mechanism: let in a for loop creates a fresh binding per iteration, and the value is copied forward into each one. Three separate variables, not one block-scoped variable. Block scope alone wouldn’t help — the loop body is still one block executing three times.

//“Fix the var version without using let.” Worth writing out now, it’s a standard follow-up:

for (var i = 0; i < 3; i++) {
    (function (captured) {
        setTimeout(() => console.log(captured), 0);
    })(i);
}
//The IIFE creates a new function scope per iteration, which is what let does for you automatically.

//2
//console.log(a); var a = 1; // undefined
//console.log(b); let b = 2; // ReferenceError: Cannot access 'b' before initialization

//3
function outer() {
    let count = 0;
    return {
        inc: () => ++count,
        get: () => count
    }
}
const x = outer(), y = outer();
x.inc(); x.inc(); y.inc();
console.log("x:", x.get(), "y:", y.get()); //x=2, y=1
 
//4 createCounter() → returns increment, decrement, getValue, with count genuinely private

function createCounter() {
    let count = 0;
    return {
        increment: () => ++count,
        decrement: () => --count,
        getValue: () => count
    }
}

const counter = createCounter();
counter.increment();
counter.increment();
counter.decrement();
console.log("counter value", counter.getValue()); 1

//privacy check
console.log(counter.count);
counter.count = 999; 
console.log(counter.getValue());

// Independent instances (closures don't leak between them)
const a = createCounter(10), b = createCounter(10);
a.increment(); a.increment();
b.decrement();
console.log(a.getValue(), b.getValue()); // 10+2=12, 10-1=9

//5 once(fn) → runs fn only on first call, returns cached result thereafter

function once(fn) {
    let called = false;
    let result;

    return function (...args) {
        if (!called) {
            called = true;
            result = fn.apply(this, args);
        }
        return result;
    }
}

const init = once((label) => {
    console.log("initializing: ", label);
    return {
        ready: true,
        at: Date.now()
    };
});

console.log(init("first"));
console.log(init("second"));
console.log(init("third"));

//One detail you got right that’s worth knowing you got right: you set called = true before invoking fn. If fn somehow calls init again during its own execution, that ordering prevents a second run. Flip those two lines and you have a re-entrancy bug. Interviewers who know this pattern look for it.

// Missing the memory line:
// if (!called) {
//     called = true;
//     result = fn.apply(this, args);
//     fn = null; // release the closed-over reference
// }

//Safe because fn is a parameter, and parameters are just local bindings you can reassign. After this, anything fn captured — a big config object, a DOM node, an entire module scope — becomes collectable. Without it, init pins that memory for the lifetime of the app. Say this out loud in an interview and you’ve marked yourself as someone who has debugged a real leak.

//Your test is well-chosen too — returning an object with Date.now() proves the cached value comes back, not a fresh call. Worth keeping that habit.