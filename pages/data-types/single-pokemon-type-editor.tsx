import React, { useEffect } from "react";
import {
  useMeshLocation,
  DataTypeLocationValue,
} from "@uniformdev/mesh-sdk-react";
import { VerticalRhythm, Input } from "@uniformdev/design-system";
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

const DEFAULT_VALUE: DataTypeLocationValueExtended = {
  path: `${POKEAPI_POKEMON_ENDPOINT}/\${id}`,
  ttl: 86400,
  method: "GET",
  variables: {
    id: {
      displayName: "Pokemon ID",
      type: "text",
      helpText: "The name of the Pokémon to fetch (e.g. pikachu)",
      default: "pikachu",
    },
  },
  custom: {
    imagePath: DEFAULT_IMAGE_PATH,
  },
};

const SinglePokemonTypeEditorPage: React.FC = () => {
  const { value, setValue } = useMeshLocation<"dataType", PokemonTypeConfig>();

  useEffect(() => {
    if (!value?.path) {
      setValue(() => ({
        newValue: {
          ...DEFAULT_VALUE,
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
    <VerticalRhythm>
      <Input
        label="Image Path"
        name="imagePath"
        value={(value?.custom?.imagePath as string) || DEFAULT_IMAGE_PATH}
        onChange={(e) => handleChange(e.target.value)}
        caption={`JSON path to the Pokémon image (default: '${DEFAULT_IMAGE_PATH}')`}
      />
    </VerticalRhythm>
  );
};

export default SinglePokemonTypeEditorPage;
