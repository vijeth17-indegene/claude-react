export type Movie = {
    Poster: string;
    Title: string;
    Type: string;
    Year: string;
    imdbID: string;
};

export type SearchResponse = 
    | { Response: "True"; Search: Movie[]; totalResults: string }
    | { Response: "False"; Error: string};

export type MovieDetail = {
    imdbID: string;
    Title: string;
    Year: string;
    Poster: string;
    Plot: string;
    imdbRating: string;
    Runtime: string;
    Genre: string;
    Director: string;
}