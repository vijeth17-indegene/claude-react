import type { Movie } from '../types';
import MovieCard from './MovieCard';

type MovieGridProps = {
    movies: Movie[];
    onSelect: (id: string) => void;
    isFavorite: (id: string) => boolean;
    onToggleFavorite: (movie: Movie) => void;
}

export default function MovieGrid({ movies, onSelect, isFavorite, onToggleFavorite }: MovieGridProps) {
    return (
        <div className='movie-grid'>
            {movies.map((movie)=> (
                <MovieCard key={movie.imdbID} movie={movie} onSelect={onSelect} isFavorite={isFavorite(movie.imdbID)} onToggleFavorite={onToggleFavorite} />
            ))}
        </div>
    );
}