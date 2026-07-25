import { useState } from 'react';
import UserCard from "./components/UserCard";

interface User {
  id: number;
  name: string;
  role: string;
}

function App() {

  const users: User[] = [
    { id: 1, name: "ABC", role: "Designer"},
    { id: 2, name: "DEF", role: "Engineer"},
    { id: 3, name: "GHI", role: "PM"},
    { id: 4, name: "DEF", role: "QA"},
  ];

  const [onlineStatus, setOnlineStatus] = useState<Record<number, boolean>>({});

  function toggleStatus(id: number) {
    setOnlineStatus((prev) => ({...prev, [id]: !prev[id]}));
  }

  const onlineCount = Object.values(onlineStatus).filter(Boolean).length;
  return (
    <div className="container">
      <h1>Team ({onlineCount} online)</h1>
      <div className="user-card-wrapper"> 
        {users.map((user) => (
          <UserCard 
            key={user.id}
            name={user.name}
            role={user.role}
            isOnline = {!!onlineStatus[user.id]}
            onToggle={()=>toggleStatus(user.id)}/>
        ))}
      </div>
    </div>
  );
}

export default App;