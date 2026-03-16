---
summary: "Usar a API unificada do Qianfan para acessar muitos modelos no OpenCraft"
read_when:
  - Você quer uma única chave de API para muitos LLMs
  - Você precisa de orientação de configuração do Baidu Qianfan
title: "Qianfan"
---

# Guia do Provedor Qianfan

O Qianfan é a plataforma MaaS da Baidu e fornece uma **API unificada** que roteia requisições para muitos modelos atrás de um único
endpoint e chave de API. É compatível com OpenAI, então a maioria dos SDKs OpenAI funciona trocando a URL base.

## Pré-requisitos

1. Uma conta Baidu Cloud com acesso à API Qianfan
2. Uma chave de API do console Qianfan
3. OpenCraft instalado no seu sistema

## Obtendo sua Chave de API

1. Acesse o [Console Qianfan](https://console.bce.baidu.com/qianfan/ais/console/apiKey)
2. Crie uma nova aplicação ou selecione uma existente
3. Gere uma chave de API (formato: `bce-v3/ALTAK-...`)
4. Copie a chave de API para uso com o OpenCraft

## Configuração CLI

```bash
opencraft onboard --auth-choice qianfan-api-key
```

## Documentação relacionada

- [Configuração do OpenCraft](/gateway/configuration)
- [Provedores de Modelo](/concepts/model-providers)
- [Configuração de Agente](/concepts/agent)
- [Documentação da API Qianfan](https://cloud.baidu.com/doc/qianfan-api/s/3m7of64lb)
