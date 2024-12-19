import React, { FC, useCallback, useEffect, useMemo } from "react";
import {
  useMeshLocation,
  DataSourceLocationValue,
  Input,
  ValidationResult,
} from "@uniformdev/mesh-sdk-react";
import { VerticalRhythm } from "@uniformdev/design-system";
import { POKEAPI_BASE_URL } from "../constants/pokeapi";

export type DataSourceConfig = {
  apiUrl: string;
};

const TRUE_VALIDATION_RESULT: ValidationResult = { isValid: true };

const DataConnectionEditor: FC = () => {
  const { value, setValue } = useMeshLocation<"dataSource">();

  const { apiUrl } = useMemo(() => {
    const config = value.custom as DataSourceConfig;
    return {
      apiUrl: config?.apiUrl?.length > 0 ? config.apiUrl : POKEAPI_BASE_URL,
    };
  }, [value.custom]);

  const handleUpdate = useCallback(
    (updates?: Partial<DataSourceConfig>) => {
      setValue((current) => {
        const currentConfig = current.custom as DataSourceConfig;
        const newConfig = { ...currentConfig, ...updates };

        const newValue: DataSourceLocationValue = {
          ...current,
          baseUrl: newConfig.apiUrl || POKEAPI_BASE_URL,
          custom: newConfig,
          customPublic: newConfig,
        };

        return { newValue, options: TRUE_VALIDATION_RESULT };
      });
    },
    [setValue]
  );

  useEffect(() => {
    if (!value.custom || !(value.custom as DataSourceConfig).apiUrl) {
      handleUpdate({ apiUrl: POKEAPI_BASE_URL });
    }
  }, [handleUpdate, value.custom]);

  return (
    <VerticalRhythm>
      <Input
        id="apiUrl"
        name="apiUrl"
        label="API URL"
        placeholder={POKEAPI_BASE_URL}
        value={apiUrl}
        onChange={(e) => handleUpdate({ apiUrl: e.currentTarget.value })}
        caption={`The base URL of the Pokémon API (default: ${POKEAPI_BASE_URL}).`}
      />
    </VerticalRhythm>
  );
};

export default DataConnectionEditor;
