//Type inference is the ability of TypeScript to automatically deduce the type of a variable based on its value.
//TypeScript uses type inference to determine the type of a variable when it is not explicitly specified.
//For example, if you declare a variable and assign it a value, TypeScript will infer the type of that variable based on the value assigned to it.

let message = "Hello, TypeScript!"; // TypeScript infers the type of 'message' as 'string'
message = 4; // Error: Type 'number' is not assignable to type 'string'

