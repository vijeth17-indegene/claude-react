import { useState } from "react";
import './App.css'
import SearchBar from "./components/SearchBar";
import Skeleton from "./components/Skeleton";
import MovieGrid from "./components/MovieGrid";
import MovieCard from "./components/MovieCard";
import MovieDetailView from "./components/MovieDetailView";
import useDebounce from "./custom-hooks/useDebounce";
import useFetch from "./custom-hooks/useFetch";
import useLocalStorage from "./custom-hooks/useLocalStorage";
import type { Movie, MovieDetail, SearchResponse } from "./types";

import Card from './composition/Card';
import ModalDemo from "./composition/ModalDemo";

import Tabs from "./composition/Tabs";

import ThemeToggleButton from "./context/ThemeToggleButton";
import ThemeReader from "./context/ThemeReader";
import CounterReader from "./context/CounterReader";

export default function App() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const debouncedTerm = useDebounce(searchTerm, 500);
  const url = debouncedTerm ? `https://www.omdbapi.com/?apikey=${import.meta.env.VITE_OMDB_KEY}&s=${encodeURIComponent(debouncedTerm)}`: "";
  const { data:searchData, loading:searchLoading, error:searchError } = useFetch<SearchResponse>(url);

  const detailUrl = selectedId ? `https://www.omdbapi.com/?apikey=${import.meta.env.VITE_OMDB_KEY}&i=${selectedId}&plot=full`: '';
  const { data:detail, loading:detailLoading, error:detailError} = useFetch<MovieDetail>(detailUrl);

  const [favorites, setFavorites] = useLocalStorage<Movie[]>("favorites", []);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const isFavorite = (id:string) => favorites.some(m => m.imdbID === id);

  const toggleFavorite = (movie: Movie) => {
    setFavorites(prev => 
      prev.some(m => m.imdbID === movie.imdbID)
        ? prev.filter(m => m.imdbID !== movie.imdbID) //remove
        : [...prev, movie] //add
    );
  };

  function renderResults() {
    if(selectedId) {
      if (detailLoading) return <Skeleton />;
      if (detailError) return <p>Error: {detailError}</p>;
      if (!detail) return null;
      return <MovieDetailView movie = {detail} onBack = {() => setSelectedId(null)}  />;
    }

    if (showFavoritesOnly) {
      if(favorites.length === 0) return <p>No favorites yet.</p>;
      return (
        <MovieGrid>
          {favorites.map(movie => (
            <MovieCard
              key={movie.imdbID}
              movie={movie}
              onSelect={setSelectedId} 
              isFavorite={isFavorite(movie.imdbID)} 
              onToggleFavorite={toggleFavorite}
            />
          ))}
        </MovieGrid>
      );
    }

    if (searchLoading) return <Skeleton />;
    if (searchError) return <p>Error: {searchError}</p>;
    if (!searchData) return null;
    if (searchData.Response === 'False') return <p>No Movies Found</p>;
    // return <MovieGrid movies = {searchData.Search} onSelect={setSelectedId} isFavorite={isFavorite} onToggleFavorite={toggleFavorite}  />;

    

    return(
      <MovieGrid>
        {searchData.Search.map(movie => (
          <MovieCard
              key={movie.imdbID}
              movie={movie}
              onSelect={setSelectedId}
              isFavorite={isFavorite(movie.imdbID)}
              onToggleFavorite={toggleFavorite}
            />
        ))}
      </MovieGrid>
    );
    
  }

  return(
    <>
        <h1>Movie Search Dashboard</h1>
        <div>
          <label htmlFor="show-favorites">
            Show Favorites Only
            <input id="show-favorites" type="checkbox" checked={showFavoritesOnly} onChange={(e) => setShowFavoritesOnly(e.target.checked)}  />
          </label>
        </div>
        <SearchBar value={searchTerm} onChange={setSearchTerm} />
        {renderResults()}

        <h2>Composition</h2>

        <Card>
          <h3>This is the basic example of Card</h3>
        </Card>

        <ModalDemo />

        <Tabs defaultTab="profile">
          <Tabs.List>
            <Tabs.Tab id="profile">Profile</Tabs.Tab>
            <Tabs.Tab id="settings">Settings</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel id="profile">Profile Tab</Tabs.Panel>
          <Tabs.Panel id="settings">Settings</Tabs.Panel>
        </Tabs>

        <br />
        <br />
        <h2>Context</h2>
        <br />
        <ThemeToggleButton />
        <ThemeReader />
        <CounterReader />
    </>
  );
}