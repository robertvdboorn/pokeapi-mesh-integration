import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { VerticalRhythm, Input } from "@uniformdev/design-system";
import { highlightQuery } from "../utils/format";

export interface Resource {
  name: string;
  displayName: string;
}

interface ResourceSelectorProps {
  resources: Resource[];
  loading?: boolean;
  selectedName: string | null;
  endpointLabel: string;
  onSelect: (resource: Resource) => void;
}

// --- Resource Card ---

const ResourceCard: React.FC<{
  resource: Resource;
  selected: boolean;
  focused: boolean;
  onSelect: (resource: Resource) => void;
  searchQuery: string;
}> = ({ resource, selected, focused, onSelect, searchQuery }) => {
  const [hovered, setHovered] = useState(false);
  const ref = useRef<HTMLLIElement>(null);

  useEffect(() => {
    if (focused && ref.current) {
      ref.current.scrollIntoView({ block: "nearest" });
    }
  }, [focused]);

  return (
    <li
      ref={ref}
      onClick={() => onSelect(resource)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        padding: "8px 12px",
        borderRadius: "6px",
        cursor: "pointer",
        marginBottom: "3px",
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
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontWeight: 500, fontSize: "0.92em" }}>
          {highlightQuery(resource.displayName, searchQuery)}
        </span>
        <span
          style={{
            fontSize: "0.78em",
            color: "#999",
            marginLeft: "8px",
            fontFamily: "monospace",
          }}
        >
          {resource.name}
        </span>
      </div>
      {selected && (
        <span
          style={{
            color: "#007BFF",
            fontSize: "1.1em",
            marginLeft: "8px",
            flexShrink: 0,
          }}
        >
          &#10003;
        </span>
      )}
    </li>
  );
};

// --- Main Selector ---

export const ResourceSelector: React.FC<ResourceSelectorProps> = ({
  resources = [],
  loading,
  selectedName,
  endpointLabel,
  onSelect,
}) => {
  const [inputValue, setInputValue] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [focusedIndex, setFocusedIndex] = useState(-1);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(inputValue);
    }, 100);
    return () => clearTimeout(handler);
  }, [inputValue]);

  const filteredResources = useMemo(() => {
    const query = debouncedQuery.trim().toLowerCase();
    if (query === "") return resources;

    return resources
      .filter(
        (r) =>
          r.displayName.toLowerCase().includes(query) ||
          r.name.toLowerCase().includes(query)
      )
      .sort((a, b) => {
        const startsA = a.displayName.toLowerCase().startsWith(query);
        const startsB = b.displayName.toLowerCase().startsWith(query);
        if (startsA && !startsB) return -1;
        if (!startsA && startsB) return 1;
        return a.displayName.localeCompare(b.displayName);
      });
  }, [resources, debouncedQuery]);

  // Reset focus when filtered list changes
  useEffect(() => {
    setFocusedIndex(-1);
  }, [debouncedQuery]);

  const handleSelection = useCallback((resource: Resource) => {
    onSelect(resource);
    setInputValue(resource.displayName);
  }, [onSelect]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const len = filteredResources.length;
      if (len === 0) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setFocusedIndex((prev) => (prev < len - 1 ? prev + 1 : 0));
          break;
        case "ArrowUp":
          e.preventDefault();
          setFocusedIndex((prev) => (prev > 0 ? prev - 1 : len - 1));
          break;
        case "Enter":
          e.preventDefault();
          if (focusedIndex >= 0 && focusedIndex < len) {
            handleSelection(filteredResources[focusedIndex]);
          }
          break;
        case "Escape":
          e.preventDefault();
          setFocusedIndex(-1);
          setInputValue("");
          break;
      }
    },
    [filteredResources, focusedIndex, handleSelection]
  );

  // Selected resource info
  const selectedResource = selectedName
    ? resources.find((r) => r.name === selectedName)
    : null;

  return (
    <VerticalRhythm>
      {/* Selected resource display */}
      {selectedResource && (
        <div
          style={{
            padding: "12px 16px",
            backgroundColor: "#f9fafb",
            borderRadius: "8px",
            border: "1px solid #e5e7eb",
            marginBottom: "8px",
          }}
        >
          <div style={{ fontSize: "0.8em", color: "#888", marginBottom: "2px" }}>
            Selected {endpointLabel}
          </div>
          <div style={{ fontWeight: 600, fontSize: "1.05em" }}>
            {selectedResource.displayName}
          </div>
          <div
            style={{
              fontSize: "0.8em",
              color: "#999",
              fontFamily: "monospace",
            }}
          >
            {selectedResource.name}
          </div>
        </div>
      )}

      {/* Search */}
      <div style={{ position: "relative", width: "100%" }}>
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Search ${endpointLabel}...`}
          label={`Search ${endpointLabel}`}
          style={{ width: "100%", paddingRight: "40px" }}
        />
        {inputValue && (
          <button
            onClick={() => setInputValue("")}
            style={{
              position: "absolute",
              right: "10px",
              top: "50%",
              transform: "translateY(-50%)",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              fontSize: "16px",
              color: "#999",
            }}
            aria-label="Clear search input"
          >
            &times;
          </button>
        )}
      </div>

      {loading && (
        <div
          style={{
            fontSize: "0.85em",
            color: "#999",
            textAlign: "center",
            padding: "8px 0",
          }}
        >
          Loading resources...
        </div>
      )}

      {/* Resource list */}
      <ul
        role="list"
        style={{
          maxHeight: "400px",
          overflowY: "auto",
          border: "1px solid #e5e7eb",
          borderRadius: "6px",
          padding: "6px",
          marginTop: "12px",
          listStyleType: "none",
        }}
      >
        {filteredResources.length > 0 ? (
          filteredResources.map((resource, index) => (
            <ResourceCard
              key={resource.name}
              resource={resource}
              selected={selectedName === resource.name}
              focused={index === focusedIndex}
              onSelect={handleSelection}
              searchQuery={debouncedQuery}
            />
          ))
        ) : (
          <li style={{ textAlign: "center", color: "#666", padding: "20px" }}>
            {loading ? "Loading..." : "No resources found"}
          </li>
        )}
      </ul>
    </VerticalRhythm>
  );
};

export default ResourceSelector;
