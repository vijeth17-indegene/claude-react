import type { Movie } from '../types';

type MovieCardProps = {
  movie: Movie;
  onSelect: (id:string) => void;
};

export default function MovieCard({ movie, onSelect }: MovieCardProps) {
  const poster =
    movie.Poster && movie.Poster !== "N/A" ? movie.Poster : null;

  return (
    <button type="button" onClick={() => onSelect(movie.imdbID)} className="movie-card">
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
  );
}