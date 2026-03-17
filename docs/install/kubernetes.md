---
summary: "Implante o Gateway OpenCraft em um cluster Kubernetes com Kustomize"
read_when:
  - Você quer rodar o OpenCraft em um cluster Kubernetes
  - Você quer testar o OpenCraft em um ambiente Kubernetes
title: "Kubernetes"
---

# OpenCraft no Kubernetes

Um ponto de partida mínimo para rodar o OpenCraft no Kubernetes - não é uma implantação pronta para produção. Cobre os recursos principais e é destinado a ser adaptado ao seu ambiente.

## Por que não Helm?

O OpenCraft é um único contêiner com alguns arquivos de configuração. A personalização interessante está no conteúdo do agente (arquivos markdown, Skills, overrides de config), não em templates de infraestrutura. Kustomize lida com overlays sem a sobrecarga de um Helm chart. Se sua implantação ficar mais complexa, um Helm chart pode ser adicionado sobre estes manifests.

## O que você precisa

- Um cluster Kubernetes rodando (AKS, EKS, GKE, k3s, kind, OpenShift, etc.)
- `kubectl` conectado ao seu cluster
- Uma chave de API para pelo menos um provedor de modelo

## Início rápido

```bash
# Substitua pelo seu provedor: ANTHROPIC, GEMINI, OPENAI ou OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh

kubectl port-forward svc/opencraft 18789:18789 -n opencraft
open http://localhost:18789
```

Obtenha o token do gateway e cole na Control UI:

```bash
kubectl get secret opencraft-secrets -n opencraft -o jsonpath='{.data.OPENCLAW_GATEWAY_TOKEN}' | base64 -d
```

Para depuração local, `./scripts/k8s/deploy.sh --show-token` exibe o token após o deploy.

## Teste local com Kind

Se você não tem um cluster, crie um localmente com [Kind](https://kind.sigs.k8s.io/):

```bash
./scripts/k8s/create-kind.sh           # detecta automaticamente docker ou podman
./scripts/k8s/create-kind.sh --delete  # desmontar
```

Depois implante normalmente com `./scripts/k8s/deploy.sh`.

## Passo a passo

### 1) Implantar

**Opção A** - Chave de API no ambiente (uma etapa):

```bash
# Substitua pelo seu provedor: ANTHROPIC, GEMINI, OPENAI ou OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh
```

O script cria um Secret Kubernetes com a chave de API e um token de gateway gerado automaticamente, depois implanta. Se o Secret já existir, ele preserva o token de gateway atual e quaisquer chaves de provedor que não estejam sendo alteradas.

**Opção B** - Criar o secret separadamente:

```bash
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

Use `--show-token` com qualquer comando se quiser o token impresso no stdout para teste local.

### 2) Acessar o gateway

```bash
kubectl port-forward svc/opencraft 18789:18789 -n opencraft
open http://localhost:18789
```

## O que é implantado

```
Namespace: opencraft (configurável via OPENCRAFT_NAMESPACE)
├── Deployment/opencraft        # Pod único, init container + gateway
├── Service/opencraft           # ClusterIP na porta 18789
├── PersistentVolumeClaim      # 10Gi para estado e configuração do agente
├── ConfigMap/opencraft-config  # opencraft.json + AGENTS.md
└── Secret/opencraft-secrets    # Token do Gateway + chaves de API
```

## Personalização

### Instruções do agente

Edite o `AGENTS.md` em `scripts/k8s/manifests/configmap.yaml` e reimplante:

```bash
./scripts/k8s/deploy.sh
```

### Configuração do Gateway

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

Ou faça patch do Secret diretamente:

```bash
kubectl patch secret opencraft-secrets -n opencraft \
  -p '{"stringData":{"<PROVIDER>_API_KEY":"..."}}'
kubectl rollout restart deployment/opencraft -n opencraft
```

### Namespace personalizado

```bash
OPENCRAFT_NAMESPACE=my-namespace ./scripts/k8s/deploy.sh
```

### Imagem personalizada

Edite o campo `image` em `scripts/k8s/manifests/deployment.yaml`:

```yaml
image: ghcr.io/editzffaleta/OpenCraft:2026.3.1
```

### Expor além do port-forward

Os manifests padrão vinculam o gateway ao loopback dentro do pod. Isso funciona com `kubectl port-forward`, mas não funciona com um `Service` Kubernetes ou caminho Ingress que precisa alcançar o IP do pod.

Se você quiser expor o gateway através de um Ingress ou load balancer:

- Altere o bind do gateway em `scripts/k8s/manifests/configmap.yaml` de `loopback` para um bind não-loopback que corresponda ao seu modelo de implantação
- Mantenha a autenticação do gateway habilitada e use um ponto de entrada com TLS terminado adequadamente
- Configure a Control UI para acesso remoto usando o modelo de segurança web suportado (por exemplo HTTPS/Tailscale Serve e origens permitidas explícitas quando necessário)

## Reimplantar

```bash
./scripts/k8s/deploy.sh
```

Isso aplica todos os manifests e reinicia o pod para captar quaisquer mudanças de config ou secret.

## Remoção

```bash
./scripts/k8s/deploy.sh --delete
```

Isso deleta o namespace e todos os recursos nele, incluindo o PVC.

## Notas de arquitetura

- O gateway vincula ao loopback dentro do pod por padrão, então a configuração incluída é para `kubectl port-forward`
- Sem recursos de escopo de cluster - tudo fica em um único namespace
- Segurança: `readOnlyRootFilesystem`, `drop: ALL` capabilities, usuário non-root (UID 1000)
- A configuração padrão mantém a Control UI no caminho mais seguro de acesso local: bind loopback mais `kubectl port-forward` para `http://127.0.0.1:18789`
- Se você ir além do acesso localhost, use o modelo remoto suportado: HTTPS/Tailscale mais o bind de gateway e configurações de origem da Control UI apropriados
- Secrets são gerados em um diretório temporário e aplicados diretamente ao cluster - nenhum material secreto é escrito no checkout do repositório

## Estrutura de arquivos

```
scripts/k8s/
├── deploy.sh                   # Cria namespace + secret, implanta via kustomize
├── create-kind.sh              # Cluster Kind local (detecta automaticamente docker/podman)
└── manifests/
    ├── kustomization.yaml      # Base do Kustomize
    ├── configmap.yaml          # opencraft.json + AGENTS.md
    ├── deployment.yaml         # Spec do Pod com hardening de segurança
    ├── pvc.yaml                # Armazenamento persistente de 10Gi
    └── service.yaml            # ClusterIP na porta 18789
```
