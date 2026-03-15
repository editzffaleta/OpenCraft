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

## Quando Usar

✅ **USE esta skill quando:**

- "Acender/apagar as luzes"
- "Diminuir as luzes da sala"
- "Definir uma cena" ou "modo cinema"
- Controlar quartos ou zonas Hue específicos
- Ajustar brilho, cor ou temperatura de cor

## Quando NÃO Usar

❌ **NÃO use esta skill quando:**

- Dispositivos inteligentes não-Hue (outras marcas) → não suportado
- Cenas HomeKit ou Atalhos → use o ecossistema Apple
- Controle de TV ou sistema de entretenimento
- Termostato ou HVAC
- Tomadas inteligentes (exceto tomadas Hue)

## Comandos Comuns

### Listar Recursos

```bash
openhue get light       # Listar todas as luzes
openhue get room        # Listar todos os quartos
openhue get scene       # Listar todas as cenas
```

### Controlar Luzes

```bash
# Acender/apagar
openhue set light "Abajur do Quarto" --on
openhue set light "Abajur do Quarto" --off

# Brilho (0-100)
openhue set light "Abajur do Quarto" --on --brightness 50

# Temperatura de cor (quente a frio: 153-500 mirek)
openhue set light "Abajur do Quarto" --on --temperature 300

# Cor (por nome ou hex)
openhue set light "Abajur do Quarto" --on --color red
openhue set light "Abajur do Quarto" --on --rgb "#FF5500"
```

### Controlar Quartos

```bash
# Apagar quarto inteiro
openhue set room "Quarto" --off

# Definir brilho do quarto
openhue set room "Quarto" --on --brightness 30
```

### Cenas

```bash
# Ativar cena
openhue set scene "Relaxar" --room "Quarto"
openhue set scene "Concentrar" --room "Escritório"
```

## Presets Rápidos

```bash
# Hora de dormir (dim quente)
openhue set room "Quarto" --on --brightness 20 --temperature 450

# Modo trabalho (brilhante frio)
openhue set room "Escritório" --on --brightness 100 --temperature 250

# Modo cinema (dim)
openhue set room "Sala" --on --brightness 10
```

## Notas

- Bridge deve estar na rede local
- Primeira execução requer pressionar o botão na Hue Bridge para parear
- Cores funcionam apenas em lâmpadas com suporte a cor (não apenas branco)
