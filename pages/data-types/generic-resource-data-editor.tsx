import React from "react";
import { useMeshLocation } from "@uniformdev/mesh-sdk-react";

import {
  ResourceSelector,
  Resource,
} from "../../components/ResourceSelector";
import { useAsync } from "react-use";
import { ErrorCallout } from "../../components/ErrorCallout";
import { GenericResourceTypeConfig } from "./generic-resource-type-editor";
import {
  POKEAPI_BASE_URL,
  POKEAPI_ENDPOINTS,
} from "../../constants/pokeapi";
import { capitalize } from "../../utils/format";

const GenericResourceDataEditor: React.FC = () => {
  const { value, metadata, setValue } = useMeshLocation<"dataResource">();

  const typeConfig = metadata.dataType as unknown as GenericResourceTypeConfig;
  const endpoint = typeConfig?.custom?.endpoint || "pokemon";
  const endpointConfig = POKEAPI_ENDPOINTS.find((ep) => ep.value === endpoint);
  const endpointLabel = endpointConfig?.label || capitalize(endpoint);
  const limit = endpointConfig?.limit || 100;

  const id = value?.id as string | undefined;

  const {
    value: resources = [],
    loading,
    error,
  } = useAsync(async () => {
    const response = await fetch(
      `${POKEAPI_BASE_URL}/${endpoint}?limit=${limit}`
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch ${endpointLabel}: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();

    return data.results.map(
      (item: { name: string; url: string }): Resource => ({
        name: item.name,
        displayName: capitalize(item.name),
      })
    );
  }, [endpoint, limit]);

  if (loading) {
    return (
      <div style={{ padding: "20px", textAlign: "center", color: "#666" }}>
        Loading resources...
      </div>
    );
  }

  if (error) {
    return <ErrorCallout error={error.message} />;
  }

  return (
    <ResourceSelector
      resources={resources || []}
      selectedName={id || null}
      endpointLabel={endpointLabel}
      onSelect={(resource) => {
        setValue((current) => ({
          ...current,
          newValue: {
            id: resource.name,
          },
        }));
      }}
    />
  );
};

export default GenericResourceDataEditor;
