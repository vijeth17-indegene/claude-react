import UserCard from "./components/UserCard";

function App() {

  const users = [
    { name: "ABC", role: "Designer", isOnline: true},
    { name: "DEF", role: "Engineer", isOnline: false}
  ];
  return (
    <div className="container">
      <div className="user-card-wrapper"> 
        {users.map((user) => (
          <UserCard key={user.name} name={user.name} role={user.role} isOnline={user.isOnline} />
        ))}
      </div>
    </div>
  );
}

export default App;