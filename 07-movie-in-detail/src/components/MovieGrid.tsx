import type { Movie } from '../types';
import MovieCard from './MovieCard';

type MovieGridProps = {
    movies: Movie[];
    onSelect: (id: string) => void;
}

export default function MovieGrid({ movies, onSelect }: MovieGridProps) {
    return (
        <div className='movie-grid'>
            {movies.map((movie)=> (
                <MovieCard key={movie.imdbID} movie={movie} onSelect={onSelect} />
            ))}
        </div>
    );
}