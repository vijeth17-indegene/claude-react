import type { Movie } from '../types';

type MovieCardProps = {
  movie: Movie;
  onSelect: (id:string) => void;
  isFavorite: boolean;
  onToggleFavorite: (movie: Movie) => void;
};

export default function MovieCard({ movie, onSelect, isFavorite, onToggleFavorite }: MovieCardProps) {
  const poster =
    movie.Poster && movie.Poster !== "N/A" ? movie.Poster : null;

  return (
    
    <div className='movie-card'>
      <button
        type="button"
        className="fav-btn"
        aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite(movie);
        }}
      >
        {isFavorite ? "★" : "☆"}
      </button>
      <button type="button" onClick={() => onSelect(movie.imdbID)}>
        {poster ? (
          <img
            src={poster}
            alt={movie.Title}
            loading="lazy"
          />
        ) : (
          <div className="poster-placeholder" aria-label="No image available">
            No image
          </div>
        )}
        <h3>{movie.Title}</h3>
        <p>
          {movie.Year} - {movie.Type}
        </p>
      </button>
    
    </div>
    
    
  );
}