import { useState, useCallback, useRef, useEffect } from "react";
import { FilterOption, PokemonWithDetails } from "../types/filters";
import { apolloClient } from "../lib/apolloClient";
import { gql } from "@apollo/client";

const LIMIT = 20;
const BATCH_SIZE = 50; // Fetch more to filter from
const PARALLEL_REQUESTS = 10; // Number of parallel detail requests

const POKEMON_DETAIL_QUERY = gql`
  query Pokemon($name: String!) {
    pokemon(name: $name) {
      id
      name
      types {
        type {
          name
        }
      }
      species {
        url
      }
    }
  }
`;

// Extract generation from species URL
const getGenerationFromUrl = (url: string): number => {
  const match = url.match(/\/(\d+)\/?$/);
  const id = match ? parseInt(match[1]) : 0;

  if (id >= 1 && id <= 151) return 1;
  if (id >= 152 && id <= 251) return 2;
  if (id >= 252 && id <= 386) return 3;
  if (id >= 387 && id <= 493) return 4;
  if (id >= 494 && id <= 649) return 5;
  if (id >= 650 && id <= 721) return 6;
  if (id >= 722 && id <= 809) return 7;
  if (id >= 810 && id <= 905) return 8;
  return 9;
};

export function usePokemonsWithFilters(filters?: FilterOption) {
  const [filteredPokemons, setFilteredPokemons] = useState<
    PokemonWithDetails[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const fetchingRef = useRef(false);
  const detailsCacheRef = useRef<Map<string, PokemonWithDetails>>(new Map());
  const seenPokemonsRef = useRef<Set<string>>(new Set()); // Track seen pokemon names

  const hasActiveFilters =
    filters &&
    ((filters.types && filters.types.length > 0) ||
      (filters.generations && filters.generations.length > 0));

  // Fetch pokemon details with retry and error handling
  const fetchPokemonDetails = async (
    name: string
  ): Promise<PokemonWithDetails | null> => {
    try {
      const cached = detailsCacheRef.current.get(name);
      if (cached) return cached;

      const { data } = await apolloClient.query({
        query: POKEMON_DETAIL_QUERY,
        variables: { name },
        fetchPolicy: "cache-first", // Use cache when available
      });

      if (data?.pokemon) {
        const types = data.pokemon.types?.map((t: any) => t.type.name) || [];
        const generation = data.pokemon.species?.url
          ? getGenerationFromUrl(data.pokemon.species.url)
          : 0;

        const pokemonWithDetails: PokemonWithDetails = {
          name: data.pokemon.name,
          url: `https://pokeapi.co/api/v2/pokemon/${data.pokemon.id}/`,
          image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${data.pokemon.id}.png`,
          types,
          generation,
        };

        detailsCacheRef.current.set(name, pokemonWithDetails);
        return pokemonWithDetails;
      }
    } catch (error) {
      console.error(`Error fetching details for ${name}:`, error);
    }
    return null;
  };

  // Fetch multiple pokemon details in parallel
  const fetchPokemonDetailsBatch = async (
    names: string[]
  ): Promise<(PokemonWithDetails | null)[]> => {
    const promises: Promise<PokemonWithDetails | null>[] = [];

    for (let i = 0; i < names.length; i += PARALLEL_REQUESTS) {
      const batch = names.slice(i, i + PARALLEL_REQUESTS);
      const batchPromises = batch.map((name) => fetchPokemonDetails(name));
      promises.push(...batchPromises);

      // Wait for this batch before starting the next to avoid overwhelming the API
      if (i + PARALLEL_REQUESTS < names.length) {
        await Promise.all(batchPromises);
      }
    }

    return Promise.all(promises);
  };

  // Check if pokemon matches filters (optimized with early returns)
  const matchesFilters = (pokemon: PokemonWithDetails): boolean => {
    if (!filters) return true;

    // Filter by name first (fastest check)
    if (filters.name && pokemon.name) {
      const searchTerm = filters.name.toLowerCase();
      if (!pokemon.name.toLowerCase().includes(searchTerm)) {
        return false;
      }
    }

    // Filter by types
    if (filters.types && filters.types.length > 0) {
      if (!pokemon.types || pokemon.types.length === 0) return false;
      const hasMatchingType = pokemon.types.some((type) =>
        filters.types!.includes(type)
      );
      if (!hasMatchingType) return false;
    }

    // Filter by generation
    if (filters.generations && filters.generations.length > 0) {
      const genMatches = filters.generations.some(
        (gen) => pokemon.generation === parseInt(gen)
      );
      if (!genMatches) return false;
    }

    return true;
  };

  // Fetch and filter pokemons
  const fetchFilteredPokemons = async (startOffset: number) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setIsLoading(true);

    console.log(`🔍 Starting fetch from offset: ${startOffset}`);

    try {
      const collected: PokemonWithDetails[] = [];
      let currentOffset = startOffset;
      let totalApiCount = 0;
      const MAX_BATCHES = 3; // Maximum 3 batches of 50 per load attempt
      let batchesFetched = 0;

      // Continue fetching batches until we have 20 matches or reach max batches
      while (collected.length < LIMIT && batchesFetched < MAX_BATCHES) {
        console.log(
          `📦 Fetching batch ${batchesFetched + 1} from offset ${currentOffset}`
        );

        const { data } = await apolloClient.query({
          query: gql`
            query Pokemons($limit: Int, $offset: Int) {
              pokemons(limit: $limit, offset: $offset) {
                count
                results {
                  url
                  name
                  image
                }
              }
            }
          `,
          variables: {
            limit: BATCH_SIZE,
            offset: currentOffset,
          },
          fetchPolicy: "cache-first", // Use cache when available for list
        });

        if (data?.pokemons?.results) {
          const results = data.pokemons.results;
          totalApiCount = data.pokemons.count || 0;
          batchesFetched++;

          console.log(
            `📦 Received ${results.length} pokemon in batch ${batchesFetched}`
          );

          // If no more results, break
          if (results.length === 0) {
            console.log("⚠️ No more results available");
            break;
          }

          // Filter out already seen pokemon
          const unseenPokemon = results.filter(
            (pokemon: any) => !seenPokemonsRef.current.has(pokemon.name)
          );

          if (unseenPokemon.length === 0) {
            console.log("⏭️ All pokemon in batch already seen, skipping...");
            currentOffset += BATCH_SIZE;
            continue;
          }

          // Fetch details for all unseen pokemon in parallel
          const pokemonNames = unseenPokemon.map((p: any) => p.name);
          const detailsResults = await fetchPokemonDetailsBatch(pokemonNames);

          // Filter and collect matching pokemon
          for (let i = 0; i < detailsResults.length; i++) {
            if (collected.length >= LIMIT) break;

            const details = detailsResults[i];
            const pokemonName = pokemonNames[i];

            if (details && matchesFilters(details)) {
              collected.push(details);
              seenPokemonsRef.current.add(pokemonName);
              console.log(
                `✅ Added: ${pokemonName} (${collected.length}/${LIMIT})`
              );
            } else {
              seenPokemonsRef.current.add(pokemonName);
            }
          }

          currentOffset += BATCH_SIZE;

          // If we've reached the end of available pokemons, stop
          if (currentOffset >= totalApiCount) {
            console.log("⚠️ Reached end of all pokemon");
            break;
          }
        } else {
          break;
        }
      }

      console.log(
        `✨ Collected ${collected.length} pokemon, next offset: ${currentOffset}`
      );

      // Add collected pokemons to the list
      setFilteredPokemons((prev) => [...prev, ...collected]);
      setOffset(currentOffset);

      // Determine if there's more to load
      const canLoadMore = currentOffset < totalApiCount;
      setHasMore(canLoadMore);
    } catch (error) {
      console.error("Error fetching filtered pokemons:", error);
    } finally {
      setIsLoading(false);
      fetchingRef.current = false;
    }
  };

  // Load more pokemons
  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading) return;
    console.log(`🔄 LoadMore called with offset: ${offset}`);
    await fetchFilteredPokemons(offset);
  }, [offset, hasMore, isLoading]);

  // Reset when filters change
  useEffect(() => {
    if (hasActiveFilters) {
      console.log("🔄 Filters changed, resetting...");
      setFilteredPokemons([]);
      setOffset(0);
      setHasMore(true);
      seenPokemonsRef.current.clear(); // Clear seen pokemon
      fetchFilteredPokemons(0);
    }
  }, [JSON.stringify(filters)]);

  return {
    pokemons: filteredPokemons,
    loading: isLoading,
    error: null,
    loadMore,
    hasMore,
    hasActiveFilters,
  };
}
