import type { Movie } from '../types';

type MovieCardProps = {
  movie: Movie;
};

export default function MovieCard({ movie }: MovieCardProps) {
  const poster =
    movie.Poster && movie.Poster !== "N/A" ? movie.Poster : null;

  return (
    <article className="movie-card">
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
    </article>
  );
}