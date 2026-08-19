import type { Movie } from '../types';
import MovieCard from './MovieCard';

type MovieGridProps = {
    movies: Movie[];
}

export default function MovieGrid({ movies }: MovieGridProps) {
    return (
        <div className='movie-grid'>
            {movies.map((movie)=> (
                <MovieCard key={movie.imdbID} movie={movie} />
            ))}
        </div>
    );
}