---
summary: "Use modelos Amazon Bedrock (Converse API) com OpenCraft"
read_when:
  - Você quer usar modelos Amazon Bedrock com OpenCraft
  - Você precisa configurar credenciais/região AWS para chamadas de modelo
title: "Amazon Bedrock"
---

# Amazon Bedrock

O OpenCraft pode usar modelos do **Amazon Bedrock** via o provider **Bedrock Converse** com
streaming do pi-ai. A autenticação do Bedrock usa a **cadeia de credenciais padrão do AWS SDK**,
não uma chave de API.

## O que o pi-ai suporta

- Provider: `amazon-bedrock`
- API: `bedrock-converse-stream`
- Autenticação: credenciais AWS (variáveis de ambiente, configuração compartilhada ou role de instância)
- Região: `AWS_REGION` ou `AWS_DEFAULT_REGION` (padrão: `us-east-1`)

## Descoberta automática de modelos

Se credenciais AWS forem detectadas, o OpenCraft pode descobrir automaticamente modelos Bedrock
que suportam **streaming** e **saída de texto**. A descoberta usa
`bedrock:ListFoundationModels` e é cacheada (padrão: 1 hora).

As opções de configuração ficam em `models.bedrockDiscovery`:

```json5
{
  models: {
    bedrockDiscovery: {
      enabled: true,
      region: "us-east-1",
      providerFilter: ["anthropic", "amazon"],
      refreshInterval: 3600,
      defaultContextWindow: 32000,
      defaultMaxTokens: 4096,
    },
  },
}
```

Notas:

- `enabled` é `true` por padrão quando credenciais AWS estão presentes.
- `region` usa `AWS_REGION` ou `AWS_DEFAULT_REGION` como padrão, depois `us-east-1`.
- `providerFilter` corresponde a nomes de providers do Bedrock (por exemplo `anthropic`).
- `refreshInterval` é em segundos; defina como `0` para desabilitar o cache.
- `defaultContextWindow` (padrão: `32000`) e `defaultMaxTokens` (padrão: `4096`)
  são usados para modelos descobertos (sobrescreva se você conhece os limites do seu modelo).

## Onboarding

1. Certifique-se de que as credenciais AWS estão disponíveis no **host do gateway**:

```bash
export AWS_ACCESS_KEY_ID="AKIA..."
export AWS_SECRET_ACCESS_KEY="..."
export AWS_REGION="us-east-1"
# Opcional:
export AWS_SESSION_TOKEN="..."
export AWS_PROFILE="your-profile"
# Opcional (chave/bearer token da API Bedrock):
export AWS_BEARER_TOKEN_BEDROCK="..."
```

2. Adicione um provider e modelo Bedrock à sua configuração (sem `apiKey` necessário):

```json5
{
  models: {
    providers: {
      "amazon-bedrock": {
        baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
        api: "bedrock-converse-stream",
        auth: "aws-sdk",
        models: [
          {
            id: "us.anthropic.claude-opus-4-6-v1:0",
            name: "Claude Opus 4.6 (Bedrock)",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 200000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "amazon-bedrock/us.anthropic.claude-opus-4-6-v1:0" },
    },
  },
}
```

## Roles de Instância EC2

Ao executar o OpenCraft em uma instância EC2 com uma role IAM anexada, o AWS SDK
usará automaticamente o serviço de metadados da instância (IMDS) para autenticação.
No entanto, a detecção de credenciais do OpenCraft atualmente só verifica variáveis
de ambiente, não credenciais IMDS.

**Solução alternativa:** Defina `AWS_PROFILE=default` para sinalizar que credenciais AWS estão
disponíveis. A autenticação real ainda usa a role da instância via IMDS.

```bash
# Adicione ao ~/.bashrc ou seu perfil de shell
export AWS_PROFILE=default
export AWS_REGION=us-east-1
```

**Permissões IAM necessárias** para a role da instância EC2:

- `bedrock:InvokeModel`
- `bedrock:InvokeModelWithResponseStream`
- `bedrock:ListFoundationModels` (para descoberta automática)

Ou anexe a política gerenciada `AmazonBedrockFullAccess`.

## Configuração rápida (caminho AWS)

```bash
# 1. Criar role IAM e perfil de instância
aws iam create-role --role-name EC2-Bedrock-Access \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "ec2.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }'

aws iam attach-role-policy --role-name EC2-Bedrock-Access \
  --policy-arn arn:aws:iam::aws:policy/AmazonBedrockFullAccess

aws iam create-instance-profile --instance-profile-name EC2-Bedrock-Access
aws iam add-role-to-instance-profile \
  --instance-profile-name EC2-Bedrock-Access \
  --role-name EC2-Bedrock-Access

# 2. Anexar à sua instância EC2
aws ec2 associate-iam-instance-profile \
  --instance-id i-xxxxx \
  --iam-instance-profile Name=EC2-Bedrock-Access

# 3. Na instância EC2, habilitar a descoberta
opencraft config set models.bedrockDiscovery.enabled true
opencraft config set models.bedrockDiscovery.region us-east-1

# 4. Definir as variáveis de ambiente da solução alternativa
echo 'export AWS_PROFILE=default' >> ~/.bashrc
echo 'export AWS_REGION=us-east-1' >> ~/.bashrc
source ~/.bashrc

# 5. Verificar se os modelos foram descobertos
opencraft models list
```

## Notas

- O Bedrock requer **acesso ao modelo** habilitado na sua conta/região AWS.
- A descoberta automática precisa da permissão `bedrock:ListFoundationModels`.
- Se você usa perfis, defina `AWS_PROFILE` no host do gateway.
- O OpenCraft exibe a fonte de credencial nesta ordem: `AWS_BEARER_TOKEN_BEDROCK`,
  depois `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`, depois `AWS_PROFILE`, depois a
  cadeia padrão do AWS SDK.
- O suporte a raciocínio depende do modelo; verifique a ficha do modelo Bedrock para
  as capacidades atuais.
- Se você preferir um fluxo de chave gerenciada, também pode colocar um proxy
  compatível com OpenAI na frente do Bedrock e configurá-lo como um provider OpenAI.
