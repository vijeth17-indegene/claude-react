import { useState } from "react";
import './App.css'
import SearchBar from "./components/SearchBar";
import Skeleton from "./components/Skeleton";
import MovieGrid from "./components/MovieGrid";
import MovieDetailView from "./components/MovieDetailView";
import useDebounce from "./custom-hooks/useDebounce";
import useFetch from "./custom-hooks/useFetch";
import type { MovieDetail, SearchResponse } from "./types";


export default function App() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const debouncedTerm = useDebounce(searchTerm, 500);
  
  const url = debouncedTerm ? `https://www.omdbapi.com/?apikey=${import.meta.env.VITE_OMDB_KEY}&s=${encodeURIComponent(debouncedTerm)}`: "";
  const { data:searchData, loading:searchLoading, error:searchError } = useFetch<SearchResponse>(url);

  const detailUrl = selectedId ? `https://www.omdbapi.com/?apikey=${import.meta.env.VITE_OMDB_KEY}&i=${selectedId}&plot=full`: '';
  const { data:detail, loading:detailLoading, error:detailError} = useFetch<MovieDetail>(detailUrl);

  function renderResults() {
    if(selectedId) {
      if (detailLoading) return <Skeleton />;
      if (detailError) return <p>Error: {detailError}</p>;
      if (!detail) return null;
      return <MovieDetailView movie = {detail} onBack = {() => setSelectedId(null)}  />;
    }

    if (searchLoading) return <Skeleton />;
    if (searchError) return <p>Error: {searchError}</p>;
    if (!searchData) return null;
    if (searchData.Response === 'False') return <p>No Movies Found</p>;
    return <MovieGrid movies = {searchData.Search} onSelect={setSelectedId}  />;
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