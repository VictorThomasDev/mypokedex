import React from 'react';
import { NavLink } from 'react-router';
import './Header.scss';

const Header: React.FC = () => {
  return (
    <header className="header">
      <nav className="nav">
        <NavLink to="/" className="nav__link">
          Accueil
        </NavLink>
        <NavLink to="/Pokedex" className="nav__link">
          Pokedex
        </NavLink>
      </nav>
    </header>
  );
};

export default Header;