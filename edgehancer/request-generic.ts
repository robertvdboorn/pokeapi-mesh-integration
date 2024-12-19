import {
  getDataResourceAsRequest,
  type RequestEdgehancerDataResourceResolutionResult,
  type RequestHookFn,
} from "@uniformdev/mesh-edgehancer-sdk";

const capitalize = (str: string): string =>
  str.charAt(0).toUpperCase() + str.slice(1).replace(/-/g, " ");

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

      // Transform the name field into a structured object for consistency
      if (typeof data.name === "string") {
        data.name = {
          original: data.name,
          formatted: capitalize(data.name),
        };
      }

      // If there's a names array, add formatted versions
      if (Array.isArray(data.names)) {
        data.names = data.names.map((n: any) => ({
          ...n,
          formatted: n.name ? capitalize(n.name) : n.name,
        }));
      }

      result.result = data;
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
