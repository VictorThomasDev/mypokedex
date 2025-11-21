import { useState, useRef, useCallback, useEffect } from "react";
import { usePokemonsQuery } from "../__generated__/graphql";
import { usePokemons } from "../hooks/usePokemons";
import { FilterOption } from "../types/filters";
import PokemonCard from "./PokemonCard/PokemonCard";
import FilterBar from "./FilterBar/FilterBar";
import "./PokemonsList.scss";

export const PokemonsList: React.FC = () => {
  const [filters, setFilters] = useState<FilterOption>({});
  const { pokemons, loading, error, loadMore, hasMore } = usePokemons(filters);
  const loaderRef = useRef<HTMLDivElement>(null);

  const handleFilterChange = useCallback((newFilters: FilterOption) => {
    setFilters(newFilters);
  }, []);

  const handleClear = useCallback(() => {
    setFilters({});
  }, []);

  // Setup intersection observer - only depend on loadMore and hasMore to avoid re-creating observer on filter changes
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
    <div className="pokemons-container">
      <div className="pokemons-header">
        <h1>Pokédex</h1>
        <p className="subtitle">Gotta Catch 'Em All!</p>
      </div>

      <div className="filter-section">
        <FilterBar onFilterChange={handleFilterChange} onClear={handleClear} />
      </div>

      {pokemons.length === 0 && !loading ? (
        <div className="empty-state">
          <p>No Pokémon found. Try a different search!</p>
        </div>
      ) : (
        <>
          {Array.from(
            { length: Math.ceil(pokemons.length / 20) },
            (_, pageIndex) => (
              <div key={`page-section-${pageIndex}`}>
                {pageIndex > 0 && (
                  <div className="page-divider-wrapper">
                    <div className="page-divider">
                      <p>Page {pageIndex + 1}</p>
                    </div>
                  </div>
                )}
                <ul className="pokemons-list">
                  {pokemons
                    .slice(pageIndex * 20, (pageIndex + 1) * 20)
                    .map((p, key) => (
                      <li
                        key={`pokemon-${pageIndex}-${key}`}
                        className="pokemon-item"
                      >
                        <PokemonCard
                          name={p?.name || ""}
                          url={p?.url || ""}
                          image={p?.image || ""}
                        />
                      </li>
                    ))}
                </ul>
              </div>
            )
          )}

          {/* Observer target */}
          {hasMore && (
            <div
              ref={loaderRef}
              className={`loader ${loading ? "loading" : ""}`}
            >
              <p>Loading more Pokémon...</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};
