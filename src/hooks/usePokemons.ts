import { useState, useCallback, useRef } from "react";
import { usePokemonsQuery } from "../__generated__/graphql";

const LIMIT: number = 20;

export function usePokemons() {
  const [offset, setOffset] = useState<number>(0);
  const fetchingRef = useRef(false);

  const { data, loading, error, fetchMore } = usePokemonsQuery({
    variables: { limit: LIMIT, offset: 0 },
    notifyOnNetworkStatusChange: true,
  });
  const pokemons = data?.pokemons?.results ?? [];
  const total = data?.pokemons?.count ?? 0;
  const hasMore = pokemons.length < total;

  const loadMore = useCallback(async () => {
    if (fetchingRef.current) return; // déjà en cours
    if (!hasMore) return; // plus rien à charger
    fetchingRef.current = true;

    try {
      await fetchMore({
        variables: {
          offset: pokemons.length, // calcule offset depuis la taille actuelle
          limit: LIMIT,
        },
        // IMPORTANT : **ne pas** fournir updateQuery si tu utilises merge dans le cache
      });
    } finally {
      // petit délai facultatif pour laisser le client mettre à jour l'état loading
      fetchingRef.current = false;
    }
  }, [fetchMore, pokemons.length, hasMore]);

  return {
    pokemons: data?.pokemons?.results ?? [],
    loading,
    error,
    loadMore,
    hasMore,
  };
}
