import { Link, useParams } from "react-router";
import { movies } from "./Movies";

export default function MovieDetail() {
    const { id } = useParams<{id: string}>();

    const movie = movies.find(m => m.id === id);

    if(!movie) {
        return (
            <>
                <h1>No Movie Selected</h1>
                <Link to="/movies" >Back to Movies</Link>
            </>
        )
    }

    return(
        <>
          <h1>{movie?.title}</h1>  
          <p><strong>Year:</strong> {movie?.year}</p>
          <p><strong>Director:</strong> {movie?.director}</p>
          <Link to="/movies">Back to Movies</Link>
        </>
    );
}

//const movie = movies.find(m => m.id === id);
// This line searches the movies array for a movie object with an id that matches the id from the URL parameters. If found, it assigns the movie object to the variable 'movie'. If not found, 'movie' will be undefined.

//const { id } = useParams<{id: string}>();
// This line extracts the 'id' parameter from the URL using the useParams hook. The type annotation ensures that 'id' is treated as a string.

// The useParams hook is used to access the URL parameters of the current route. In this case, it is used to get the 'id' parameter from the URL.