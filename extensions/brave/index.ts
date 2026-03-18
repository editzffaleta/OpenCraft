import { definePluginEntry } from "opencraft/plugin-sdk/core";
import {
  createPluginBackedWebSearchProvider,
  getTopLevelCredentialValue,
  setTopLevelCredentialValue,
} from "opencraft/plugin-sdk/provider-web-search";

export default definePluginEntry({
  id: "brave",
  name: "Brave Plugin",
  description: "Bundled Brave plugin",
  register(api) {
    api.registerWebSearchProvider(
      createPluginBackedWebSearchProvider({
        id: "brave",
        label: "Brave Search",
        hint: "Structured results · country/language/time filters",
        envVars: ["BRAVE_API_KEY"],
        placeholder: "BSA...",
        signupUrl: "https://brave.com/search/api/",
        docsUrl: "https://docs.opencraft.ai/brave-search",
        autoDetectOrder: 10,
        getCredentialValue: getTopLevelCredentialValue,
        setCredentialValue: setTopLevelCredentialValue,
      }),
    );
  },
});
