import type { MovieDetail } from '../types';

type MovieDetailViewProps = {
    movie: MovieDetail;
    onBack: () => void;
};

export default function MovieDetailView({ movie, onBack }: MovieDetailViewProps) {
    const poster = movie.Poster && movie.Poster !== "N/A" ? movie.Poster : null;
    console.log("MovieDetail from OMDB:", movie);

    return (
        <div className="movie-detail">
            <button onClick={onBack}>Back</button>

            <div className="movie-detail-content">
                {poster ? (
                    <img src={poster} alt={movie.Title} />
                ) : (
                    <div className="poster-placeholder">No image</div>
                )}

                <div>
                    <h2>{movie.Title} ({movie.Year})</h2>
                    <p><strong>Genre:</strong> {movie.Genre}</p>
                    <p><strong>Director:</strong> {movie.Director}</p>
                    <p><strong>Runtime:</strong> {movie.Runtime}</p>
                    <p><strong>IMDb:</strong> {movie.imdbRating}</p>
                    <p>{movie.Plot}</p>
                </div>
            </div>
        </div>
    );
}