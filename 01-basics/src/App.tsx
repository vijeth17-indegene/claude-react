import UserCard from "./components/UserCard";

function App() {

  const users = [
    { name: "ABC", role: "Designer"},
    { name: "DEF", role: "Engineer"},
    { name: "GHI", role: "Engineer"},
    { name: "DEF", role: "Engineer"},
  ];
  return (
    <div className="container">
      <div className="user-card-wrapper"> 
        {users.map((user, index) => (
          <UserCard key={index} {...user} />
        ))}
      </div>
    </div>
  );
}

export default App;