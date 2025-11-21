import { useState, useCallback, useRef, useMemo } from "react";
import { usePokemonsQuery } from "../__generated__/graphql";
import { FilterOption } from "../types/filters";
import { usePokemonsWithFilters } from "./usePokemonsWithFilters";

const LIMIT: number = 20;

export function usePokemons(filters?: FilterOption) {
  const [offset, setOffset] = useState<number>(0);
  const searchRef = useRef({});
  const fetchingRef = useRef(false);

  // Check if we have active type/generation filters
  const hasActiveFilters =
    filters &&
    ((filters.types && filters.types.length > 0) ||
      (filters.generations && filters.generations.length > 0));

  // Use filtered hook when filters are active
  const filteredResult = usePokemonsWithFilters(
    hasActiveFilters ? filters : undefined
  );

  // Use normal query when no filters
  const { data, loading, error, fetchMore } = usePokemonsQuery({
    variables: { limit: LIMIT, offset: 0 },
    notifyOnNetworkStatusChange: true,
    skip: hasActiveFilters, // Skip normal query if filters are active
  });

  const allPokemons = data?.pokemons?.results ?? [];
  const total = data?.pokemons?.count ?? 0;
  const hasMoreNormal = allPokemons.length < total;

  // Apply name filter to normal pokemons
  const filteredPokemons = useMemo(() => {
    if (hasActiveFilters) return [];

    if (!filters?.name) {
      return allPokemons;
    }

    return allPokemons.filter((pokemon) => {
      if (filters.name && pokemon?.name) {
        const searchTerm = filters.name.toLowerCase();
        if (!pokemon.name.toLowerCase().includes(searchTerm)) {
          return false;
        }
      }
      return true;
    });
  }, [allPokemons, filters?.name, hasActiveFilters]);

  const loadMoreNormal = useCallback(async () => {
    if (fetchingRef.current) return;
    if (!hasMoreNormal) return;
    fetchingRef.current = true;

    try {
      await fetchMore({
        variables: {
          offset: allPokemons.length,
          limit: LIMIT,
        },
      });
    } finally {
      fetchingRef.current = false;
    }
  }, [fetchMore, allPokemons.length, hasMoreNormal]);

  // Return filtered results if filters are active, otherwise normal results
  if (hasActiveFilters) {
    return filteredResult;
  }

  return {
    pokemons: filteredPokemons,
    loading,
    error,
    loadMore: loadMoreNormal,
    hasMore: hasMoreNormal,
  };
}
