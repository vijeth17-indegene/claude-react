import { useState } from 'react';

interface UserCardProps {
name: string;
role: string;
// isOnline: boolean;
}

function UserCard({name, role} : UserCardProps) {
    const [isOnline, setIsOnline] =  useState(false);

    return(
        <div className="user-card">
            <p>{name}</p>
            <p>{role}</p>
            {isOnline ? <span className="green-circle"></span> : <span className="red-circle"></span>}
            <button onClick={() => setIsOnline(!isOnline)}>Toggle Status</button>
        </div>
    );
}

export default UserCard;

