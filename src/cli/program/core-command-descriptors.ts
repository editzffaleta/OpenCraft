export type CoreCliCommandDescriptor = {
  name: string;
  description: string;
  hasSubcommands: boolean;
};

export const CORE_CLI_COMMAND_DESCRIPTORS = [
  {
    name: "setup",
    description: "Inicializar configuração local e espaço de trabalho do agente",
    hasSubcommands: false,
  },
  {
    name: "onboard",
    description: "Configuração interativa para gateway, espaço de trabalho e skills",
    hasSubcommands: false,
  },
  {
    name: "configure",
    description: "Configuração interativa para credenciais, canais, gateway e padrões do agente",
    hasSubcommands: false,
  },
  {
    name: "config",
    description:
      "Auxiliares de configuração não interativos (get/set/unset/file/validate). Padrão: inicia configuração guiada.",
    hasSubcommands: true,
  },
  {
    name: "backup",
    description: "Criar e verificar arquivos de backup locais do estado do OpenCraft",
    hasSubcommands: true,
  },
  {
    name: "doctor",
    description: "Verificações de saúde + correções rápidas para o gateway e canais",
    hasSubcommands: false,
  },
  {
    name: "dashboard",
    description: "Abrir a interface de controle com seu token atual",
    hasSubcommands: false,
  },
  {
    name: "reset",
    description: "Redefinir configuração/estado local (mantém o CLI instalado)",
    hasSubcommands: false,
  },
  {
    name: "uninstall",
    description: "Desinstalar o serviço de gateway + dados locais (CLI permanece)",
    hasSubcommands: false,
  },
  {
    name: "message",
    description: "Enviar, ler e gerenciar mensagens",
    hasSubcommands: true,
  },
  {
    name: "memory",
    description: "Pesquisar e reindexar arquivos de memória",
    hasSubcommands: true,
  },
  {
    name: "agent",
    description: "Executar um turno do agente via Gateway",
    hasSubcommands: false,
  },
  {
    name: "agents",
    description: "Gerenciar agentes isolados (espaços de trabalho, autenticação, roteamento)",
    hasSubcommands: true,
  },
  {
    name: "status",
    description: "Mostrar saúde dos canais e destinatários de sessão recentes",
    hasSubcommands: false,
  },
  {
    name: "health",
    description: "Obter saúde do gateway em execução",
    hasSubcommands: false,
  },
  {
    name: "sessions",
    description: "Listar sessões de conversa armazenadas",
    hasSubcommands: true,
  },
  {
    name: "browser",
    description: "Gerenciar o browser dedicado do OpenCraft (Chrome/Chromium)",
    hasSubcommands: true,
  },
] as const satisfies ReadonlyArray<CoreCliCommandDescriptor>;

export function getCoreCliCommandDescriptors(): ReadonlyArray<CoreCliCommandDescriptor> {
  return CORE_CLI_COMMAND_DESCRIPTORS;
}

export function getCoreCliCommandsWithSubcommands(): string[] {
  return CORE_CLI_COMMAND_DESCRIPTORS.filter((command) => command.hasSubcommands).map(
    (command) => command.name,
  );
}
