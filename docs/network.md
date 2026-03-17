---
summary: "Hub de rede: superfícies do Gateway, pareamento, descoberta e segurança"
read_when:
  - Você precisa da visão geral de arquitetura de rede + segurança
  - Você está depurando acesso local vs tailnet ou pareamento
  - Você quer a lista canônica de docs de rede
title: "Rede"
---

# Hub de rede

Este hub vincula os docs principais sobre como o OpenCraft conecta, pareia e protege
dispositivos entre localhost, LAN e tailnet.

## Modelo principal

- [Arquitetura do Gateway](/concepts/architecture)
- [Protocolo do Gateway](/gateway/protocol)
- [Runbook do Gateway](/gateway)
- [Superfícies web + modos de bind](/web)

## Pareamento + identidade

- [Visão geral do pareamento (DM + nodes)](/channels/pairing)
- [Pareamento de nodes gerenciado pelo Gateway](/gateway/pairing)
- [CLI de dispositivos (pareamento + rotação de Token)](/cli/devices)
- [CLI de pareamento (aprovações de DM)](/cli/pairing)

Confiança local:

- Conexões locais (loopback ou o próprio endereço tailnet do host do Gateway) podem ser
  aprovadas automaticamente para pareamento, mantendo a experiência no mesmo host fluida.
- Clientes tailnet/LAN não locais ainda requerem aprovação explícita de pareamento.

## Descoberta + transportes

- [Descoberta e transportes](/gateway/discovery)
- [Bonjour / mDNS](/gateway/bonjour)
- [Acesso remoto (SSH)](/gateway/remote)
- [Tailscale](/gateway/tailscale)

## Nodes + transportes

- [Visão geral de Nodes](/nodes)
- [Protocolo bridge (nodes legados)](/gateway/bridge-protocol)
- [Runbook de Node: iOS](/platforms/ios)
- [Runbook de Node: Android](/platforms/android)

## Segurança

- [Visão geral de segurança](/gateway/security)
- [Referência de configuração do Gateway](/gateway/configuration)
- [Solução de problemas](/gateway/troubleshooting)
- [Doctor](/gateway/doctor)
