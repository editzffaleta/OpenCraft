import { listSkillCommandsForAgents as listSkillCommandsForAgentsImpl } from "opencraft/plugin-sdk/reply-runtime";

type ListSkillCommandsForAgents =
  typeof import("opencraft/plugin-sdk/reply-runtime").listSkillCommandsForAgents;

export function listSkillCommandsForAgents(
  ...args: Parameters<ListSkillCommandsForAgents>
): ReturnType<ListSkillCommandsForAgents> {
  return listSkillCommandsForAgentsImpl(...args);
}
