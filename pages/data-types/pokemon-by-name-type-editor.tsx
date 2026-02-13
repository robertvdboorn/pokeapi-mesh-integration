import React, { useEffect } from "react";
import {
  useMeshLocation,
  DataTypeLocationValue,
  DataTypeEditor,
  useVariables,
} from "@uniformdev/mesh-sdk-react";
import { Input } from "@uniformdev/design-system";
import {
  DEFAULT_IMAGE_PATH,
  POKEAPI_POKEMON_ENDPOINT,
} from "../../constants/pokeapi";

export interface PokemonTypeConfig {
  custom: {
    imagePath: string;
  };
}

interface DataTypeLocationValueExtended extends DataTypeLocationValue {
  ttl?: number;
}

const PokemonByNameTypeEditorPage: React.FC = () => {
  const { value, setValue } = useMeshLocation<"dataType", PokemonTypeConfig>();

  useEffect(() => {
    if (!value?.path) {
      const defaultValue: DataTypeLocationValueExtended = {
        path: `${POKEAPI_POKEMON_ENDPOINT}/\${name}`,
        ttl: 86400,
        method: "GET",
        custom: {
          imagePath: DEFAULT_IMAGE_PATH,
        },
      };

      setValue(() => ({
        newValue: {
          ...defaultValue,
        },
      }));
    }
  }, [value, setValue]);

  const handleChange = (newImagePath: string) => {
    setValue(() => ({
      newValue: {
        ...value,
        custom: {
          imagePath: newImagePath,
        },
      },
    }));
  };

  return (
    <DataTypeEditor onChange={setValue}>
      <RegisterVariables />
      <Input
        label="Image Path"
        name="imagePath"
        value={(value?.custom?.imagePath as string) || DEFAULT_IMAGE_PATH}
        onChange={(e) => handleChange(e.target.value)}
        caption={`JSON path to the Pokémon image (default: '${DEFAULT_IMAGE_PATH}')`}
      />
    </DataTypeEditor>
  );
};

/** Registers name as a dynamic variable using the useVariables hook */
function RegisterVariables() {
  const { dispatch } = useVariables();

  useEffect(() => {
    dispatch({
      type: "set",
      variable: {
        name: "name",
        displayName: "Pokemon Name",
        default: "",
        helpText:
          "Lowercase Pokemon name (e.g. pikachu, bulbasaur). Use a dynamic token like ${pokemon} to resolve from a URL parameter at runtime.",
        type: "text",
      },
    });
  }, [dispatch]);

  return null;
}

export default PokemonByNameTypeEditorPage;
