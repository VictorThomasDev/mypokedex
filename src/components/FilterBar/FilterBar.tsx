import React, { useCallback, useState } from "react";
import { FilterOption } from "../../types/filters";
import "./FilterBar.scss";

type Props = {
  onFilterChange?: (filters: FilterOption) => void;
  onClear?: () => void;
  className?: string;
};

const pokemonTypes = [
  "normal",
  "fire",
  "water",
  "electric",
  "grass",
  "ice",
  "fighting",
  "poison",
  "ground",
  "flying",
  "psychic",
  "bug",
  "rock",
  "ghost",
  "dragon",
  "dark",
  "steel",
  "fairy",
];

const generations = [
  { value: "1", label: "Gen I (Kanto)" },
  { value: "2", label: "Gen II (Johto)" },
  { value: "3", label: "Gen III (Hoenn)" },
  { value: "4", label: "Gen IV (Sinnoh)" },
  { value: "5", label: "Gen V (Unova)" },
  { value: "6", label: "Gen VI (Kalos)" },
  { value: "7", label: "Gen VII (Alola)" },
  { value: "8", label: "Gen VIII (Galar)" },
  { value: "9", label: "Gen IX (Paldea)" },
];

const FilterBar: React.FC<Props> = ({
  onFilterChange,
  onClear,
  className = "",
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedGenerations, setSelectedGenerations] = useState<string[]>([]);

  const emitFilters = useCallback(
    (types: string[], gens: string[], search: string) => {
      const filters: FilterOption = {};
      if (search) filters.name = search;
      if (types.length > 0) filters.types = types;
      if (gens.length > 0) filters.generations = gens;
      onFilterChange?.(filters);
    },
    [onFilterChange]
  );

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchQuery(value);
      emitFilters(selectedTypes, selectedGenerations, value);
    },
    [selectedTypes, selectedGenerations, emitFilters]
  );

  const toggleType = useCallback(
    (type: string) => {
      setSelectedTypes((prev) => {
        const newTypes = prev.includes(type)
          ? prev.filter((t) => t !== type)
          : [...prev, type];
        emitFilters(newTypes, selectedGenerations, searchQuery);
        return newTypes;
      });
    },
    [selectedGenerations, searchQuery, emitFilters]
  );

  const toggleGeneration = useCallback(
    (gen: string) => {
      setSelectedGenerations((prev) => {
        const newGens = prev.includes(gen)
          ? prev.filter((g) => g !== gen)
          : [...prev, gen];
        emitFilters(selectedTypes, newGens, searchQuery);
        return newGens;
      });
    },
    [selectedTypes, searchQuery, emitFilters]
  );

  const handleClear = useCallback(() => {
    setSearchQuery("");
    setSelectedTypes([]);
    setSelectedGenerations([]);
    onClear?.();
  }, [onClear]);

  return (
    <div className={`filter-bar ${className}`}>
      <div className="filter-bar__group">
        <input
          type="text"
          placeholder="Search Pokémon..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="filter-bar__input"
        />
      </div>

      <div className="filter-bar__section">
        <label className="filter-bar__label">Types:</label>
        <div className="filter-bar__chips">
          {pokemonTypes.map((type) => (
            <button
              key={type}
              onClick={() => toggleType(type)}
              className={`filter-chip ${
                selectedTypes.includes(type) ? "active" : ""
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-bar__section">
        <label className="filter-bar__label">Generations:</label>
        <div className="filter-bar__chips">
          {generations.map((gen) => (
            <button
              key={gen.value}
              onClick={() => toggleGeneration(gen.value)}
              className={`filter-chip ${
                selectedGenerations.includes(gen.value) ? "active" : ""
              }`}
            >
              {gen.label}
            </button>
          ))}
        </div>
      </div>

      {(selectedTypes.length > 0 ||
        selectedGenerations.length > 0 ||
        searchQuery) && (
        <button onClick={handleClear} className="filter-bar__button">
          Clear All Filters
        </button>
      )}
    </div>
  );
};

export default FilterBar;
