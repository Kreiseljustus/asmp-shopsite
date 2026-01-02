import { Link, useLocation } from 'react-router-dom';
import { NAV_ROUTES } from '../../constants/routes';
import './Navbar.css';

function Navbar() {
  const location = useLocation();

  return (
    <nav className="navbar">
      {NAV_ROUTES.map((route) => (
        <Link
          key={route.path}
          to={route.path}
          className={`nav-link ${location.pathname === route.path ? 'active' : ''}`}
        >
          {route.label}
        </Link>
      ))}
    </nav>
  );
}

export default Navbar;

