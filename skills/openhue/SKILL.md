---
name: openhue
description: Controle luzes e cenas Philips Hue via CLI OpenHue.
homepage: https://www.openhue.io/cli
metadata:
  {
    "opencraft":
      {
        "emoji": "💡",
        "requires": { "bins": ["openhue"] },
        "install":
          [
            {
              "id": "brew",
              "kind": "brew",
              "formula": "openhue/cli/openhue-cli",
              "bins": ["openhue"],
              "label": "Instalar OpenHue CLI (brew)",
            },
          ],
      },
  }
---

# OpenHue CLI

Use `openhue` para controlar luzes e cenas Philips Hue via uma Hue Bridge.

## Quando usar

✅ **USE esta skill quando:**

- "Acender/apagar as luzes"
- "Diminuir a luz da sala de estar"
- "Definir uma cena" ou "modo cinema"
- Controlar quartos ou zonas Hue específicos
- Ajustar brilho, cor ou temperatura de cor

## Quando NÃO usar

❌ **NÃO use esta skill quando:**

- Dispositivos inteligentes não-Hue (outras marcas) → não suportado
- Cenas HomeKit ou Atalhos → use o ecossistema da Apple
- Controle de TV ou sistema de entretenimento
- Termostato ou ar-condicionado
- Tomadas inteligentes (a menos que sejam tomadas inteligentes Hue)

## Comandos comuns

### Listar recursos

```bash
openhue get light       # Listar todas as luzes
openhue get room        # Listar todos os quartos
openhue get scene       # Listar todas as cenas
```

### Controlar luzes

```bash
# Ligar/desligar
openhue set light "Bedroom Lamp" --on
openhue set light "Bedroom Lamp" --off

# Brilho (0-100)
openhue set light "Bedroom Lamp" --on --brightness 50

# Temperatura de cor (quente a frio: 153-500 mirek)
openhue set light "Bedroom Lamp" --on --temperature 300

# Cor (por nome ou hex)
openhue set light "Bedroom Lamp" --on --color red
openhue set light "Bedroom Lamp" --on --rgb "#FF5500"
```

### Controlar quartos

```bash
# Desligar quarto inteiro
openhue set room "Bedroom" --off

# Definir brilho do quarto
openhue set room "Bedroom" --on --brightness 30
```

### Cenas

```bash
# Ativar cena
openhue set scene "Relax" --room "Bedroom"
openhue set scene "Concentrate" --room "Office"
```

## Predefinições rápidas

```bash
# Hora de dormir (quente e suave)
openhue set room "Bedroom" --on --brightness 20 --temperature 450

# Modo trabalho (brilhante e frio)
openhue set room "Office" --on --brightness 100 --temperature 250

# Modo cinema (suave)
openhue set room "Living Room" --on --brightness 10
```

## Observações

- A bridge deve estar na rede local
- Na primeira execução é necessário pressionar o botão na Hue Bridge para emparelhar
- As cores só funcionam em lâmpadas com suporte a cores (não as de apenas branco)
