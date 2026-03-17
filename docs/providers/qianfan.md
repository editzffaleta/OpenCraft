---
summary: "Use a API unificada do Qianfan para acessar diversos modelos no OpenCraft"
read_when:
  - Você quer uma única API key para vários LLMs
  - Você precisa de orientação para configurar o Baidu Qianfan
title: "Qianfan"
---

# Guia do Provider Qianfan

Qianfan é a plataforma MaaS da Baidu, que fornece uma **API unificada** que roteia requisições para diversos modelos por trás de um único
endpoint e API key. É compatível com OpenAI, então a maioria dos SDKs OpenAI funciona trocando a URL base.

## Pré-requisitos

1. Uma conta Baidu Cloud com acesso à API do Qianfan
2. Uma API key do console do Qianfan
3. OpenCraft instalado no seu sistema

## Obtendo sua API key

1. Visite o [Console do Qianfan](https://console.bce.baidu.com/qianfan/ais/console/apiKey)
2. Crie uma nova aplicação ou selecione uma existente
3. Gere uma API key (formato: `bce-v3/ALTAK-...`)
4. Copie a API key para usar com o OpenCraft

## Configuração via CLI

```bash
opencraft onboard --auth-choice qianfan-api-key
```

## Documentação relacionada

- [Configuração do OpenCraft](/gateway/configuration)
- [Providers de modelo](/concepts/model-providers)
- [Configuração de agente](/concepts/agent)
- [Documentação da API Qianfan](https://cloud.baidu.com/doc/qianfan-api/s/3m7of64lb)
