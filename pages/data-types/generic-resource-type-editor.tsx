import React, { useEffect } from "react";
import {
  useMeshLocation,
  DataTypeLocationValue,
} from "@uniformdev/mesh-sdk-react";
import { VerticalRhythm } from "@uniformdev/design-system";
import { POKEAPI_ENDPOINTS } from "../../constants/pokeapi";

export interface GenericResourceTypeConfig {
  custom: {
    endpoint: string;
  };
}

interface DataTypeLocationValueExtended extends DataTypeLocationValue {
  ttl?: number;
}

const DEFAULT_ENDPOINT = POKEAPI_ENDPOINTS[0].value;

const getDefaultValue = (endpoint: string): DataTypeLocationValueExtended => ({
  path: `/${endpoint}/\${id}`,
  ttl: 86400,
  method: "GET",
  variables: {
    id: {
      displayName: "Resource ID",
      type: "text",
      helpText: `The name of the ${endpoint} resource to fetch`,
      default: "",
    },
  },
  custom: {
    endpoint,
  },
});

const GenericResourceTypeEditorPage: React.FC = () => {
  const { value, setValue } =
    useMeshLocation<"dataType", GenericResourceTypeConfig>();

  const currentEndpoint =
    (value?.custom?.endpoint as string) || DEFAULT_ENDPOINT;

  useEffect(() => {
    if (!value?.path) {
      setValue(() => ({
        newValue: getDefaultValue(DEFAULT_ENDPOINT),
      }));
    }
  }, [value, setValue]);

  const handleEndpointChange = (newEndpoint: string) => {
    setValue(() => ({
      newValue: getDefaultValue(newEndpoint),
    }));
  };

  return (
    <VerticalRhythm>
      <div>
        <label
          htmlFor="endpoint"
          style={{
            display: "block",
            fontWeight: 600,
            fontSize: "0.9em",
            marginBottom: "4px",
          }}
        >
          PokeAPI Endpoint
        </label>
        <select
          id="endpoint"
          value={currentEndpoint}
          onChange={(e) => handleEndpointChange(e.target.value)}
          style={{
            width: "100%",
            padding: "8px 12px",
            borderRadius: "4px",
            border: "1px solid #ccc",
            fontSize: "0.9em",
            backgroundColor: "#fff",
          }}
        >
          {POKEAPI_ENDPOINTS.map((ep) => (
            <option key={ep.value} value={ep.value}>
              {ep.label}
            </option>
          ))}
        </select>
        <div
          style={{ fontSize: "0.8em", color: "#888", marginTop: "4px" }}
        >
          Select which PokeAPI resource type to use. The API path will be set
          to <code>/{currentEndpoint}/{'${id}'}</code>.
        </div>
      </div>
    </VerticalRhythm>
  );
};

export default GenericResourceTypeEditorPage;
