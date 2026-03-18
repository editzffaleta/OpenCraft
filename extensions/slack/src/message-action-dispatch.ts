import { handleSlackMessageAction as handleSlackMessageActionImpl } from "opencraft/plugin-sdk/slack";

type HandleSlackMessageAction = typeof import("opencraft/plugin-sdk/slack").handleSlackMessageAction;

export async function handleSlackMessageAction(
  ...args: Parameters<HandleSlackMessageAction>
): ReturnType<HandleSlackMessageAction> {
  return await handleSlackMessageActionImpl(...args);
}
