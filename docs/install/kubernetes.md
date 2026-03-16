---
summary: "Implantar o Gateway OpenCraft em um cluster Kubernetes com Kustomize"
read_when:
  - Você quer rodar o OpenCraft em um cluster Kubernetes
  - Você quer testar o OpenCraft em um ambiente Kubernetes
title: "Kubernetes"
---

# OpenCraft no Kubernetes

Um ponto de partida mínimo para rodar o OpenCraft no Kubernetes — não é uma implantação pronta para produção. Cobre os recursos principais e foi pensado para ser adaptado ao seu ambiente.

## Por que não Helm?

O OpenCraft é um container único com alguns arquivos de config. A personalização interessante está no conteúdo dos agentes (arquivos markdown, skills, overrides de config), não em templates de infraestrutura. O Kustomize lida com overlays sem o overhead de um chart Helm. Se sua implantação crescer em complexidade, um chart Helm pode ser adicionado sobre esses manifests.

## O que você precisa

- Um cluster Kubernetes rodando (AKS, EKS, GKE, k3s, kind, OpenShift, etc.)
- `kubectl` conectado ao seu cluster
- Uma chave de API para pelo menos um provedor de modelo

## Início rápido

```bash
# Substitua pelo seu provedor: ANTHROPIC, GEMINI, OPENAI ou OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh

kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

Recupere o token do gateway e cole na UI de Controle:

```bash
kubectl get secret openclaw-secrets -n openclaw -o jsonpath='{.data.OPENCLAW_GATEWAY_TOKEN}' | base64 -d
```

Para depuração local, `./scripts/k8s/deploy.sh --show-token` imprime o token após o deploy.

## Teste local com Kind

Se você não tem um cluster, crie um localmente com [Kind](https://kind.sigs.k8s.io/):

```bash
./scripts/k8s/create-kind.sh           # detecta automaticamente docker ou podman
./scripts/k8s/create-kind.sh --delete  # encerrar
```

Depois implante normalmente com `./scripts/k8s/deploy.sh`.

## Passo a passo

### 1) Implantar

**Opção A** — chave de API no ambiente (uma etapa):

```bash
# Substitua pelo seu provedor: ANTHROPIC, GEMINI, OPENAI ou OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh
```

O script cria um Secret Kubernetes com a chave de API e um token de gateway gerado automaticamente, depois implanta. Se o Secret já existir, preserva o token atual do gateway e quaisquer chaves de provedor não sendo alteradas.

**Opção B** — criar o secret separadamente:

```bash
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

Use `--show-token` com qualquer comando se quiser o token impresso na saída padrão para testes locais.

### 2) Acessar o gateway

```bash
kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

## O que é implantado

```
Namespace: openclaw (configurável via OPENCLAW_NAMESPACE)
├── Deployment/openclaw        # Pod único, init container + gateway
├── Service/openclaw           # ClusterIP na porta 18789
├── PersistentVolumeClaim      # 10Gi para estado e config do agente
├── ConfigMap/openclaw-config  # opencraft.json + AGENTS.md
└── Secret/openclaw-secrets    # Token do gateway + chaves de API
```

## Personalização

### Instruções do agente

Edite o `AGENTS.md` em `scripts/k8s/manifests/configmap.yaml` e reimplante:

```bash
./scripts/k8s/deploy.sh
```

### Config do gateway

Edite `opencraft.json` em `scripts/k8s/manifests/configmap.yaml`. Veja [Configuração do Gateway](/gateway/configuration) para a referência completa.

### Adicionar provedores

Execute novamente com chaves adicionais exportadas:

```bash
export ANTHROPIC_API_KEY="..."
export OPENAI_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

Chaves de provedores existentes permanecem no Secret a menos que você as sobrescreva.

Ou faça patch no Secret diretamente:

```bash
kubectl patch secret openclaw-secrets -n openclaw \
  -p '{"stringData":{"<PROVIDER>_API_KEY":"..."}}'
kubectl rollout restart deployment/openclaw -n openclaw
```

### Namespace personalizado

```bash
OPENCLAW_NAMESPACE=meu-namespace ./scripts/k8s/deploy.sh
```

### Imagem personalizada

Edite o campo `image` em `scripts/k8s/manifests/deployment.yaml`:

```yaml
image: ghcr.io/openclaw/openclaw:2026.3.1
```

### Expor além do port-forward

Os manifests padrão fazem bind do gateway para loopback dentro do pod. Isso funciona com `kubectl port-forward`, mas não funciona com um `Service` Kubernetes ou caminho Ingress que precisa alcançar o IP do pod.

Se você quiser expor o gateway através de um Ingress ou load balancer:

- Mude o bind do gateway em `scripts/k8s/manifests/configmap.yaml` de `loopback` para um bind não-loopback que corresponda ao seu modelo de implantação
- Mantenha a auth do gateway habilitada e use um entrypoint com TLS terminado adequado
- Configure a UI de Controle para acesso remoto usando o modelo de segurança web suportado (por exemplo HTTPS/Tailscale Serve e origens permitidas explícitas quando necessário)

## Reimplantar

```bash
./scripts/k8s/deploy.sh
```

Isso aplica todos os manifests e reinicia o pod para absorver quaisquer mudanças de config ou secret.

## Encerramento

```bash
./scripts/k8s/deploy.sh --delete
```

Isso deleta o namespace e todos os recursos nele, incluindo o PVC.

## Notas de arquitetura

- O gateway faz bind para loopback dentro do pod por padrão, então a configuração incluída é para `kubectl port-forward`
- Sem recursos com escopo de cluster — tudo fica em um único namespace
- Segurança: `readOnlyRootFilesystem`, capabilities `drop: ALL`, usuário não-root (UID 1000)
- A config padrão mantém a UI de Controle no caminho mais seguro de acesso local: bind loopback mais `kubectl port-forward` para `http://127.0.0.1:18789`
- Se você for além do acesso local, use o modelo remoto suportado: HTTPS/Tailscale mais as configurações apropriadas de bind do gateway e origem da UI de Controle
- Os secrets são gerados em um diretório temporário e aplicados diretamente ao cluster — nenhum material de secret é gravado no checkout do repositório

## Estrutura de arquivos

```
scripts/k8s/
├── deploy.sh                   # Cria namespace + secret, implanta via kustomize
├── create-kind.sh              # Cluster Kind local (detecta docker/podman automaticamente)
└── manifests/
    ├── kustomization.yaml      # Base Kustomize
    ├── configmap.yaml          # opencraft.json + AGENTS.md
    ├── deployment.yaml         # Spec do pod com hardening de segurança
    ├── pvc.yaml                # Armazenamento persistente de 10Gi
    └── service.yaml            # ClusterIP na porta 18789
```
