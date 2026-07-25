interface UserCardProps {
    name: string;
    role: string;
    isOnline: boolean;
    onToggle: () => void;
}

function UserCard({name, role, isOnline, onToggle} : UserCardProps) {
    return(
        <div className="user-card">
            <p>{name}</p>
            <p>{role}</p>
            {isOnline ? <span className="green-circle"></span> : <span className="red-circle"></span>}
            <button onClick={onToggle}>Toggle Status</button>
        </div>
    );
}

export default UserCard;

