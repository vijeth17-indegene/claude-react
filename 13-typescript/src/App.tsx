
//Generic Components
import List from "./components/ui/List";

type Movie = {
  imdbID: string;
  title: string;
  year: number;
}

const movies: Movie[] = [
  { imdbID: "tt1", title: "Batman", year: 2005 },
  { imdbID: "tt2", title: "Superman", year: 2022 },
];

type User = {
  id: number;
  name: string;
  email: string;
}

const users: User[] = [
  { id: 1, name: "Ada", email: "ada@example.com" },
  { id: 2, name: "Linus", email: "linus@example.com" },
]

import { Button, Input } from "@/components/ui/index";


//HOCs

import useWindowWidth from "./HOCs/useWindowWidth";
import withWindowWidth from "./HOCs/withWindowWidth";
import WindowWidth from "./HOCs/WindowWidth"; 

//using hook
function HookConsumer() {
  const width = useWindowWidth();
  return <p>Hook says: {width}px</p>;
}

//using withWindowWidth Component
// 1. Plain component — expects `width` as a normal prop
type WidthDisplayProps = { label: string; width: number };
function WidthDisplay({ label, width }: WidthDisplayProps) {
  return <p>{label}: {width}px</p>;
}

// 2. Wrap ONCE at module scope — never inside App()
const EnhancedWidthDisplay = withWindowWidth(WidthDisplay);

export default function App() {
  return (
    <div className="App">
      <h2>Movies</h2>
      <List
        items={movies}
        getKey={(movie) => movie.imdbID}
        renderItem={(movie) => (
          <>
            {movie.title} ({movie.year})
          </>
        ) }
      />

      <h2>Users</h2>
      <List
        items={users}
        getKey={(user) => String(user.id)}
        renderItem={(user) => <span>{user.name} — {user.email}</span>}
      />


      <h2>Discriminated unions</h2>
      <Button variant="link" href="/home">Home</Button>
      <Button variant="button" onClick={() => alert("hi")}>Click</Button>

      {/* <Button variant="link" onClick={() => {}}>Bad</Button>
      <Button variant="link">NoHref</Button>
      <Button variant="button" href="/x">Wrong</Button>
      <Button variant="button" onClick={() => {}} href="/x">X</Button> */}

        <h2>ComponentProps - extending HTML Elements</h2>


        <Input
          label="Name"
          onChange={(e) => console.log(e.target.value)} // e: ChangeEvent<HTMLInputElement>
          aria-describedby="name-hint"
        />
        <Input label="Email" type="email" placeholder="you@example.com" required />


        <h2>HOCs</h2>
        <HookConsumer />

        <WindowWidth>
          {(width) => <p>Render prop says: {width}px</p>}
        </WindowWidth>

        <h2>HOC — withWindowWidth</h2>
        <EnhancedWidthDisplay label="HOC says" />
        
    </div>

    
  );
}