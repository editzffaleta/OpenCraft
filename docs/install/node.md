---
title: "Node.js"
summary: "Instale e configure Node.js para o OpenCraft - requisitos de versão, opções de instalação e solução de problemas de PATH"
read_when:
  - "Você precisa instalar Node.js antes de instalar o OpenCraft"
  - "Você instalou o OpenCraft mas `opencraft` dá comando não encontrado"
  - "npm install -g falha com problemas de permissões ou PATH"
---

# Node.js

O OpenCraft requer **Node 22.16 ou mais recente**. **Node 24 é o runtime padrão e recomendado** para instalações, CI e fluxos de release. Node 22 continua suportado via a linha LTS ativa. O [script de instalação](/install#install-methods) vai detectar e instalar Node.js automaticamente - esta página é para quando você quer configurar Node.js manualmente e garantir que tudo esteja configurado corretamente (versões, PATH, instalações globais).

## Verifique sua versão

```bash
node -v
```

Se isso mostrar `v24.x.x` ou superior, você está no padrão recomendado. Se mostrar `v22.16.x` ou superior, você está no caminho suportado Node 22 LTS, mas ainda recomendamos atualizar para Node 24 quando conveniente. Se Node.js não estiver instalado ou a versão for muito antiga, escolha um método de instalação abaixo.

## Instalar Node.js

<Tabs>
  <Tab title="macOS">
    **Homebrew** (recomendado):

    ```bash
    brew install node
    ```

    Ou baixe o instalador macOS de [nodejs.org](https://nodejs.org/).

  </Tab>
  <Tab title="Linux">
    **Ubuntu / Debian:**

    ```bash
    curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
    sudo apt-get install -y nodejs
    ```

    **Fedora / RHEL:**

    ```bash
    sudo dnf install nodejs
    ```

    Ou use um gerenciador de versões (veja abaixo).

  </Tab>
  <Tab title="Windows">
    **winget** (recomendado):

    ```powershell
    winget install OpenJS.NodeJS.LTS
    ```

    **Chocolatey:**

    ```powershell
    choco install nodejs-lts
    ```

    Ou baixe o instalador Windows de [nodejs.org](https://nodejs.org/).

  </Tab>
</Tabs>

<Accordion title="Usando um gerenciador de versões (nvm, fnm, mise, asdf)">
  Gerenciadores de versões permitem alternar entre versões do Node.js facilmente. Opções populares:

- [**fnm**](https://github.com/Schniz/fnm) - rápido, multiplataforma
- [**nvm**](https://github.com/nvm-sh/nvm) - amplamente usado no macOS/Linux
- [**mise**](https://mise.jdx.dev/) - poliglota (Node.js, Python, Ruby, etc.)

Exemplo com fnm:

```bash
fnm install 24
fnm use 24
```

  <Warning>
  Certifique-se de que seu gerenciador de versões é inicializado no arquivo de inicialização do shell (`~/.zshrc` ou `~/.bashrc`). Se não for, `opencraft` pode não ser encontrado em novas sessões de terminal porque o PATH não incluirá o diretório bin do Node.js.
  </Warning>
</Accordion>

## Solução de problemas

### `opencraft: command not found`

Isso quase sempre significa que o diretório global de binários do npm não está no seu PATH.

<Steps>
  <Step title="Encontre seu prefixo global do npm">
    ```bash
    npm prefix -g
    ```
  </Step>
  <Step title="Verifique se está no seu PATH">
    ```bash
    echo "$PATH"
    ```

    Procure por `<npm-prefix>/bin` (macOS/Linux) ou `<npm-prefix>` (Windows) na saída.

  </Step>
  <Step title="Adicione ao arquivo de inicialização do shell">
    <Tabs>
      <Tab title="macOS / Linux">
        Adicione ao `~/.zshrc` ou `~/.bashrc`:

        ```bash
        export PATH="$(npm prefix -g)/bin:$PATH"
        ```

        Depois abra um novo terminal (ou execute `rehash` no zsh / `hash -r` no bash).
      </Tab>
      <Tab title="Windows">
        Adicione a saída de `npm prefix -g` ao PATH do sistema via Configurações → Sistema → Variáveis de Ambiente.
      </Tab>
    </Tabs>

  </Step>
</Steps>

### Erros de permissão no `npm install -g` (Linux)

Se você ver erros `EACCES`, mude o prefixo global do npm para um diretório gravável pelo usuário:

```bash
mkdir -p "$HOME/.npm-global"
npm config set prefix "$HOME/.npm-global"
export PATH="$HOME/.npm-global/bin:$PATH"
```

Adicione a linha `export PATH=...` ao seu `~/.bashrc` ou `~/.zshrc` para torná-la permanente.
