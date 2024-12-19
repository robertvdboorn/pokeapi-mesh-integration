import {
  getDataResourceAsRequest,
  type RequestEdgehancerDataResourceResolutionResult,
  type RequestHookFn,
} from "@uniformdev/mesh-edgehancer-sdk";
import { transformPokemon } from "./shared";

const request: RequestHookFn = async ({ dataResources }) => {
  const results = dataResources.map<
    Promise<RequestEdgehancerDataResourceResolutionResult>
  >(async ({ dataResource }) => {
    const result: Required<RequestEdgehancerDataResourceResolutionResult> = {
      errors: [],
      warnings: [],
      infos: [],
      result: {},
      surrogateKeys: [],
    };

    const request = getDataResourceAsRequest(dataResource);
    const response = await fetch(request);
    const responseText = await response.text();

    if (!response.ok) {
      result.errors.push(
        `request to ${request.url} failed with status ${response.status}, response: ${responseText}`
      );
      return result;
    }

    try {
      const data = JSON.parse(responseText);
      result.result = transformPokemon(data);
    } catch (e) {
      result.errors.push(
        `request to ${request.url} returned invalid JSON: ${e}`
      );
    }

    return result;
  });
  return {
    results: await Promise.all(results),
  };
};

export default request;
