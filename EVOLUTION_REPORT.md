# JARVES EVOLUTION MAX — Relatório técnico v2.5.8

## Preparação v2.5.8

- Adicionado seletor de contexto para Ollama: 4096, 8192, 16384 ou 32768 tokens. O padrão de 16384 mantém o comportamento anterior.
- A escolha validada chega como `num_ctx` em chamadas locais no backend Node e no Executor HTML offline; provedores remotos não recebem esse parâmetro. Modelos e hardware podem suportar limites diferentes.
- Corrigidas instruções e exemplos que sugeriam modelos diferentes do padrão `qwen2.5:3b`; modelos já salvos permanecem intactos.
- Atualizados versão do app, backend, PWA, Android e User-Agent para 2.5.8 / versionCode 258.
- `npm test`: aprovado, 138/138; `npm run check`: aprovado, 63/63 arquivos JavaScript.
- Builds verificados: AppImage Linux x64 (124 MB) e instalador Windows x64 (120 MB), sem assinatura de código.
- APK local não compilado: Java/JDK, Gradle e Android SDK não estão disponíveis; o workflow Android do GitHub pode compilá-lo após publicação.
- Publicação GitHub e deploy BAXAI: pendentes; esta cópia continua sem metadados Git.

## Preparação v2.5.6

- Pedidos explícitos de geração de imagem no chat acionam a integração local Automatic1111/Forge. Erros de conexão/configuração são exibidos ao usuário; o fluxo não substitui imagens ausentes por ilustrações fictícias.
- Pedidos explícitos de vídeo podem usar ComfyUI local com workflow API importado e configurado; endpoint só aceita HTTP local/privado, workflow é limitado a 1 MiB, a saída é validada como MP4/WebM até 128 MiB e nenhum modelo é baixado automaticamente.
- Ferramentas e os 900 comandos foram movidos da barra lateral para o menu **Atalhos** no compositor do chat, mantendo as telas e ações disponíveis.
- O gerador de HTML agora normaliza blocos de código, verifica estrutura, fechamento de tags, recursos remotos e sintaxe JavaScript sem executar os scripts; HTML inválido gera uma tentativa de correção e, se persistir, um erro explícito.
- Adicionado controle **Testar HTML gerado**, testes unitários de regressão e casos ao conjunto de diagnóstico HTML.
- Atualizados versão do app, backend, PWA e Android para 2.5.6 / versionCode 256.
- Validação local: `npm test` 135/135; `npm run check` 63/63; diagnóstico HTML no navegador 32/32; integração de vídeo testada com um servidor ComfyUI simulado.
- Builds verificados: AppImage Linux x64 (124 MB) e instalador Windows x64 (120 MB), ambos sem assinatura de código.
- Limitações: APK não compilado (JDK, Gradle e Android SDK ausentes); geração real de vídeo não executada porque o ComfyUI/modelo não está instalado neste ambiente.
- Publicação pendente: esta cópia não tem metadados Git e o executável Git não está disponível. O código, a Release, o APK e o site BAXAI não foram enviados; a versão remota permanece 2.5.2.

## Atualização v2.5.2 (publicada)

- Implementado catálogo com 900 comandos distintos: 30 áreas por 30 ações.
- Incluída busca acessível sem distinção de acentos, limitada a 12 itens renderizados para manter a UI fluida.
- Selecionar um comando só preenche a caixa de mensagem; é necessário revisar e enviar explicitamente.
- Todas as ferramentas agora ficam no menu lateral esquerdo; o botão superior "Atalhos" foi removido.
- Os prompts instruem a IA a reconhecer dados ausentes e não alegar execução, testes ou publicação que não ocorreram.
- Atualizados versão do app, backend, frontend, cache PWA e versionCode do Android para 252.

### Validação v2.5.2

| Verificação | Resultado |
|---|---|
| Testes do catálogo e smoke da interface | Aprovado |
| Suíte completa (`npm test`) | Aprovado: 121/121 |
| Verificação JavaScript (`npm run check`) | Aprovado: 58/58 arquivos |
| Auditoria de dependências de produção (`npm audit --omit=dev`) | 0 vulnerabilidades |
| Build AppImage x64 | Gerado: `dist/JARVES-AI-2.5.2-x86_64.AppImage` |
| Build Windows EXE x64 | Gerado: `dist/JARVES-AI-Setup-2.5.2-x64.exe` |
| Smoke visual e busca de comandos no navegador | Aprovado em servidor local v2.5.2 |
| Build APK Android | Aprovado no GitHub Actions; `app-debug.apk` publicado na Release v2.5.2 (50.4 MB) |
| Release Windows x64 | `JARVES-AI-Setup-2.5.2-x64.exe` publicado (120 MB) |
| Release Linux x64 | `JARVES-AI-2.5.2-x86_64.AppImage` publicado (124 MB) |
| GitHub e site BAXAI | PR #1 integrada; Release v2.5.2 e deploy GitHub Pages concluídos e verificados |

O artefato e o código v2.4.3 descritos abaixo são a preparação anterior; a publicação atual é a v2.5.2.

## Atualização de memória v2.4.3 (preparação local)

Esta atualização corrige a preferência de memória que antes era aceita pela API, mas não controlava integralmente a criação e o uso de memórias.

- A opção de memória agora é exposta nas configurações e reflete o estado persistido.
- Desativar a memória impede novas gravações e a recuperação para o chat, sem apagar os dados já salvos; os registros continuam disponíveis para consulta e exclusão.
- O chat recupera no máximo três memórias relevantes para provedores locais. Provedores OpenAI-compatíveis não recebem essas memórias.
- Memórias desativadas individualmente são excluídas da busca contextual.
- A versão foi atualizada para 2.4.3, incluindo o cache PWA, interface, backend, metadados Android e artefatos desktop.

### Validação v2.4.3

| Verificação | Resultado |
|---|---|
| Testes completos (`npm test`) | Aprovado: 119/119 |
| Verificação JavaScript (`npm run check`) | Aprovado: 57/57 arquivos |
| Auditoria de dependências de produção (`npm audit --omit=dev`) | 0 vulnerabilidades |
| Build AppImage x64 | Gerado e verificado em `dist/JARVES-AI-2.4.3-x86_64.AppImage` |
| Build Windows EXE x64 | Gerado em `dist/JARVES-AI-Setup-2.4.3-x64.exe` |
| Build APK Android | Não executado: não há Gradle wrapper nem Gradle instalado neste ambiente |
| Teste com Ollama real | Não executado: serviço local não foi confirmado |
| Publicação GitHub / deploy BAXAI | Pendente: as ferramentas desta sessão não fornecem escrita no GitHub |

A preparação v2.4.3 foi incorporada à atualização v2.5.2 e não teve Release individual. O estado atual de publicação está descrito na seção v2.5.2 acima.

## Base publicada v2.4.2

**Pacote base:** JARVES AI 2.4.2  
**Estado:** publicada como Release v2.4.2; builds e GitHub Pages concluídos  
**Data:** 02/11/2026

## Implementado na preparação da v2.4.2

### Brain / perfis de IA
- Criado `ai/core/profiles.mjs` com perfis Geral, Programador, Pesquisador, Professor, Planejador, Analista e Criador.
- Criada a rota `GET /api/profiles`.
- Adicionado seletor de perfil ao Chat web; a escolha é persistida no armazenamento local do navegador.
- O endpoint de chat valida o perfil e limita `systemPrompt` personalizado a 8.000 caracteres.
- Instruções de perfil reforçam honestidade sobre execução, testes, fontes e incertezas.

### Ollama
- Modelo padrão para instalações novas alinhado para `qwen2.5:3b`.
- Mantidos o endereço padrão `http://127.0.0.1:11434`, o mecanismo existente de listagem, chat, streaming, timeout e cancelamento.
- Criada a rota `GET /api/models/health`, que consulta a lista de modelos e informa conexão, modelo selecionado e necessidade de instalação.
- A rota de diagnóstico é somente leitura: não chama `/api/pull` e não baixa modelos.
- Preferências Ollama que já estavam salvas não são substituídas.

### Coder / documentação
- Mantidos os recursos existentes de geração de projetos textuais, análise de código, importação e exportação.
- Atualizada a documentação de arquitetura e o changelog.
- O código gerado continua sem execução automática; compilação e alterações em projetos exigem ferramentas e aprovação próprias.

## Arquivos alterados/criados

- `ai/core/profiles.mjs` — novo catálogo e composição de perfis.
- `backend/routes/profiles.mjs` — nova API de perfis.
- `backend/routes/chat.mjs` — validação e uso dos perfis.
- `backend/routes/models.mjs` — diagnóstico de saúde do Ollama.
- `backend/server.mjs` — registro da rota de perfis.
- `backend/config/env.mjs`, `env.mjs`, `.env.example` — modelo padrão.
- `frontend/index.html`, `frontend/styles/main.css`, `frontend/scripts/app.js` — seletor no Chat.
- `frontend/scripts/base-engine.js`, `executor/base-engine.js`, `executor/browser-backend.js`, `index.html`, `app.js` — alinhamento de exemplos e padrões.
- `docs/ARCHITECTURE.md`, `docs/PROVIDER_MANAGER_2.1.md`, `README.md`, `CHANGELOG.md` — documentação.
- `tests/unit/profiles.test.mjs` — novos testes unitários.
- `tests/integration/api.test.mjs` — novos testes de API para perfis e Ollama.

## Verificações executadas

| Verificação | Resultado |
|---|---|
| `npm run check` | Aprovado: 57/57 arquivos JavaScript |
| Testes unitários de perfis | Aprovado: 3/3 |
| Suíte de testes (`npm test`) | Aprovada: 117/117 testes |
| `npm run check` | Aprovado: 57/57 arquivos JavaScript |
| `npm ci` | Concluído; CI e builds passaram |
| Build APK / EXE / AppImage | Aprovados e publicados na Release v2.4.2 |
| Teste real com Ollama local | Não executado; serviço local não foi confirmado |
| Deploy BAXAI / GitHub Pages | Aprovado: https://pedrommmmmmm143-dot.github.io/jarves/ |

No snapshot da release, `npm ci`, `npm run check` e `npm test` foram concluídos com sucesso (117/117 testes). `npm ci` reportou 15 vulnerabilidades moderadas nas dependências; elas não foram alteradas nesta publicação.

## Limitações e itens pendentes

1. A integração de perfis foi adicionada ao Chat web/backend. O aplicativo Android nativo ainda não recebeu um seletor de perfis equivalente.
2. A voz existente depende das APIs/vozes disponíveis no navegador ou no Android; reconhecimento offline não é garantido.
3. O sistema Coder existente gera e analisa código, mas não oferece execução irrestrita e automática de projetos. Compiladores/SDKs precisam estar instalados.
4. O modo Ollama requer instalação do próprio Ollama e do modelo escolhido. O JARVES não baixa o modelo automaticamente.
5. Os instaladores foram gerados pelos workflows do GitHub Actions e publicados na Release v2.4.2.
6. A Release v2.4.2 e a página GitHub Pages foram publicadas.

## Publicação

O código está publicado em [pedrommmmmmm143-dot/jarves](https://github.com/pedrommmmmmm143-dot/jarves). A Release [v2.4.2](https://github.com/pedrommmmmmm143-dot/jarves/releases/tag/v2.4.2) contém `app-debug.apk`, `JARVES-AI-Setup-2.4.2-x64.exe` e `JARVES-AI-2.4.2-x86_64.AppImage`. Os downloads estão disponíveis em [GitHub Pages](https://pedrommmmmmm143-dot.github.io/jarves/). O APK é de depuração e o EXE não possui assinatura digital.

## Próxima validação recomendada

Em ambiente com rede e dependências instaláveis:

```bash
npm ci
npm run check
npm test
npm start
```

Depois, com Ollama instalado e iniciado:

```bash
ollama serve
ollama pull qwen2.5:3b
```

O download do modelo deve ser iniciado manualmente pelo usuário. Verifique `http://127.0.0.1:3000/api/models/health` e faça testes de chat/streaming antes de criar uma tag de Release.

**Conclusão:** as melhorias de perfis de IA, validação de contexto e diagnóstico Ollama foram publicadas e verificadas. A release oferece os três instaladores; as limitações funcionais listadas acima permanecem.
