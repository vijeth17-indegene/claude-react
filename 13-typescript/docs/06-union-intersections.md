//union types (OR)
type Status = "success" | "error" | "loading";

function handleStatus(status: Status): void {
  console.log(`Current status: ${status}`);
}

handleStatus("success"); // Valid
handleStatus("error"); // Valid
handleStatus("loading"); // Valid

// Intersection types (AND)

interface Colorful {
  color: string;
}

interface Circle {
  radius: number;
}

type ColorfulCircle = Colorful & Circle;

const myCircle: ColorfulCircle = {
  color: "red",
  radius: 10,
};
