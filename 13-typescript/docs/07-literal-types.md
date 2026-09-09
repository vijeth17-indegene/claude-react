// string Literal Types
let direction: "left" | "right" | "up" | "down";

//Number Literal Types
let zeroOrOne: 0 | 1;

//Combining with other types

//where can we use literal types? we can use them in objects, functions, and arrays

type SuccessResponse = {
  status: "success";
  data: string;
};

type ErrorResponse = {
  status: "error";
  error: string;
};

type ApiResponse = SuccessResponse | ErrorResponse;