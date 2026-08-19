import { useState } from "react";
import SearchBar from "./components/SearchBar";
import useDebounce from "./custom-hooks/useDebounce";
import useFetch from "./custom-hooks/useFetch";
import type { SearchResponse } from "./types";

export default function App() {
  const [searchTerm, setSearchTerm] = useState("");

  const debouncedTerm = useDebounce(searchTerm, 500);
  
  const url = debouncedTerm ? `https://www.omdbapi.com/?apikey=${import.meta.env.VITE_OMDB_KEY}&s=${encodeURIComponent(debouncedTerm)}`: "";
  const { data, loading, error } = useFetch<SearchResponse>(url);

  return(
    <>
      <h1>Movie Search Dashboard</h1>
      <p>typing: {searchTerm} | debounced: {debouncedTerm}</p>
      <SearchBar value={searchTerm} onChange={setSearchTerm} />

      {loading && <p>Loading... skeleton comes here</p>}

      {error && <p>Error: {error}</p>}

      {!loading &&
        !error &&
         data?.Response === "False" && (
          <p>No Movies Found</p>
      )}

      {!loading &&
        !error &&
          data?.Response === "True" && (
            <div>
              {data.Search.map((movie) => (
                <p key={movie.imdbID}>
                  {movie.Title} ({movie.Year})
                </p>
              ))}
            </div>
          )
        }
    </>
  );
}