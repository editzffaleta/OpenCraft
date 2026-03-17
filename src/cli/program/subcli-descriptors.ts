export type SubCliDescriptor = {
  name: string;
  description: string;
  hasSubcommands: boolean;
};

export const SUB_CLI_DESCRIPTORS = [
  { name: "acp", description: "Ferramentas do Agent Control Protocol", hasSubcommands: true },
  {
    name: "gateway",
    description: "Executar, inspecionar e consultar o WebSocket Gateway",
    hasSubcommands: true,
  },
  { name: "daemon", description: "Serviço de gateway (alias legado)", hasSubcommands: true },
  {
    name: "logs",
    description: "Acompanhar logs de arquivo do gateway via RPC",
    hasSubcommands: false,
  },
  {
    name: "system",
    description: "Eventos de sistema, heartbeat e presença",
    hasSubcommands: true,
  },
  {
    name: "models",
    description: "Descobrir, escanear e configurar modelos",
    hasSubcommands: true,
  },
  {
    name: "approvals",
    description: "Gerenciar aprovações de execução (gateway ou host de nó)",
    hasSubcommands: true,
  },
  {
    name: "nodes",
    description: "Gerenciar pareamento de nós e comandos de nó do gateway",
    hasSubcommands: true,
  },
  {
    name: "devices",
    description: "Pareamento de dispositivos + gerenciamento de tokens",
    hasSubcommands: true,
  },
  {
    name: "node",
    description: "Executar e gerenciar o serviço de host de nó headless",
    hasSubcommands: true,
  },
  {
    name: "sandbox",
    description: "Gerenciar containers sandbox para isolamento de agentes",
    hasSubcommands: true,
  },
  {
    name: "tui",
    description: "Abrir uma interface de terminal conectada ao Gateway",
    hasSubcommands: false,
  },
  {
    name: "cron",
    description: "Gerenciar tarefas cron via agendador do Gateway",
    hasSubcommands: true,
  },
  {
    name: "dns",
    description: "Auxiliares de DNS para descoberta de área ampla (Tailscale + CoreDNS)",
    hasSubcommands: true,
  },
  {
    name: "docs",
    description: "Pesquisar a documentação do OpenCraft",
    hasSubcommands: false,
  },
  {
    name: "hooks",
    description: "Gerenciar hooks internos do agente",
    hasSubcommands: true,
  },
  {
    name: "webhooks",
    description: "Auxiliares e integrações de webhook",
    hasSubcommands: true,
  },
  {
    name: "qr",
    description: "Gerar QR code/código de configuração de pareamento iOS",
    hasSubcommands: false,
  },
  {
    name: "clawbot",
    description: "Aliases de comandos clawbot legados",
    hasSubcommands: true,
  },
  {
    name: "pairing",
    description: "Pareamento seguro por DM (aprovar solicitações recebidas)",
    hasSubcommands: true,
  },
  {
    name: "plugins",
    description: "Gerenciar plugins e extensões do OpenCraft",
    hasSubcommands: true,
  },
  {
    name: "channels",
    description: "Gerenciar canais de chat conectados (Telegram, Discord, etc.)",
    hasSubcommands: true,
  },
  {
    name: "directory",
    description:
      "Consultar IDs de contatos e grupos (self, peers, grupos) para canais de chat suportados",
    hasSubcommands: true,
  },
  {
    name: "security",
    description: "Ferramentas de segurança e auditorias de configuração local",
    hasSubcommands: true,
  },
  {
    name: "secrets",
    description: "Controles de recarga de secrets em tempo de execução",
    hasSubcommands: true,
  },
  {
    name: "skills",
    description: "Listar e inspecionar skills disponíveis",
    hasSubcommands: true,
  },
  {
    name: "update",
    description: "Atualizar o OpenCraft e inspecionar o status do canal de atualização",
    hasSubcommands: true,
  },
  {
    name: "completion",
    description: "Gerar script de completion para o shell",
    hasSubcommands: false,
  },
] as const satisfies ReadonlyArray<SubCliDescriptor>;

export function getSubCliEntries(): ReadonlyArray<SubCliDescriptor> {
  return SUB_CLI_DESCRIPTORS;
}

export function getSubCliCommandsWithSubcommands(): string[] {
  return SUB_CLI_DESCRIPTORS.filter((entry) => entry.hasSubcommands).map((entry) => entry.name);
}
