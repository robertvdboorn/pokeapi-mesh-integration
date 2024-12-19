import React from "react";

/** Capitalize a string, splitting on hyphens and capitalizing each word */
export const capitalize = (str: string): string =>
  str
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

/** Highlight matching parts of text for search results */
export const highlightQuery = (
  text: string,
  query: string
): React.ReactNode => {
  if (!query) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));
  return React.createElement(
    React.Fragment,
    null,
    ...parts.map((part, index) =>
      part.toLowerCase() === query.toLowerCase()
        ? React.createElement(
            "span",
            { key: index, style: { color: "#007BFF", fontWeight: "bold" } },
            part
          )
        : part
    )
  );
};

/** Resolve a dot-separated path on an object (e.g. "sprites.other.front_default") */
export const getValueFromPath = (
  obj: any,
  path: string
): string | undefined => {
  return path.split(".").reduce((acc, part) => acc && acc[part], obj);
};
