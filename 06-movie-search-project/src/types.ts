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