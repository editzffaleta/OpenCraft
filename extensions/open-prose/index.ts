import { definePluginEntry, type OpenCraftPluginApi } from "opencraft/plugin-sdk/open-prose";

export default definePluginEntry({
  id: "open-prose",
  name: "OpenProse",
  description: "Plugin-shipped prose skills bundle",
  register(_api: OpenCraftPluginApi) {
    // OpenProse is delivered via plugin-shipped skills.
  },
});
