const message: string = "Hello, TypeScript!";
console.log(message);

//primtives
let username: string = "JohnDoe";
let age: number = 30;
let isAdmin: boolean = true;

//arrays
let numbers: number[] = [1, 2, 3, 4, 5];
let fruits: string[] = ["apple", "banana", "cherry"];

//tuples -> fixed-length array with specified types for each element
let person: [string, number] = ["JohnDoe", 30];

//enums -> a way to define a set of named constants
enum Color {
    Red,
    Green,
    Blue
}
let favoriteColor: Color = Color.Green;

//Any(avoid when possible)
let randomValue: any = 10;
randomValue = "Vijeth";
randomValue = true;

//unknown (safer than any)
let userInpur: unknown;
userInput = 5;
userInput = "text"

//void (for functions that don't return)
fucntion subscribe(message: string):void {
    console.log(message);
}

//Null and undefined
let nullValue: null = null;
let undefinedValue: undefined = undefined;
