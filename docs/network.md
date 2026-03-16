---
summary: "Hub de rede: superfícies do gateway, pareamento, descoberta e segurança"
read_when:
  - Você precisa da visão geral de arquitetura de rede + segurança
  - Você está depurando acesso local vs tailnet ou pareamento
  - Você quer a lista canônica de docs de rede
title: "Rede"
---

# Hub de Rede

Este hub linka os docs principais sobre como o OpenCraft conecta, pareia e protege
dispositivos via localhost, LAN e tailnet.

## Modelo principal

- [Arquitetura do Gateway](/concepts/architecture)
- [Protocolo do Gateway](/gateway/protocol)
- [Runbook do Gateway](/gateway)
- [Superfícies Web + modos de bind](/web)

## Pareamento + identidade

- [Visão geral de pareamento (DM + nodes)](/channels/pairing)
- [Pareamento de node pelo Gateway](/gateway/pairing)
- [CLI de devices (pareamento + rotação de token)](/cli/devices)
- [CLI de pareamento (aprovações de DM)](/cli/pairing)

Confiança local:

- Conexões locais (loopback ou o endereço tailnet do próprio host do gateway) podem ser
  aprovadas automaticamente para pareamento para manter a UX fluida no mesmo host.
- Clientes tailnet/LAN não-locais ainda requerem aprovação explícita de pareamento.

## Descoberta + transportes

- [Descoberta & transportes](/gateway/discovery)
- [Bonjour / mDNS](/gateway/bonjour)
- [Acesso remoto (SSH)](/gateway/remote)
- [Tailscale](/gateway/tailscale)

## Nodes + transportes

- [Visão geral de nodes](/nodes)
- [Protocolo de bridge (nodes legados)](/gateway/bridge-protocol)
- [Runbook de node: iOS](/platforms/ios)
- [Runbook de node: Android](/platforms/android)

## Segurança

- [Visão geral de segurança](/gateway/security)
- [Referência de config do Gateway](/gateway/configuration)
- [Resolução de problemas](/gateway/troubleshooting)
- [Doctor](/gateway/doctor)
