/* eslint-disable react-refresh/only-export-components */
import { Link, useLoaderData, type LoaderFunctionArgs } from "react-router";
import { movies, type Movie } from "./Movies";

export async function movieLoader({ params }: LoaderFunctionArgs) {
    await new Promise(r => setTimeout(r, 1000));

    const movie = movies.find(m => m.id === params.id);
    if (!movie) throw new Response("Movie not found", { status: 404});

    return movie;
}


export default function MovieDetail() {

    const movie = useLoaderData() as Movie;
    return(
        <>
          <h1>{movie.title}</h1>  
          <p><strong>Year:</strong> {movie.year}</p>
          <p><strong>Director:</strong> {movie.director}</p>
          <Link to="/movies">Back to Movies</Link>
        </>
    );
}

//const movie = movies.find(m => m.id === id);
// This line searches the movies array for a movie object with an id that matches the id from the URL parameters. If found, it assigns the movie object to the variable 'movie'. If not found, 'movie' will be undefined.

//const { id } = useParams<{id: string}>();
// This line extracts the 'id' parameter from the URL using the useParams hook. The type annotation ensures that 'id' is treated as a string.

// The useParams hook is used to access the URL parameters of the current route. In this case, it is used to get the 'id' parameter from the URL.