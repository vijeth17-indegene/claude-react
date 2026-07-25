interface UserCardProps {
name: string;
role: string;
isOnline: boolean
}

function UserCard({name, role, isOnline} : UserCardProps) {
    return(
        <div className="user-card">
            <h1>{name}</h1>
            <h2>{role}</h2>
            <div>{isOnline ? <span className="green-circle"></span> : <span className="red-circle"></span>}</div>
        </div>
    );
}

export default UserCard;

