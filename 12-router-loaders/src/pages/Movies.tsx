/* eslint-disable react-refresh/only-export-components */

import { Link, useSearchParams } from 'react-router';

export type Category = 'action' | 'sci-fi' | 'drama';


export type Movie = {
    id: string;
    title: string;
    year: number;
    director: string;
    category: Category;
}

export const movies: Movie[] = [
    { id: "1", title: "Inception", year: 2010, director: "Christopher Nolan", category: "sci-fi" },
    { id: "2", title: "The Matrix", year: 1999, director: "Lana Wachowski, Lilly Wachowski", category: "action" },
    { id: "3", title: "Interstellar", year: 2014, director: "Christopher Nolan", category: "sci-fi" },
    { id: "4", title: "The Dark Knight", year: 2008, director: "Christopher Nolan", category: "action" },
    { id: "5", title: "The Prestige", year: 2006, director: "Christopher Nolan", category: "drama" },
];

const CATEGORIES: Category[] = ['action', 'sci-fi', 'drama'];

export default function Movies() {
    const [searchParams, setSearchParams] = useSearchParams();
    const category = searchParams.get('category');   //get the 'category' query parameter from the URL
    

    const visible = category 
        ? movies.filter(m => m.category === category)
        : movies;
    
    //console.log(visible);
    
    function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
        const value = e.target.value;

        if(value === 'all') {
            searchParams.delete('category'); //why delete here? Because we want to remove the 'category' query parameter from the URL when 'all' is selected, effectively showing all movies.
            setSearchParams(searchParams); //update the URL with the modified search parameters
        } else {
            setSearchParams({category: value});
        }

        console.log(value);

        //console.log(searchParams); //log the current search parameters to the console for debugging purposes
    }

    return(
        <>
            <h1>Movies</h1>

            <label htmlFor="category">
                Category: {' '}
                <select name="" id="category"
                    value={category ?? 'all'}
                    onChange={handleChange}
                >
                    <option value="all">All</option>
                    {CATEGORIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                    ))}
                </select>
            </label>



            {visible.length === 0 ? (
                <p>No movies in this category.</p>
            ): (
                <ul>
                    {visible.map(m => (
                        <li key={m.id}>
                            <Link to={`/movies/${m.id}`}>{m.title}</Link>
                            {' '}<em>({m.category})</em>
                        </li>
                    ))}
                </ul>
            )}
        </>
    );
}


// const [searchParams, setSearchParams] = useSearchParams();
//uses of useSearchParams to read and modify the query parameters in the URL.
// 'searchParams' is an instance of URLSearchParams that allows reading the current query parameters.
// 'setSearchParams' is a function to update the query parameters in the URL. Triggers a re-render and updates the component with the new query parameters.

// const category = searchParams.get('category');
// 'category' holds the value of the 'category' query parameter from the URL. If the parameter is not present, it will be null.

// 'get()' retrieves the first value associated with the given search parameter.
// 'getAll()' retrieves all values associated with the given search parameter.
// 'has()' checks if a given search parameter exists.
// 'set()' sets the value of a given search parameter.
// 'delete()' removes the given search parameter. 


{/* <label htmlFor="category">
    Category: {' '}
    <select name="" id="category"
        value={category ?? 'all'}
        onChange={handleChange}
    >
        <option value="all">All</option>
        {CATEGORIES.map(c => (
            <option key={c} value={c}>{c}</option>
        ))}
    </select>
</label> */}

//explain value={category ?? 'all'}
// The value attribute of the select element is set to the current category.
// If category is null or undefined, it defaults to 'all' using the nullish coalescing operator (??).