import type { AuthProfileStore } from "../agents/auth-profiles.js";
import type { OpenCraftConfig } from "../config/config.js";
import type { WizardPrompter } from "../wizard/prompts.js";
import { buildAuthChoiceGroups } from "./auth-choice-options.js";
import type { AuthChoice } from "./onboard-types.js";

const BACK_VALUE = "__back";

export async function promptAuthChoiceGrouped(params: {
  prompter: WizardPrompter;
  store: AuthProfileStore;
  includeSkip: boolean;
  config?: OpenCraftConfig;
  workspaceDir?: string;
  env?: NodeJS.ProcessEnv;
}): Promise<AuthChoice> {
  const { groups, skipOption } = buildAuthChoiceGroups(params);
  const availableGroups = groups.filter((group) => group.options.length > 0);

  while (true) {
    const providerOptions = [
      ...availableGroups.map((group) => ({
        value: group.value,
        label: group.label,
        hint: group.hint,
      })),
      ...(skipOption ? [skipOption] : []),
    ];

    const providerSelection = (await params.prompter.select({
      message: "Provedor de modelo/autenticação",
      options: providerOptions,
    })) as string;

    if (providerSelection === "skip") {
      return "skip";
    }

    const group = availableGroups.find((candidate) => candidate.value === providerSelection);

    if (!group || group.options.length === 0) {
      await params.prompter.note(
        "Nenhum método de autenticação disponível para esse provedor.",
        "Escolha de modelo/autenticação",
      );
      continue;
    }

    if (group.options.length === 1) {
      return group.options[0].value;
    }

    const methodSelection = await params.prompter.select({
      message: `${group.label} — método de autenticação`,
      options: [...group.options, { value: BACK_VALUE, label: "Voltar" }],
    });

    if (methodSelection === BACK_VALUE) {
      continue;
    }

    return methodSelection;
  }
}
