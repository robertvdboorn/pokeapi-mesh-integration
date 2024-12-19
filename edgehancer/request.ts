import {
  getDataResourceAsRequest,
  type RequestEdgehancerDataResourceResolutionResult,
  type RequestHookFn,
} from "@uniformdev/mesh-edgehancer-sdk";

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
      const responseJson = JSON.parse(responseText);

      if (typeof responseJson.name === "string") {
        // Transform `name` into an object containing the original and capitalized versions
        responseJson.name = {
          original: responseJson.name,
          formatted:
            responseJson.name.charAt(0).toUpperCase() +
            responseJson.name.slice(1),
        };
      } else {
        result.warnings.push(
          `Expected 'name' to be a string but got ${typeof responseJson.name}`
        );
      }

      result.result = responseJson;
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
