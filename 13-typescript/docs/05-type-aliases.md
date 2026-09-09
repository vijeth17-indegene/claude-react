//type aliases
type Point = {
  x: number;
  y: number;
};

let point: Point = {
  x: 10,
  y: 20,
};

//type alias for primitive types
type ID = string | number;

let userId: ID = "abc123";
let productId: ID = 456;


//type alias vs Interface
//Type aliases can represent primitive types, union types, and tuples, while interfaces are primarily used for defining object shapes.


//interfaces can be extended using the extends keyword, allowing for inheritance and composition of multiple interfaces. Type aliases cannot be extended in the same way, but they can be combined using intersection types (&).

interface animal {
  name: string;
}

interface dog extends animal {
  breed: string;
}

let myDog: dog = {
  name: "Buddy",
  breed: "Golden Retriever",
};

//interfaces can be merged, allowing for the declaration of multiple interfaces with the same name to be combined into a single interface. Type aliases do not support merging.
interface animal {
  age: number;
}
interface animal {
  color: string;
}
let dog2: animal = {
  name: "Max",
  age: 5,
  color: "Brown",
};

// use interfaces for onject shapes
// type aliases for primitive types, union types, and tuples

interface User {
  id: number;
  name: string;
  email: string;
}
type UserID = number | string;