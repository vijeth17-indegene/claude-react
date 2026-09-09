import { createBrowserRouter, RouterProvider } from 'react-router'
import Home from './pages/Home.tsx'
import Movies from './pages/Movies.tsx'
import About from './pages/About.tsx'
import Contact from './pages/Contact.tsx'

import Layout from './Layout.tsx'

import ErrorPage from './pages/ErrorPage.tsx'
import NotFound from './pages/NotFound.tsx'

import MovieDetail, { movieLoader } from './pages/MovieDetail.tsx'

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <Home />},
      { path: "movies", element: <Movies />},
      { 
        path: "movies/:id", 
        element: <MovieDetail />, 
        loader: movieLoader,
        errorElement: <ErrorPage />,
      },
      { path: "about", element: <About />},
      { path: "contact", element: <Contact />},
      { path: "*", element: <NotFound /> }
    ]
  }
]);

export default function App() {
 return <RouterProvider router={router} />;
}