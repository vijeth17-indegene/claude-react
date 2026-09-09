//object type annotation
interface User {
  name: string;
  age: number;
  email?: string; // optional property
  readonly id: number; // readonly property
}

let user: User = {
  name: "John",
  age: 30,
  id: 1,
};

user.id = 2; // Error: Cannot assign to 'id' because it is a read-only property.

//Interface with methods
interface Product {
  name: string;
  price: number;
  getDiscountedPrice(discount: number): number;
}

let laptop: Product = {
  name: "Laptop",
  price: 1000,
  getDiscountedPrice(discount: number): number {
    return this.price - this.price * discount;
  }
};

//interface to define the shape of an object, we can also use it to define the shape of a function. For example, we can define an interface for a function that takes two numbers and returns a number: