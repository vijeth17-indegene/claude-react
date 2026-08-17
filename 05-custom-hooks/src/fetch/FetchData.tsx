import useFetch from "../custom-hooks/useFetch"
interface user {
    id: number;
    name: string;
}

export default function FetchData() {
    const { data, loading, error, refetch } = useFetch<user[]>('https://jsonplaceholder.typicode.com/users');

    if (loading) {
        return <div>Loading...</div>
    }

    if (error) {
        return <div>Error: {error}</div>
    }

    if (!data) {
        return null;
    }

    return (
        <div>
            <button onClick={refetch}>Refetch</button>
            {data.length === 0 ? (
                <p>No users found.</p>
            ) : (
                <ul>
                    {data.map((post) => (
                        <li key={post.id}>
                            <h3>{post.name}</h3>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}