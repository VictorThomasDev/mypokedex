import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { ApolloProvider } from "@apollo/client/react";
import { apolloClient } from './lib/apolloClient';
import Header from './layout/Header/Header';
import Pokedex from './pages/Pokedex/Pokedex';

// lazy-load pages
const HomePage = lazy(() => import('./pages/Home/Home'));
//const PokemonPage = lazy(() => import('./pages/PokemonPage'));
//const NotFound = lazy(() => import('./pages/NotFound'));

const App: React.FC = () => (
  <ApolloProvider client={apolloClient}>
    <BrowserRouter>
    <Header></Header>
      <Suspense fallback={<div>Chargement de la page…</div>}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/Pokedex" element={<Pokedex />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  </ApolloProvider>
);


export default App;