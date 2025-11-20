import { useState, useRef, useCallback, useEffect } from "react";
import { usePokemonsQuery } from "../__generated__/graphql";
import { usePokemons } from "../hooks/usePokemons";
import PokemonCard from "./PokemonCard/PokemonCard";

export const PokemonsList: React.FC = () => {
  const { pokemons, loading, error, loadMore, hasMore } = usePokemons();
  const loaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loaderRef.current) return;
    if (!hasMore) return; // plus à charger, on n'observe plus

    const observer = new IntersectionObserver(
      (entries) => {
        console.log("IntersectionObserver entries:", entries);
        const entry = entries[0];

        if (entry.isIntersecting && !loading) {
          loadMore();
        }
      },
      { threshold: 1.0, root: null, rootMargin: "100px" }
    );

    observer.observe(loaderRef.current);
    return () => {
      observer.disconnect();
    };
  }, [loadMore, hasMore]);

  if (loading && !pokemons) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  console.log("Fetched pokemons:", pokemons);

  return (
    <div>
      <h1>Pokémons</h1>
      <ul>
        {pokemons.map((p, key) => (
          <>
            {key % 20 === 0 ? (
              <div>
                <hr key={`divider-${key}`}></hr>
                <p>Page {key / 20 + 1}</p>
              </div>
            ) : null}
            <PokemonCard
              key={key}
              name={p?.name || ""}
              url={p?.url || ""}
              image={p?.image || ""}
            />
          </>
        ))}
      </ul>

      {/* Observer target */}
      <div ref={loaderRef}>{loading && <p>Loading...</p>}</div>
    </div>
  );
};
