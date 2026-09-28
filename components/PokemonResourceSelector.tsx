import React, { useEffect, useMemo, useState } from "react";
import {
  BindableType,
  FieldGroup,
  FieldKind,
  PickField,
  PokemonCard,
  resolvePointer,
  typeColor,
} from "../utils/pokemonSelector";

interface PokemonResourceSelectorProps {
  cards: PokemonCard[];
  /** Resolved data resource value (used to preview the current selection). */
  resolvedRoot: unknown;
  /** Currently selected JSON pointer. */
  value: string;
  /** Bindable types valid for the target parameter/field. Empty = anything goes. */
  allowedTypes: BindableType[];
  resourceName?: string;
  isReadOnly?: boolean;
  onSelect: (pointer: string) => void;
}

const ACCENT = "#2563eb";

const TYPE_LABELS: Record<BindableType, string> = {
  string: "Text",
  number: "Number",
  boolean: "Yes / no",
  object: "Object",
  array: "List",
};

const KIND_BADGE: Record<FieldKind, string> = {
  text: "Aa",
  number: "12",
  boolean: "Y/N",
  object: "{ }",
  array: "[ ]",
  image: "IMG",
};

// ─── Categories (tabs) ────────────────────────────────────────────────────

export type Category = "all" | "text" | "number" | "image" | "array" | "boolean" | "object";

const CATEGORY_OF_KIND: Record<FieldKind, Exclude<Category, "all">> = {
  text: "text",
  number: "number",
  image: "image",
  boolean: "boolean",
  object: "object",
  array: "array",
};

const CATEGORY_LABEL: Record<Category, string> = {
  all: "All",
  text: "Text",
  number: "Numbers",
  image: "Images",
  array: "Lists",
  boolean: "Yes / no",
  object: "Objects",
};

/** Fixed display order for the tab strip (categories with no fields are skipped). */
const CATEGORY_ORDER: Exclude<Category, "all">[] = [
  "text",
  "number",
  "image",
  "array",
  "boolean",
  "object",
];

const truncate = (text: string, max = 48): string =>
  text.length > max ? `${text.slice(0, max - 1)}…` : text;

const previewText = (field: PickField): string => {
  const { value, kind } = field;
  if (value == null) return "—";
  if (kind === "array") return `${(value as unknown[]).length} items`;
  if (kind === "object") return `${Object.keys(value as object).length} fields`;
  if (kind === "boolean") return value ? "Yes" : "No";
  return truncate(String(value));
};

const isImageString = (value: unknown): value is string =>
  typeof value === "string" && /^https?:\/\/.+\.(png|jpe?g|gif|svg|webp|avif)/i.test(value);

/** Stat bar color graded from red (low) to green (high). */
const statColor = (v: number): string => {
  const ratio = Math.max(0, Math.min(1, v / 180));
  return `hsl(${Math.round(ratio * 125)}, 68%, 46%)`;
};

// ─── Small bits ─────────────────────────────────────────────────────────────

const CheckBadge: React.FC<{ accent: string; size?: number }> = ({ accent, size = 16 }) => (
  <span
    aria-hidden
    style={{
      width: size,
      height: size,
      borderRadius: 999,
      background: accent,
      color: "#fff",
      fontSize: size * 0.62,
      lineHeight: `${size}px`,
      textAlign: "center",
      display: "inline-block",
      flexShrink: 0,
      boxShadow: "0 1px 3px rgba(0,0,0,0.18)",
    }}
  >
    &#10003;
  </span>
);

const KindTag: React.FC<{ kind: FieldKind }> = ({ kind }) => (
  <span
    style={{
      fontFamily: "monospace",
      fontSize: "0.64em",
      fontWeight: 700,
      padding: "1px 5px",
      borderRadius: 5,
      background: "#eef1f5",
      color: "#7c8896",
      letterSpacing: "0.02em",
      flexShrink: 0,
    }}
  >
    {KIND_BADGE[kind]}
  </span>
);

// ─── Selectable chip ───────────────────────────────────────────────────────────

const Chip: React.FC<{
  field: PickField;
  selected: boolean;
  disabled: boolean;
  accent: string;
  onSelect: (pointer: string) => void;
}> = ({ field, selected, disabled, accent, onSelect }) => (
  <button
    type="button"
    className="drs-chip"
    disabled={disabled}
    onClick={() => onSelect(field.pointer)}
    title={field.pointer}
    style={{
      display: "flex",
      flexDirection: "column",
      gap: 3,
      padding: "9px 12px",
      borderRadius: 12,
      cursor: disabled ? "not-allowed" : "pointer",
      textAlign: "left",
      background: selected ? `${accent}12` : "#fff",
      border: `1.5px solid ${selected ? accent : "#e6e9ee"}`,
      boxShadow: selected ? `0 0 0 3px ${accent}26` : "none",
      opacity: disabled ? 0.4 : 1,
      minWidth: 0,
    }}
  >
    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <KindTag kind={field.kind} />
      <span style={{ fontWeight: 600, fontSize: "0.86em", color: "#1f2933" }}>{field.label}</span>
      {selected && <CheckBadge accent={accent} size={15} />}
    </span>
    <span style={{ fontSize: "0.76em", color: "#9aa3af", fontFamily: "monospace" }}>
      {previewText(field)}
    </span>
    {field.hint && (
      <span
        style={{
          fontSize: "0.64em",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          color: field.hint.toLowerCase().includes("hidden") ? "#b45309" : "#9aa3af",
        }}
      >
        {field.hint}
      </span>
    )}
  </button>
);

// ─── Image tile ─────────────────────────────────────────────────────────────

const ImageTile: React.FC<{
  field: PickField;
  selected: boolean;
  disabled: boolean;
  accent: string;
  onSelect: (pointer: string) => void;
}> = ({ field, selected, disabled, accent, onSelect }) => (
  <button
    type="button"
    className="drs-tile"
    disabled={disabled}
    onClick={() => onSelect(field.pointer)}
    title={field.pointer}
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 6,
      padding: 8,
      borderRadius: 14,
      cursor: disabled ? "not-allowed" : "pointer",
      background: selected ? `${accent}12` : "#fff",
      border: `1.5px solid ${selected ? accent : "#e6e9ee"}`,
      boxShadow: selected ? `0 0 0 3px ${accent}26` : "none",
      opacity: disabled ? 0.4 : 1,
      width: 108,
      position: "relative",
    }}
  >
    {selected && (
      <span style={{ position: "absolute", top: 6, right: 6 }}>
        <CheckBadge accent={accent} size={18} />
      </span>
    )}
    <span
      style={{
        width: 76,
        height: 76,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "repeating-conic-gradient(#eef1f5 0% 25%, #fff 0% 50%) 50% / 14px 14px",
        borderRadius: 10,
        overflow: "hidden",
      }}
    >
      {field.kind === "image" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={field.value as string}
          alt={field.label}
          style={{ maxWidth: 68, maxHeight: 68, objectFit: "contain" }}
        />
      ) : (
        <span style={{ color: "#6b7280", fontSize: "0.72em" }}>{previewText(field)}</span>
      )}
    </span>
    <span style={{ fontSize: "0.74em", fontWeight: 600, textAlign: "center", lineHeight: 1.25, color: "#1f2933" }}>
      {field.label}
    </span>
  </button>
);

// ─── Stat row ─────────────────────────────────────────────────────────────

const STAT_MAX = 200;

const StatRow: React.FC<{
  field: PickField;
  selected: boolean;
  disabled: boolean;
  accent: string;
  onSelect: (pointer: string) => void;
}> = ({ field, selected, disabled, accent, onSelect }) => {
  const isList = field.kind === "array";
  const numeric = typeof field.value === "number" ? field.value : 0;
  const pct = Math.min(100, (numeric / STAT_MAX) * 100);
  return (
    <button
      type="button"
      className="drs-stat"
      disabled={disabled}
      onClick={() => onSelect(field.pointer)}
      title={field.pointer}
      style={{
        display: "grid",
        gridTemplateColumns: "118px 34px 1fr 16px",
        alignItems: "center",
        gap: 10,
        padding: "7px 10px",
        borderRadius: 9,
        cursor: disabled ? "not-allowed" : "pointer",
        background: selected ? `${accent}12` : "transparent",
        border: `1.5px solid ${selected ? accent : "transparent"}`,
        opacity: disabled ? 0.4 : 1,
        textAlign: "left",
        width: "100%",
      }}
    >
      <span style={{ fontSize: "0.82em", fontWeight: 600, color: "#1f2933" }}>{field.label}</span>
      <span style={{ fontSize: "0.82em", fontFamily: "monospace", color: "#374151", textAlign: "right" }}>
        {isList ? "·" : numeric}
      </span>
      {isList ? (
        <span style={{ fontSize: "0.74em", color: "#9aa3af" }}>All six stats as a list</span>
      ) : (
        <span style={{ background: "#eef0f3", borderRadius: 999, height: 9, overflow: "hidden" }}>
          <span
            style={{
              display: "block",
              height: "100%",
              width: `${pct}%`,
              background: statColor(numeric),
              borderRadius: 999,
              transition: "width 0.4s ease",
            }}
          />
        </span>
      )}
      <span>{selected && <CheckBadge accent={accent} size={15} />}</span>
    </button>
  );
};

// ─── Type pill ────────────────────────────────────────────────────────────────

const TypePill: React.FC<{
  label: string;
  slug: string;
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
}> = ({ label, slug, selected, disabled, onSelect }) => {
  const color = typeColor(slug);
  return (
    <button
      type="button"
      className="drs-pill"
      disabled={disabled}
      onClick={onSelect}
      title={`Use ${label} type`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "4px 12px",
        borderRadius: 999,
        fontSize: "0.76em",
        fontWeight: 800,
        letterSpacing: "0.04em",
        color: "#fff",
        background: "rgba(255,255,255,0.22)",
        backdropFilter: "blur(2px)",
        border: selected ? "2px solid #fff" : "2px solid rgba(255,255,255,0.35)",
        boxShadow: selected ? "0 2px 8px rgba(0,0,0,0.18)" : "none",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.55 : 1,
        textTransform: "uppercase",
        textShadow: "0 1px 2px rgba(0,0,0,0.25)",
      }}
    >
      <span style={{ width: 8, height: 8, borderRadius: 999, background: color, boxShadow: "0 0 0 1.5px rgba(255,255,255,0.7)" }} />
      {label}
      {selected ? " ✓" : ""}
    </button>
  );
};

// ─── Group section ─────────────────────────────────────────────────────────

const GroupSection: React.FC<{
  group: FieldGroup;
  value: string;
  showField: (f: PickField) => boolean;
  accent: string;
  isReadOnly: boolean;
  onSelect: (pointer: string) => void;
}> = ({ group, value, showField, accent, isReadOnly, onSelect }) => {
  const visible = group.fields.filter(showField);
  if (visible.length === 0) return null;

  return (
    <div style={{ marginBottom: 18 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: "0.7em",
          fontWeight: 800,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "#9aa3af",
          marginBottom: 10,
        }}
      >
        {group.title}
        <span style={{ flex: 1, height: 1, background: "#f0f1f3" }} />
        <span style={{ color: "#c2c9d2", fontWeight: 700 }}>{visible.length}</span>
      </div>

      {group.layout === "images" && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {visible.map((f) => (
            <ImageTile key={f.key} field={f} selected={value === f.pointer} disabled={isReadOnly} accent={accent} onSelect={onSelect} />
          ))}
        </div>
      )}

      {group.layout === "stats" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {visible.map((f) => (
            <StatRow key={f.key} field={f} selected={value === f.pointer} disabled={isReadOnly} accent={accent} onSelect={onSelect} />
          ))}
        </div>
      )}

      {(group.layout === "chips" || group.layout === "list" || !group.layout) && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {visible.map((f) => (
            <Chip key={f.key} field={f} selected={value === f.pointer} disabled={isReadOnly} accent={accent} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Card ─────────────────────────────────────────────────────────────────

const CardView: React.FC<{
  card: PokemonCard;
  value: string;
  showField: (f: PickField) => boolean;
  showTypePills: boolean;
  isAllowed: (t: BindableType) => boolean;
  isReadOnly: boolean;
  onSelect: (pointer: string) => void;
}> = ({ card, value, showField, showTypePills, isAllowed, isReadOnly, onSelect }) => {
  const c1 = typeColor(card.primaryType);
  const c2 = card.typePills[1] ? typeColor(card.typePills[1].slug) : c1;
  const accent = c1;

  return (
    <div
      // CSS var consumed by hover rules in the <style> block.
      style={{
        ["--drs-accent" as any]: accent,
        border: "1px solid #e9ecf1",
        borderRadius: 18,
        overflow: "hidden",
        marginBottom: 16,
        background: "#fff",
        boxShadow: "0 1px 3px rgba(17,24,39,0.06)",
      }}
    >
      {/* Hero */}
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "20px 20px",
          background: `linear-gradient(120deg, ${c1} 0%, ${c2} 100%)`,
          overflow: "hidden",
        }}
      >
        {/* decorative orb */}
        <span
          aria-hidden
          style={{
            position: "absolute",
            right: -40,
            top: -40,
            width: 160,
            height: 160,
            borderRadius: 999,
            background: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.35), rgba(255,255,255,0) 70%)",
          }}
        />
        {card.artwork && (
          <span
            style={{
              width: 88,
              height: 88,
              flexShrink: 0,
              borderRadius: 18,
              background: "rgba(255,255,255,0.9)",
              boxShadow: "0 6px 18px rgba(0,0,0,0.18)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={card.artwork} alt={card.displayName} style={{ maxWidth: 74, maxHeight: 74, objectFit: "contain" }} />
          </span>
        )}
        <div style={{ minWidth: 0, zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontSize: "1.4em", fontWeight: 800, color: "#fff", textShadow: "0 1px 3px rgba(0,0,0,0.25)" }}>
              {card.displayName}
            </span>
            {card.pokedexId != null && (
              <span style={{ fontSize: "0.9em", fontWeight: 700, color: "rgba(255,255,255,0.85)", fontFamily: "monospace", textShadow: "0 1px 2px rgba(0,0,0,0.2)" }}>
                #{String(card.pokedexId).padStart(3, "0")}
              </span>
            )}
          </div>
          {showTypePills && card.typePills.length > 0 && (
            <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
              {card.typePills.map((pill) => (
                <TypePill
                  key={pill.pointer}
                  label={pill.label}
                  slug={pill.slug}
                  selected={value === pill.pointer}
                  disabled={isReadOnly || !isAllowed("string")}
                  onSelect={() => onSelect(pill.pointer)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Groups */}
      <div style={{ padding: "18px 20px 8px" }}>
        {card.groups.map((group) => (
          <GroupSection
            key={group.key}
            group={group}
            value={value}
            showField={showField}
            accent={accent}
            isReadOnly={isReadOnly}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
};

// ─── Main selector ─────────────────────────────────────────────────────────

const STYLES = `
.drs-root *, .drs-root *::before, .drs-root *::after { box-sizing: border-box; }
.drs-chip, .drs-tile, .drs-pill { transition: transform .12s ease, box-shadow .16s ease, border-color .16s ease, background .16s ease; }
.drs-chip:not(:disabled):hover { transform: translateY(-1px); box-shadow: 0 4px 14px rgba(17,24,39,.10); border-color: var(--drs-accent); }
.drs-tile:not(:disabled):hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(17,24,39,.13); }
.drs-tile img { transition: transform .18s ease; }
.drs-tile:not(:disabled):hover img { transform: scale(1.1); }
.drs-stat { transition: background .12s ease; }
.drs-stat:not(:disabled):hover { background: #f6f8fb; }
.drs-pill:not(:disabled):hover { transform: translateY(-1px); }
.drs-toggle:hover { text-decoration: underline; }
.drs-tab { transition: background .14s ease, border-color .14s ease, color .14s ease; }
.drs-tab:hover { border-color: var(--drs-accent, ${ACCENT}); }
.drs-tabs { scrollbar-width: thin; }
.drs-tabs::-webkit-scrollbar { height: 6px; }
.drs-tabs::-webkit-scrollbar-thumb { background: #e1e5ea; border-radius: 999px; }
.drs-clear { transition: background .14s ease, border-color .14s ease; }
.drs-clear:hover { background: #f0fdf4; border-color: #86efac; }
.drs-search:focus { border-color: ${ACCENT}; box-shadow: 0 0 0 3px ${ACCENT}1f; }
.drs-chip:focus-visible, .drs-tile:focus-visible, .drs-pill:focus-visible, .drs-stat:focus-visible {
  outline: 2px solid ${ACCENT}; outline-offset: 2px;
}
`;

const STYLE_ID = "drs-selector-styles";

/** Inject interactive styles client-side to avoid SSR <style> hoisting hydration mismatches. */
const useInjectStyles = (): void => {
  useEffect(() => {
    if (typeof document === "undefined" || document.getElementById(STYLE_ID)) return;
    const el = document.createElement("style");
    el.id = STYLE_ID;
    el.textContent = STYLES;
    document.head.appendChild(el);
  }, []);
};

export const PokemonResourceSelector: React.FC<PokemonResourceSelectorProps> = ({
  cards,
  resolvedRoot,
  value,
  allowedTypes,
  resourceName,
  isReadOnly = false,
  onSelect,
}) => {
  const [search, setSearch] = useState("");
  const [showAllTypes, setShowAllTypes] = useState(false);
  const [activeCategory, setActiveCategory] = useState<Category>("all");

  useInjectStyles();

  const hasTypeFilter = allowedTypes && allowedTypes.length > 0;

  const isAllowed = useMemo(
    () => (t: BindableType): boolean => {
      if (!hasTypeFilter || showAllTypes) return true;
      return allowedTypes.includes(t);
    },
    [allowedTypes, hasTypeFilter, showAllTypes]
  );

  // Search-filtered cards (category is applied later, per-field, so tab counts stay live).
  const filteredCards = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return cards;
    return cards
      .map((card) => ({
        ...card,
        groups: card.groups
          .map((g) => ({
            ...g,
            fields: g.fields.filter(
              (f) => f.label.toLowerCase().includes(query) || f.pointer.toLowerCase().includes(query)
            ),
          }))
          .filter((g) => g.fields.length > 0),
      }))
      .filter((card) => card.groups.length > 0 || card.displayName.toLowerCase().includes(query));
  }, [cards, search]);

  // Field counts per category, respecting search + type compatibility.
  const categoryCounts = useMemo(() => {
    const counts: Partial<Record<Exclude<Category, "all">, number>> = {};
    for (const card of filteredCards) {
      for (const g of card.groups) {
        for (const f of g.fields) {
          if (!isAllowed(f.jsonType)) continue;
          const cat = CATEGORY_OF_KIND[f.kind];
          counts[cat] = (counts[cat] ?? 0) + 1;
        }
      }
    }
    return counts;
  }, [filteredCards, isAllowed]);

  const availableCategories = CATEGORY_ORDER.filter((c) => (categoryCounts[c] ?? 0) > 0);
  const totalCount = availableCategories.reduce((sum, c) => sum + (categoryCounts[c] ?? 0), 0);
  const showTabs = availableCategories.length >= 2;

  // If the active tab no longer has any fields (e.g. after toggling the type filter), fall back to All.
  useEffect(() => {
    if (activeCategory !== "all" && (categoryCounts[activeCategory] ?? 0) === 0) {
      setActiveCategory("all");
    }
  }, [categoryCounts, activeCategory]);

  const showField = useMemo(
    () => (f: PickField): boolean =>
      isAllowed(f.jsonType) &&
      (activeCategory === "all" || CATEGORY_OF_KIND[f.kind] === activeCategory),
    [isAllowed, activeCategory]
  );

  const showTypePills = activeCategory === "all" || activeCategory === "text";

  const visibleCount = activeCategory === "all" ? totalCount : categoryCounts[activeCategory] ?? 0;

  // Friendly label for the current selection (resolved against the full, unfiltered cards).
  const selectedField = useMemo(() => {
    if (!value) return undefined;
    for (const card of cards) {
      for (const g of card.groups) {
        const f = g.fields.find((x) => x.pointer === value);
        if (f) return { label: f.label, group: g.title, kind: f.kind };
      }
      const pill = card.typePills.find((p) => p.pointer === value);
      if (pill) return { label: `${pill.label} type`, group: "Types", kind: "text" as FieldKind };
    }
    return undefined;
  }, [cards, value]);

  const selectedValue = value ? resolvePointer(resolvedRoot, value) : undefined;
  const selectedPreview =
    selectedValue == null
      ? undefined
      : Array.isArray(selectedValue)
      ? `${selectedValue.length} items`
      : typeof selectedValue === "object"
      ? `${Object.keys(selectedValue).length} fields`
      : String(selectedValue);

  return (
    <div className="drs-root" style={{ fontFamily: "inherit", color: "#1f2933" }}>
      {/* Sticky toolbar */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 5,
          background: "#fff",
          paddingBottom: 12,
          marginBottom: 6,
          borderBottom: "1px solid #f0f1f3",
        }}
      >
        {resourceName && (
          <div style={{ fontSize: "0.78em", color: "#8b95a1", marginBottom: 8 }}>
            Pick a field from <strong style={{ color: "#374151" }}>{resourceName}</strong>
          </div>
        )}

        <div style={{ position: "relative" }}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#9aa3af"
            strokeWidth="2.2"
            strokeLinecap="round"
            style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
          <input
            className="drs-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search fields — name, sprite, stat, ability…"
            style={{
              width: "100%",
              padding: "10px 12px 10px 36px",
              borderRadius: 12,
              border: "1px solid #dde1e7",
              fontSize: "0.9em",
              outline: "none",
              boxSizing: "border-box",
              transition: "border-color .15s ease, box-shadow .15s ease",
            }}
          />
        </div>

        {showTabs && (
          <div
            className="drs-tabs"
            role="tablist"
            style={{ display: "flex", gap: 6, marginTop: 10, overflowX: "auto", paddingBottom: 2 }}
          >
            {(["all", ...availableCategories] as Category[]).map((cat) => {
              const active = activeCategory === cat;
              const count = cat === "all" ? totalCount : categoryCounts[cat] ?? 0;
              return (
                <button
                  key={cat}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  className="drs-tab"
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 12px",
                    borderRadius: 999,
                    border: `1.5px solid ${active ? ACCENT : "#e6e9ee"}`,
                    background: active ? ACCENT : "#fff",
                    color: active ? "#fff" : "#475569",
                    fontWeight: 700,
                    fontSize: "0.8em",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  {CATEGORY_LABEL[cat]}
                  <span
                    style={{
                      fontSize: "0.82em",
                      fontWeight: 800,
                      padding: "0 6px",
                      borderRadius: 999,
                      background: active ? "rgba(255,255,255,0.25)" : "#eef2f7",
                      color: active ? "#fff" : "#8b95a1",
                    }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {hasTypeFilter && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
              marginTop: 10,
              fontSize: "0.78em",
              color: "#6b7280",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              Compatible with
              {allowedTypes.map((t) => (
                <span
                  key={t}
                  style={{
                    display: "inline-block",
                    padding: "2px 9px",
                    borderRadius: 999,
                    background: "#eef2f7",
                    fontWeight: 700,
                    color: "#475569",
                  }}
                >
                  {TYPE_LABELS[t]}
                </span>
              ))}
            </span>
            <button
              type="button"
              className="drs-toggle"
              onClick={() => setShowAllTypes((s) => !s)}
              style={{
                background: "transparent",
                border: "none",
                color: ACCENT,
                cursor: "pointer",
                fontWeight: 700,
                fontSize: "1em",
                whiteSpace: "nowrap",
              }}
            >
              {showAllTypes ? "Only compatible" : "Show all"}
            </button>
          </div>
        )}

        {value && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginTop: 10,
              padding: "10px 12px",
              background: "linear-gradient(120deg, #ecfdf5, #f0fdf4)",
              border: "1px solid #bbf7d0",
              borderRadius: 12,
            }}
          >
            {isImageString(selectedValue) ? (
              <span
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 10,
                  background: "repeating-conic-gradient(#eef1f5 0% 25%, #fff 0% 50%) 50% / 10px 10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  border: "1px solid #bbf7d0",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={selectedValue as string} alt="selected" style={{ maxWidth: 42, maxHeight: 42, objectFit: "contain" }} />
              </span>
            ) : (
              <span
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 999,
                  background: "#16a34a",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  fontSize: "1em",
                  fontWeight: 700,
                }}
              >
                &#10003;
              </span>
            )}
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: "0.66em", color: "#16a34a", fontWeight: 800, letterSpacing: "0.08em" }}>
                SELECTED
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6, minWidth: 0 }}>
                <span style={{ fontSize: "0.95em", fontWeight: 700, color: "#14532d" }}>
                  {selectedField?.label ?? "Custom path"}
                </span>
                {selectedField?.group && (
                  <span style={{ fontSize: "0.72em", color: "#4d7c5a" }}>in {selectedField.group}</span>
                )}
              </div>
              <div style={{ fontSize: "0.78em", color: "#3f6212", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {selectedPreview != null ? truncate(selectedPreview, 64) : "—"}
              </div>
              <div style={{ fontSize: "0.7em", color: "#6b7280", fontFamily: "monospace", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {value}
              </div>
            </div>
            {!isReadOnly && (
              <button
                type="button"
                className="drs-clear"
                onClick={() => onSelect("")}
                title="Clear selection"
                style={{
                  flexShrink: 0,
                  alignSelf: "flex-start",
                  padding: "4px 10px",
                  borderRadius: 8,
                  border: "1px solid #bbf7d0",
                  background: "#fff",
                  color: "#15803d",
                  fontWeight: 700,
                  fontSize: "0.76em",
                  cursor: "pointer",
                }}
              >
                Clear
              </button>
            )}
          </div>
        )}
      </div>

      {filteredCards.length === 0 || visibleCount === 0 ? (
        <div style={{ textAlign: "center", color: "#9aa3af", padding: "36px 0" }}>No matching fields.</div>
      ) : (
        filteredCards.map((card) => (
          <CardView
            key={card.prefix || "single"}
            card={card}
            value={value}
            showField={showField}
            showTypePills={showTypePills}
            isAllowed={isAllowed}
            isReadOnly={isReadOnly}
            onSelect={onSelect}
          />
        ))
      )}
    </div>
  );
};

export default PokemonResourceSelector;
