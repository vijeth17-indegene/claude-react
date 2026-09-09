//Basic functions with types
function add(a: number, b: number): number {
  return a + b;
}

//optional parameters 
//In TypeScript, you can define optional parameters by adding a question mark (?) after the parameter name.
function greet(name: string, greeting?: string): string {
    if (greeting) {
        return `${greeting}, ${name}!`;
    }
    return `Hello, ${name}!`;
}

//Default parameters
//You can also provide default values for parameters in TypeScript. If a parameter is not provided, the default value will be used.
function multiply(a: number, b: number = 1): number {
    return a * b;
}

//Rest parameters
//TypeScript allows you to use rest parameters to represent an indefinite number of arguments as an array.
function sum(...numbers: number[]): number {
    return numbers.reduce((total, num) => total + num, 0);
}

//Arrow functions
//Arrow functions provide a concise syntax for writing functions in TypeScript. They also lexically bind the this value, which can be useful in certain contexts.
const square = (x: number): number => x * x;

//Function types
//You can define function types in TypeScript to specify the types of parameters and the return type of a function.
type BinaryOperation = (a: number, b: number) => number;
const divide: BinaryOperation = (a, b) => a / b;