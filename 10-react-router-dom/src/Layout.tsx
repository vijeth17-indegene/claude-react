import { NavLink, Outlet } from 'react-router';

export default function Layout() {

    return(
        <>
            <nav>
                <NavLink to="/" end>Home1</NavLink> |
                <NavLink to="/movies">Movies</NavLink> | 
                <NavLink to="/about">About</NavLink> | 
                <NavLink to="/contact">Contact</NavLink>
            </nav>
            <main>
                <Outlet /> 
            </main>
        </>
    );
}

//NavLink adds the active class automatically in v6.4.0 and above. In v6.3.0 and below, you need to use the isActive prop to add the active class manually.
// className={({ isActive }) => (isActive ? 'active' : '')} is what you need when using CSS Modules or Tailwind CSS. This is because the active class is not available in the global scope when using CSS Modules or Tailwind CSS.

//<NavLink to="/"> will always be active. By default NavLink matches by prefix and / is a prefix of every path - so Home stays highlighted on /movies, /about, and /contact. To fix this, you can use the end prop on the Home NavLink. This will make it match only when the location is exactly /.