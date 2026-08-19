import { useState } from "react";
import './App.css'
import SearchBar from "./components/SearchBar";
import Skeleton from "./components/Skeleton";
import MovieGrid from "./components/MovieGrid";
import useDebounce from "./custom-hooks/useDebounce";
import useFetch from "./custom-hooks/useFetch";
import type { SearchResponse } from "./types";

export default function App() {
  const [searchTerm, setSearchTerm] = useState("");

  const debouncedTerm = useDebounce(searchTerm, 500);
  
  const url = debouncedTerm ? `https://www.omdbapi.com/?apikey=${import.meta.env.VITE_OMDB_KEY}&s=${encodeURIComponent(debouncedTerm)}`: "";
  const { data, loading, error } = useFetch<SearchResponse>(url);

  function renderResults() {
    if (loading) return <Skeleton />;
    if (error) return <p>Error: {error}</p>;
    if (!data) return null;
    if (data.Response === 'False') return <p>No Movies Found</p>;
    return <MovieGrid movies = {data.Search} />;
  }

  return(
    <>
        <h1>Movie Search Dashboard</h1>
        <p>typing: {searchTerm} | debounced: {debouncedTerm}</p>
        <SearchBar value={searchTerm} onChange={setSearchTerm} />
        {renderResults()}
    </>
  );
}