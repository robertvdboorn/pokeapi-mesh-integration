import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { VerticalRhythm, Input } from "@uniformdev/design-system";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  horizontalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { highlightQuery } from "../utils/format";

export interface Pokemon {
  id: number;
  slug: string;
  name: string;
  image?: string;
  types?: string[];
  abilities?: string[];
  height?: number; // in cm
  weight?: number; // in kg
  stats?: { name: string; value: number }[];
}

interface PokemonSelectorProps {
  pokemonList: Pokemon[];
  selectedPokemonDetails?: Pokemon;
  selectedSlugs: string[];
  detailsLoaded?: boolean;
  multiSelect?: boolean;
  onSelect: (pokemon: Pokemon) => void;
  onMultiSelect?: (slugs: string[]) => void;
}

export const typeColors: Record<string, string> = {
  fire: "#EE8130",
  water: "#6390F0",
  grass: "#7AC74C",
  electric: "#F7D02C",
  ice: "#96D9D6",
  fighting: "#C22E28",
  poison: "#A33EA1",
  ground: "#E2BF65",
  flying: "#A98FF3",
  psychic: "#F95587",
  bug: "#A6B91A",
  rock: "#B6A136",
  ghost: "#735797",
  dragon: "#6F35FC",
  dark: "#705746",
  steel: "#B7B7CE",
  fairy: "#D685AD",
  normal: "#A8A77A",
};

const TYPE_NAMES = Object.keys(typeColors);

const formatPokemonId = (id: number): string =>
  `#${id.toString().padStart(3, "0")}`;

/** Whether this Pokemon has been enriched with detail data */
const hasDetails = (pokemon: Pokemon): boolean =>
  Array.isArray(pokemon.types) && pokemon.types.length > 0;

// --- Type Filter Pills ---

const TypeFilterPills: React.FC<{
  activeType: string | null;
  onToggle: (type: string | null) => void;
}> = ({ activeType, onToggle }) => (
  <div
    style={{
      display: "flex",
      flexWrap: "wrap",
      gap: "3px",
      marginBottom: "4px",
    }}
  >
    {TYPE_NAMES.map((type) => {
      const isActive = activeType === type;
      return (
        <button
          key={type}
          onClick={() => onToggle(isActive ? null : type)}
          style={{
            display: "inline-block",
            backgroundColor: isActive ? typeColors[type] : "transparent",
            color: isActive ? "#fff" : typeColors[type],
            border: `1.5px solid ${typeColors[type]}`,
            padding: "0px 6px",
            borderRadius: "10px",
            fontSize: "0.65em",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.15s ease",
            textTransform: "capitalize",
            opacity: activeType && !isActive ? 0.45 : 1,
          }}
        >
          {type}
        </button>
      );
    })}
  </div>
);

// --- Pokemon Card ---

interface PokemonCardProps {
  pokemon: Pokemon;
  selected: boolean;
  focused: boolean;
  onSelect: (pokemon: Pokemon) => void;
  searchQuery: string;
}

const PokemonCard: React.FC<PokemonCardProps> = ({
  pokemon,
  selected,
  focused,
  onSelect,
  searchQuery,
}) => {
  const [hovered, setHovered] = useState(false);
  const loaded = hasDetails(pokemon);
  const ref = useRef<HTMLLIElement>(null);

  useEffect(() => {
    if (focused && ref.current) {
      ref.current.scrollIntoView({ block: "nearest" });
    }
  }, [focused]);

  return (
    <li
      ref={ref}
      onClick={() => onSelect(pokemon)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        padding: "5px 8px",
        borderRadius: "5px",
        cursor: "pointer",
        marginBottom: "2px",
        backgroundColor: selected
          ? "#EBF5FF"
          : focused
          ? "#f0f4ff"
          : hovered
          ? "#f7faff"
          : "#FFFFFF",
        border: selected
          ? "1px solid #007BFF"
          : focused
          ? "1px solid #99c2ff"
          : "1px solid transparent",
        transition:
          "background-color 0.15s ease, border 0.15s ease, box-shadow 0.15s ease",
        boxShadow: hovered ? "0px 2px 8px rgba(0, 0, 0, 0.08)" : "none",
        outline: "none",
      }}
    >
      {pokemon.image && (
        <img
          src={pokemon.image}
          alt={pokemon.name}
          width={36}
          height={36}
          loading="lazy"
          style={{
            marginRight: "8px",
            borderRadius: "4px",
            objectFit: "contain",
            backgroundColor: "#f8f8f8",
          }}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
          <span style={{ fontWeight: "bold", fontSize: "0.85em" }}>
            {highlightQuery(pokemon.name, searchQuery)}
          </span>
          <span
            style={{
              fontSize: "0.72em",
              color: "#999",
              fontFamily: "monospace",
            }}
          >
            {formatPokemonId(pokemon.id)}
          </span>
        </div>
        {loaded ? (
          <div style={{ fontSize: "0.78em", color: "#666", marginTop: "2px" }}>
            <div style={{ marginBottom: "2px" }}>
              {pokemon.types!.map((type) => (
                <span
                  key={type}
                  style={{
                    display: "inline-block",
                    backgroundColor: typeColors[type.toLowerCase()] || "#ccc",
                    color: "#fff",
                    padding: "0px 5px",
                    borderRadius: "8px",
                    fontSize: "0.72em",
                    fontWeight: 600,
                    marginRight: "4px",
                  }}
                >
                  {type}
                </span>
              ))}
            </div>
            <div
              style={{
                display: "flex",
                gap: "6px",
                fontSize: "0.72em",
                color: "#888",
              }}
            >
              <span>{pokemon.height} cm</span>
              <span>{pokemon.weight} kg</span>
            </div>
          </div>
        ) : (
          <div
            style={{
              fontSize: "0.72em",
              color: "#bbb",
              marginTop: "2px",
              fontStyle: "italic",
            }}
          >
            Loading details...
          </div>
        )}
      </div>
      {selected && (
        <span
          style={{
            color: "#007BFF",
            fontSize: "0.95em",
            marginLeft: "6px",
            flexShrink: 0,
          }}
        >
          &#10003;
        </span>
      )}
    </li>
  );
};

// --- Selected Pokemon Detail Panel ---

const SelectedPokemonPanel: React.FC<{
  details: Pokemon;
}> = ({ details }) => {
  if (!hasDetails(details)) return null;

  const maxStat = 255;
  const primaryType = details.types?.[0]?.toLowerCase();
  const barColor = (primaryType && typeColors[primaryType]) || "#007BFF";

  return (
    <div
      style={{
        padding: "10px",
        backgroundColor: "#f9fafb",
        borderRadius: "6px",
        border: "1px solid #e5e7eb",
        marginBottom: "6px",
      }}
    >
      <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
        {details.image && (
          <img
            src={details.image}
            alt={details.name}
            width={72}
            height={72}
            style={{
              objectFit: "contain",
              borderRadius: "8px",
              backgroundColor: "#fff",
              border: "1px solid #eee",
              flexShrink: 0,
            }}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: "6px",
              marginBottom: "4px",
            }}
          >
            <span style={{ fontWeight: "bold", fontSize: "1em" }}>
              {details.name}
            </span>
            <span
              style={{
                fontSize: "0.8em",
                color: "#888",
                fontFamily: "monospace",
              }}
            >
              {formatPokemonId(details.id)}
            </span>
          </div>

          {details.types && (
            <div style={{ marginBottom: "4px" }}>
              {details.types.map((type) => (
                <span
                  key={type}
                  style={{
                    display: "inline-block",
                    backgroundColor: typeColors[type.toLowerCase()] || "#ccc",
                    color: "#fff",
                    padding: "1px 6px",
                    borderRadius: "10px",
                    fontSize: "0.7em",
                    fontWeight: 600,
                    marginRight: "4px",
                    textTransform: "capitalize",
                  }}
                >
                  {type}
                </span>
              ))}
            </div>
          )}

          <div
            style={{
              display: "flex",
              gap: "12px",
              fontSize: "0.78em",
              color: "#555",
              marginBottom: "4px",
            }}
          >
            <span>
              <strong>Height:</strong> {details.height} cm
            </span>
            <span>
              <strong>Weight:</strong> {details.weight} kg
            </span>
          </div>

          {details.abilities && details.abilities.length > 0 && (
            <div style={{ fontSize: "0.78em", color: "#555" }}>
              <strong>Abilities:</strong> {details.abilities.join(", ")}
            </div>
          )}
        </div>
      </div>

      {details.stats && details.stats.length > 0 && (
        <div style={{ marginTop: "8px" }}>
          <div
            style={{
              fontSize: "0.72em",
              fontWeight: 600,
              color: "#444",
              marginBottom: "3px",
            }}
          >
            Base Stats
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            {details.stats.map((stat) => (
              <div
                key={stat.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "0.7em",
                }}
              >
                <span
                  style={{
                    width: "80px",
                    color: "#666",
                    textAlign: "right",
                    flexShrink: 0,
                  }}
                >
                  {stat.name}
                </span>
                <span
                  style={{
                    width: "30px",
                    fontFamily: "monospace",
                    fontWeight: 600,
                    textAlign: "right",
                    flexShrink: 0,
                  }}
                >
                  {stat.value}
                </span>
                <div
                  style={{
                    flex: 1,
                    height: "5px",
                    backgroundColor: "#e5e7eb",
                    borderRadius: "3px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${(stat.value / maxStat) * 100}%`,
                      height: "100%",
                      backgroundColor: barColor,
                      borderRadius: "3px",
                      transition: "width 0.3s ease",
                      opacity: Math.max(0.4, stat.value / maxStat),
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// --- Sortable Chip ---

const SortableChip: React.FC<{
  slug: string;
  displayName: string;
  image?: string;
  onRemove: (slug: string) => void;
}> = ({ slug, displayName, image, onRemove }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: slug });

  const style: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    backgroundColor: isDragging ? "#dbeafe" : "#EBF5FF",
    border: "1px solid #007BFF",
    borderRadius: "16px",
    padding: "2px 8px 2px 4px",
    fontSize: "0.75em",
    color: "#007BFF",
    fontWeight: 500,
    cursor: "grab",
    opacity: isDragging ? 0.5 : 1,
    transform: CSS.Transform.toString(transform),
    transition: transition ?? undefined,
    touchAction: "none",
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <span ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {image && (
        <img
          src={image}
          alt={displayName}
          width={16}
          height={16}
          style={{
            borderRadius: "50%",
            objectFit: "contain",
            backgroundColor: "#f0f4ff",
            pointerEvents: "none",
          }}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      )}
      {displayName}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove(slug);
        }}
        onPointerDown={(e) => e.stopPropagation()}
        style={{
          background: "transparent",
          border: "none",
          cursor: "pointer",
          color: "#007BFF",
          fontSize: "14px",
          padding: "0 2px",
          lineHeight: 1,
        }}
        aria-label={`Remove ${displayName}`}
      >
        &times;
      </button>
    </span>
  );
};

// --- Selected Chips (for multi-select with drag-to-reorder) ---

const SelectedChips: React.FC<{
  slugs: string[];
  pokemonList: Pokemon[];
  onRemove: (slug: string) => void;
  onClearAll: () => void;
  onReorder: (slugs: string[]) => void;
}> = ({ slugs, pokemonList, onRemove, onClearAll, onReorder }) => {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  if (slugs.length === 0) return null;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = slugs.indexOf(active.id as string);
      const newIndex = slugs.indexOf(over.id as string);
      onReorder(arrayMove(slugs, oldIndex, newIndex));
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "4px",
        padding: "6px",
        backgroundColor: "#f9fafb",
        borderRadius: "5px",
        border: "1px solid #e5e7eb",
        marginBottom: "4px",
      }}
    >
      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2px",
        }}
      >
        <span style={{ fontSize: "0.75em", color: "#888" }}>
          {slugs.length} selected
          {slugs.length > 1 && (
            <span style={{ color: "#aaa", marginLeft: "4px" }}>
              (drag to reorder)
            </span>
          )}
        </span>
        <button
          onClick={onClearAll}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            fontSize: "0.75em",
            color: "#ef4444",
            fontWeight: 500,
            padding: "0 2px",
          }}
        >
          Clear all
        </button>
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={slugs}
          strategy={horizontalListSortingStrategy}
        >
          {slugs.map((slug) => {
            const pokemon = pokemonList.find((p) => p.slug === slug);
            return (
              <SortableChip
                key={slug}
                slug={slug}
                displayName={pokemon?.name || slug}
                image={pokemon?.image}
                onRemove={onRemove}
              />
            );
          })}
        </SortableContext>
      </DndContext>
    </div>
  );
};

// --- Main Selector ---

export const PokemonSelector: React.FC<PokemonSelectorProps> = ({
  pokemonList = [],
  selectedPokemonDetails,
  selectedSlugs,
  detailsLoaded,
  multiSelect = false,
  onSelect,
  onMultiSelect,
}) => {
  const [inputValue, setInputValue] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [activeTypeFilter, setActiveTypeFilter] = useState<string | null>(null);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(inputValue);
    }, 100);
    return () => clearTimeout(handler);
  }, [inputValue]);

  // Reset focused index when filters change
  useEffect(() => {
    setFocusedIndex(-1);
  }, [debouncedSearchQuery, activeTypeFilter]);

  const filteredPokemonList = useMemo(() => {
    let list = pokemonList;

    // Type filter
    if (activeTypeFilter) {
      const filterLower = activeTypeFilter.toLowerCase();
      list = list.filter(
        (p) =>
          hasDetails(p) &&
          p.types!.some((t) => t.toLowerCase() === filterLower)
      );
    }

    // Text search
    const query = debouncedSearchQuery.trim();
    if (query !== "") {
      const numericQuery = query.replace(/^#/, "");
      const isNumeric = /^\d+$/.test(numericQuery);

      list = list
        .filter((pokemon) => {
          if (isNumeric) {
            return (
              pokemon.id.toString().includes(numericQuery) ||
              pokemon.name.toLowerCase().includes(query.toLowerCase())
            );
          }
          return pokemon.name.toLowerCase().includes(query.toLowerCase());
        })
        .sort((a, b) => {
          const lowerQuery = query.toLowerCase();

          if (isNumeric) {
            const exactA = a.id.toString() === numericQuery;
            const exactB = b.id.toString() === numericQuery;
            if (exactA && !exactB) return -1;
            if (!exactA && exactB) return 1;
          }

          const startsWithA = a.name.toLowerCase().startsWith(lowerQuery);
          const startsWithB = b.name.toLowerCase().startsWith(lowerQuery);
          if (startsWithA && !startsWithB) return -1;
          if (!startsWithA && startsWithB) return 1;
          return a.name.localeCompare(b.name);
        });
    }

    return list;
  }, [pokemonList, debouncedSearchQuery, activeTypeFilter]);

  const handleSelection = useCallback(
    (pokemon: Pokemon) => {
      if (multiSelect && onMultiSelect) {
        const isSelected = selectedSlugs.includes(pokemon.slug);
        const newSlugs = isSelected
          ? selectedSlugs.filter((s) => s !== pokemon.slug)
          : [...selectedSlugs, pokemon.slug];
        onMultiSelect(newSlugs);
      } else {
        onSelect(pokemon);
        setInputValue(pokemon.name);
      }
    },
    [multiSelect, onMultiSelect, onSelect, selectedSlugs]
  );

  const handleRemoveChip = (slug: string) => {
    if (onMultiSelect) {
      onMultiSelect(selectedSlugs.filter((s) => s !== slug));
    }
  };

  const handleClearAll = () => {
    if (onMultiSelect) {
      onMultiSelect([]);
    }
  };

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const listLen = filteredPokemonList.length;
      if (listLen === 0) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setFocusedIndex((prev) =>
            prev < listLen - 1 ? prev + 1 : 0
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setFocusedIndex((prev) =>
            prev > 0 ? prev - 1 : listLen - 1
          );
          break;
        case "Enter":
          e.preventDefault();
          if (focusedIndex >= 0 && focusedIndex < listLen) {
            handleSelection(filteredPokemonList[focusedIndex]);
          }
          break;
        case "Escape":
          e.preventDefault();
          setInputValue("");
          setActiveTypeFilter(null);
          setFocusedIndex(-1);
          break;
      }
    },
    [filteredPokemonList, focusedIndex, handleSelection]
  );

  const isFiltered =
    debouncedSearchQuery.trim() !== "" || activeTypeFilter !== null;

  return (
    <VerticalRhythm>
      {/* Single-select: selected detail panel */}
      {!multiSelect && selectedPokemonDetails && (
        <SelectedPokemonPanel details={selectedPokemonDetails} />
      )}

      {/* Multi-select: selected chips */}
      {multiSelect && (
        <SelectedChips
          slugs={selectedSlugs}
          pokemonList={pokemonList}
          onRemove={handleRemoveChip}
          onClearAll={handleClearAll}
          onReorder={(reordered) => onMultiSelect?.(reordered)}
        />
      )}

      {/* Type filter pills */}
      {detailsLoaded && (
        <TypeFilterPills
          activeType={activeTypeFilter}
          onToggle={setActiveTypeFilter}
        />
      )}

      {/* Search input */}
      <div
        style={{ position: "relative", width: "100%" }}
        onKeyDown={handleKeyDown}
      >
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Search by name or #ID..."
          label=""
          style={{ width: "100%", paddingRight: "32px", fontSize: "0.85em" }}
        />
        {inputValue && (
          <button
            onClick={() => setInputValue("")}
            style={{
              position: "absolute",
              right: "8px",
              top: "50%",
              transform: "translateY(-50%)",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              fontSize: "14px",
              color: "#999",
            }}
            aria-label="Clear search input"
          >
            &times;
          </button>
        )}
      </div>

      {/* Result count + loading */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "1px 0",
          minHeight: "16px",
        }}
      >
        {isFiltered && (
          <span style={{ fontSize: "0.7em", color: "#999" }}>
            Showing {filteredPokemonList.length} of {pokemonList.length}
          </span>
        )}
        {!detailsLoaded && pokemonList.length > 0 && (
          <span
            style={{ fontSize: "0.7em", color: "#999", marginLeft: "auto" }}
          >
            Loading details...
          </span>
        )}
      </div>

      {/* Pokemon list */}
      <ul
        ref={listRef}
        role="list"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        style={{
          maxHeight: "340px",
          overflowY: "auto",
          border: "1px solid #e5e7eb",
          borderRadius: "5px",
          padding: "4px",
          marginTop: "2px",
          listStyleType: "none",
          outline: "none",
        }}
      >
        {filteredPokemonList.length > 0 ? (
          filteredPokemonList.map((pokemon, index) => (
            <PokemonCard
              key={pokemon.id}
              pokemon={pokemon}
              selected={selectedSlugs.includes(pokemon.slug)}
              focused={focusedIndex === index}
              onSelect={handleSelection}
              searchQuery={debouncedSearchQuery}
            />
          ))
        ) : (
          <li style={{ textAlign: "center", color: "#666", padding: "14px", fontSize: "0.85em" }}>
            No Pokémon found
          </li>
        )}
      </ul>
    </VerticalRhythm>
  );
};

export default PokemonSelector;
