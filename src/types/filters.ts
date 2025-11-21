export type FilterOption = {
  name?: string;
  types?: string[];
  generations?: string[];
};

export type PokemonWithDetails = {
  url: string;
  name: string;
  image?: string;
  types?: string[];
  generation?: number;
};
