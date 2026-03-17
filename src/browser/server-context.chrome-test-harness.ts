import { vi } from "vitest";
import { installChromeUserDataDirHooks } from "./chrome-user-data-dir.test-harness.js";

const chromeUserDataDir = { dir: "/tmp/opencraft" };
installChromeUserDataDirHooks(chromeUserDataDir);

vi.mock("./chrome.js", () => ({
  isChromeCdpReady: vi.fn(async () => true),
  isChromeReachable: vi.fn(async () => true),
  launchOpenCraftChrome: vi.fn(async () => {
    throw new Error("unexpected launch");
  }),
  resolveOpenCraftUserDataDir: vi.fn(() => chromeUserDataDir.dir),
  stopOpenCraftChrome: vi.fn(async () => {}),
}));
