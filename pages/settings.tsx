import React from "react";
import { Callout } from "@uniformdev/mesh-sdk-react";
import { POKEAPI_BASE_URL } from "../constants/pokeapi";

export default function Settings() {
  return (
    <div className="space-y-8 p-8 bg-gray-50 rounded-lg shadow-lg">
      <Callout type="success">
        <p className="text-lg font-semibold text-green-700">
          The Pokémon API integration has been installed successfully.
        </p>
      </Callout>

      <div className="space-y-6">
        <h2 className="text-4xl font-bold text-gray-900">
          Configuring the Pokémon API Integration
        </h2>
        <p className="text-lg text-gray-700 leading-relaxed">
          To configure the integration and start using Pokémon data in Uniform,
          please follow these steps:
        </p>
        <ol className="list-decimal list-inside space-y-4 pl-6 text-gray-800">
          <li className="leading-relaxed">
            Navigate to <strong>Experience &gt; Data Types</strong> in the main
            navigation above.
          </li>
          <li className="leading-relaxed">
            Click the <strong>Add data type</strong> button in the top-right
            corner of the page.
          </li>
          <li className="leading-relaxed">
            Select <strong>Pokémon API</strong> as the data source type.
          </li>
          <li className="leading-relaxed">
            Configure your Pokémon API connection by providing the following
            information:
            <ul className="list-disc list-inside pl-6 space-y-2 text-gray-700">
              <li>Pokémon API Base URL (e.g., {POKEAPI_BASE_URL})</li>
            </ul>
          </li>
        </ol>
      </div>

      <div className="bg-white p-6 rounded-lg border border-gray-300">
        <h3 className="text-2xl font-semibold text-gray-800 mb-4">
          Need Help?
        </h3>
        <p className="text-gray-700 leading-relaxed">
          If you encounter any issues or have questions about the Pokémon API
          integration, please refer to our{" "}
          <a href="https://docs.uniform.app/docs" className="text-blue-600 hover:underline">
            documentation
          </a>
          , or contact our support team.
        </p>
      </div>
    </div>
  );
}
