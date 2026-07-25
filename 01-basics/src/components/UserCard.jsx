function UserCard({ name, role, isOnline, onToggle }) {
    return (
        <div className="user-card">
            <p>{name}</p>
            <p>{role}</p>
            {isOnline
                ? <span className="green-circle"></span>
                : <span className="red-circle"></span>}
            <button onClick={onToggle}>Toggle Status</button>
        </div>
    );
}

export default UserCard;
