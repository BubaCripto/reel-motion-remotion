# Reel Motion Studio V6 — Editor de Reels com Remotion

Projeto local **React + TypeScript + Vite + Remotion**. Importa vídeo e legendas SRT, organiza legendas e elementos em uma timeline multicamadas e exporta vídeo vertical MP4 H.264. Esta versão amplia o código da V5 mantendo os presets de referência, agora com suporte a edição por palavra, keyframes e elementos independentes.

> **Validação atual:** 59 testes automatizados, checagem TypeScript e build de produção executados. FPS verificado com arquivos reais de 24 e 29,97 fps, controles automático/manual, preservação dos tempos e layout responsivo. Templates verificados no navegador com os oito tipos de variável, lotes CSV/JSON e persistência após recarregar. Duas versões curtas foram exportadas pela fila em MP4 H.264. Ainda revise os vídeos finais antes de publicar.

## Instalação no Windows

Pré-requisitos: **Node.js 22** ou posterior e **FFmpeg** disponível no PATH. No terminal PowerShell, entre na pasta extraída:

```powershell
npm install
npm run dev
```

Abra **http://127.0.0.1:5173**. Para rodar os testes e checagem de tipos, após a instalação:

```powershell
npm test
npm run check
npm run build
```

Abra **Remotion Studio** com `npm run studio`. Renderize o JSON de exemplo com:

```powershell
npm run render -- projects/example.json out/exemplo.mp4
```

Use **Exportar MP4** dentro do editor para renderizar o projeto atual (com mídia local previamente importada). Os arquivos importados são gravados em `public/media/` e os vídeos exportados em `public/renders/`.

## Fluxo básico

1. Importe **MP4** (MOV/WebM dependem de compatibilidade dos codecs).
2. Importe um **SRT**, com a minutagem de cada trecho, ou use Whisper.
3. Selecione a legenda na timeline; altere texto, tempo, posição, fonte, contorno e preset só daquele bloco. Marque `[BALEIA]` para destacar uma palavra, sem exibir os colchetes.
4. Clique em **Gerar tempos de cada palavra** e abra a faixa **PALAVRAS**; arraste ou ajuste os horários para sincronização mais fina. Quando a transcrição vier do `faster-whisper`, os tempos das palavras vêm do modelo, não de uma divisão proporcional.
5. Para adicionar motion ao vídeo, selecione o trecho e crie keyframes no cursor. Divida trechos com **Dividir no playhead**.
6. Na aba **Elementos**, adicione textos, imagens, figuras, rabiscos, efeitos e áudio como camadas independentes. Clique em **Exportar MP4**.

## Principais recursos implementados no código

| Área | Recurso | Observações |
|---|---|---|
| Legendas | Importação SRT e edição independente | Preserva início/fim do SRT |
| Palavra | Faixa individual, ajuste de tempo e motion | Sem Word JSON, tempos iniciais são proporcionais |
| Presets | 40 opções, incluindo quatro inspiradas nas referências | Efeito e acabamento podem variar das imagens originais |
| Tipografia | Fontes locais personalizadas, negrito, itálico, contorno, cor, destaque | Traga seus arquivos `.otf`, `.ttf`, `.woff` ou `.woff2` com licença válida |
| Motion | Entrada e saída, layout e keyframes | X/Y, escala, rotação, opacidade; easing suavizado |
| Vídeo | Importação, divisão, remoção, duração, velocidade, zoom, mute | Não é um NLE completo com edição de áudio multipista profissional |
| Timeline | Vídeo, legendas, palavras, elementos, efeitos e áudio | Arraste de blocos e alças de corte |
| Elementos | Textos, PNG/SVG, formas, linhas, rabiscos, flash, vinheta e grain | Alguns efeitos são estilizados, não equivalentes ao After Effects |
| Autozoom | Zooms sugeridos pelos intervalos das legendas | Heurística, revisão manual recomendada |
| Silêncios | FFmpeg detecta e remove pausas do vídeo original | Disponível para **um vídeo único não editado**; revisão de sincronização obrigatória |
| Auto Reframe | FaceDetector do navegador cria keyframes de centro do rosto | **Experimental**, depende da disponibilidade da API; pode não funcionar no navegador atual |
| Áudio | Importação e picos aproximados de amplitude | Análise para arquivos de áudio separados, não separação de faixas do vídeo |
| Biblioteca | Projetos JSON, localStorage, identidades visuais | Salva configurações, não embute os vídeos nos JSONs |
| Lote | Renderiza projetos salvos sequencialmente | Mantém links individuais para download |
| IA | Whisper/faster-whisper e Gemini via AG Local Bridge | Transcrição local; direção criativa e revisão pela bridge do Antigravity |
| Saída | MP4 H.264 1080×1920 | Render pela linha de comando Remotion no servidor Vite local |

## Transcrição e alinhamento por palavra

**Opção A — SRT convencional:** importe o arquivo. A divisão automática de palavras cria tempos *estimados* a partir da duração total da frase. Ajuste manualmente na timeline.

**Opção B — Whisper, transcrição por trecho:** requer Python, FFmpeg e:

```powershell
pip install -U openai-whisper
```

No editor → IA → **Transcrever vídeo → SRT sincronizado**.

**Opção C — faster-whisper, minutagem por palavra:** requer:

```powershell
pip install -U faster-whisper
```

No editor → IA → **Sincronização por palavra (faster-whisper)**. O primeiro uso pode baixar modelos. O processamento fica na sua máquina. Esse caminho usa `scripts/transcribe_words.py` e retorna um JSON com cada palavra e seus tempos.

## Gemini via AG Local Bridge

As ferramentas de IA usam Gemini pela extensão AG Local Bridge do Antigravity, em `http://127.0.0.1:11435/v1`. O modelo pode ser escolhido na aba **IA**. Não é necessário Ollama. As sugestões de estilo atuam somente nas legendas geradas; textos manuais e elementos do projeto permanecem independentes.

## Editor de ritmo — Fase 1

1. Importe o vídeo e gere a transcrição ou importe um SRT. Os textos manuais do projeto são preservados em sua própria faixa.
2. Abra **Ritmo**, informe o objetivo do Reel e clique em **Analisar ritmo · Gemini**.
3. Confira a pontuação estimada do gancho, os riscos por trecho e os marcadores coloridos da timeline. O painel informa se o áudio dos primeiros 3 segundos pôde ser medido com FFmpeg.
4. Use **Ver trecho**, **Aplicar** ou **Ignorar** em cada sugestão. Cortes, zoom, enquadramento e textos editoriais podem ser desfeitos. Depois de um corte, analise novamente: o conteúdo e os tempos mudaram.
5. Use **Criar cópias A/B na biblioteca** para manter o Original e comparar duas aberturas com título, zoom e CTA distintos. O áudio não é regravado. Uma abertura só remove silêncio inicial se ele foi confirmado na medição do áudio.
6. Escolha **Usar e editar** na versão principal. A troca guarda as edições da versão anterior; a exportação MP4 usa a versão atual, indicada no botão de exportação. Salve ou exporte o JSON para continuar depois.

Os pontos de B-roll são sugestões de localização para inserir sua própria mídia; não geram filmagem. As pontuações são avaliações editoriais, não uma previsão comprovada de audiência. A análise e as versões são preservadas no JSON e na Biblioteca. O navegador não copia os arquivos de mídia: mantenha `public/media` disponível.

## Exportação estável de vídeo

### Identificação automática de FPS

O painel **FPS da mídia**, à direita, usa FFprobe para identificar o FPS do arquivo, a taxa racional (como `30000/1001`), resolução e quantidade de quadros quando disponível. Também verifica o arquivo original das mídias otimizadas e amostra até 240 timestamps para sinalizar cadência variável. “Sem variação na amostra” não garante que a gravação inteira seja constante.

FFprobe deve estar disponível no PATH junto ao FFmpeg. Para uma instalação em outro local, configure `REEL_FFPROBE` com o caminho do executável. Em telas menores, as informações ficam no resumo de FPS abaixo dos controles do projeto.

Em **FPS de exportação**, escolha **Automático** ou uma taxa manual, incluindo 23,976, 29,97 e 59,94 fps. O automático segue o primeiro vídeo principal e é verificado novamente no servidor, na fila de versões e na exportação CLI. Uma fonte variável gera um MP4 de FPS constante; a taxa nominal é preferida quando válida. Fontes com FPS diferentes geram um aviso, pois a saída tem uma única cadência.

Projetos novos começam no automático. JSONs antigos preservam o FPS existente; use **Usar FPS da fonte** para ajustar conscientemente. Alterar o FPS não reposiciona nem estica cortes, legendas, palavras ou keyframes: os tempos continuam em segundos. Se o FPS não puder ser identificado, escolha uma taxa manual em vez de depender de uma suposição.

O vídeo principal, o B-roll e os projetos antigos que usam `videoSrc` usam `OffthreadVideo`: o preview continua com reprodução HTML5, mas a exportação extrai o frame solicitado fora do navegador. Isso evita os saltos para frames anteriores observados ao exportar mídia 24 fps em um projeto de 30 fps com `Html5Video`.

O codec permanece H.264, com áudio AAC e o FPS escolhido no projeto. A diferença normal de cadência entre uma fonte de 24 fps e uma saída de 30 fps não é removida por interpolação artificial. Não é necessário recriar o projeto ou gerar legendas novamente; basta exportar um novo MP4 após atualizar o editor.

## Reframe e corte por silêncio

O **FaceDetector** pode não estar disponível na sua versão do navegador. Neste caso, crie keyframes manualmente (selecione vídeo, habilite criação de keyframes e reposicione a âncora). O corte por silêncio usa FFmpeg `silencedetect`, remapeia os tempos dos blocos e deve ser revisado visualmente antes da exportação. Não use diretamente sobre uma sequência de cortes previamente montada. Faça backup do JSON antes.

## Pontos para validação antes de uso em produção

- Instalar dependências e corrigir eventuais diferenças de tipos de API Remotion/Vite.
- Renderizar pelo menos três vídeos reais, incluindo entrada MOV, SRT e assets locais.
- Conferir estabilidade do preview e export com áudio longo e arquivos grandes.
- Testar a sincronização por palavra contra fala acelerada e pontuação.
- Validar e ajustar cortes automáticos com silêncios, especialmente efeitos e áudios independentes.
- Confirmar carregamento de fontes personalizadas nos frames renderizados.
- Validar os recursos experimentais de reframe no Windows/Edge/Chrome.
- Avaliar a segurança do servidor local e a gestão de espaço de arquivos temporários para uma distribuição comercial.

## Atalhos

`Espaço`: play/pause · `Ctrl+Z`: desfazer · `Ctrl+Y`: refazer · `Ctrl+D`: duplicar · `Delete`: excluir.

## Estrutura

- `src/main.tsx`: editor e controles da timeline.
- `src/lib/project.ts`: modelo dos projetos, SRT, palavras e keyframes.
- `src/remotion/ReelVideo.tsx`: render de vídeo, legendas e camadas.
- `vite.config.ts`: endpoints locais para upload/render/transcrição.
- `scripts/transcribe_words.py`: alinhamento por palavra via faster-whisper.
- `scripts/render.mjs`: export pela CLI.
- `tests/project.test.ts`: testes de SRT, palavras, migração e keyframes.
- `src/lib/rhythm.ts`: validação editorial, aplicação de sugestões e versões A/B.
- `src/features/rhythm/`: painel de ritmo e marcadores da timeline.
- `server/rhythm.ts`: análise Gemini via bridge e medição do áudio inicial.
- `tests/transcript.test.ts`: preservação dos textos manuais ao gerar legendas.
- `tests/rhythm.test.ts`: cortes, revisão de sugestões, CTA e troca A/B.

**Fontes:** arquivos de fontes comerciais/proprietárias não são fornecidos neste ZIP; importe somente arquivos para os quais você tenha os direitos de uso.

## Templates reutilizáveis — Fase 2

1. Abra **Templates → Biblioteca** e use **Salvar projeto como template**. O modelo recebe uma cópia independente do projeto aberto.
2. Em **Variáveis**, selecione o tipo de campo e o **elemento alvo**. Defina uma chave simples como `titulo`, `cta`, `cor`, `fonte`, `logo`, `video`, `broll` ou `duracao`. Clique em **Vincular campo** e **Salvar variáveis**. Pode haver vários campos do mesmo tipo, com chaves diferentes.
3. Título/CTA só podem apontar para textos manuais ou camadas de texto. Legendas geradas não são alvos de substituição de texto. Cores/fontes globais vinculam também valores explícitos iguais à identidade original; estilos personalizados diferentes são preservados. Um mesmo alvo/propriedade não pode pertencer a dois campos.
4. Se faltar um elemento, crie **Texto de título**, **Texto de CTA**, **Espaço de logo**, **Espaço de B-roll** ou **Vídeo principal** no próprio modelo. Esses espaços não mudam o projeto original. Logo tem posição/escala própria; B-roll aparece em sua faixa e atrás dos textos no preview e no MP4.
5. Em **Preencher**, informe os valores e use **Gerar versão na fila** ou **Gerar e abrir no editor**. Abrir uma versão cria uma cópia editável; a fila mantém o snapshot gerado.
6. Em **Arquivos do template**, envie imagens, vídeos e fontes locais. Use o **alias** mostrado (por exemplo, `produto-a.mp4`) nos campos ou no lote. Fontes importadas são incorporadas ao cadastro de fontes da versão. Os arquivos continuam em `public/media`; o JSON não embute suas mídias.
7. Baixe **Exemplo JSON** ou **Exemplo CSV**, preencha uma linha por cliente/produto/campanha e use **Importar lista e gerar versões**. Limites: 200 linhas e 2 MB por arquivo. CSV aceita vírgula ou ponto e vírgula, aspas e textos com quebra de linha. Chaves desconhecidas e dados inválidos são reportados por linha. A coluna opcional `nome` identifica a versão (também são aceitas `cliente`, `produto` e `campanha` para nomeá-la).
8. Na **Fila**, abra ou baixe o JSON de cada versão, salve todas na Biblioteca de projetos ou renderize MP4s sequencialmente. É possível pausar após o vídeo atual e tentar novamente versões com erro. Recarregar a página não dispara renders automaticamente.

Exemplo de lote, após vincular esses campos no modelo:

```csv
nome;titulo;cta;cor;fonte;logo;video;broll;duracao
Cliente A;Oferta [ESPECIAL];Saiba mais;#2299ff;Inter;marca.png;produto-a.mp4;detalhe-a.mp4;12
Cliente B;Nova [COLEÇÃO];Comente agora;#ff5588;Montserrat;marca.png;produto-b.mp4;detalhe-b.mp4;15
```

**Duração:** campos de duração usam segundos. Ao mudar um bloco de vídeo principal, as outras trilhas, palavras e keyframes são reajustadas juntas; blocos posteriores acompanham a mudança. Sem troca da mídia, a velocidade muda para preservar o trecho original. Com mídia nova, mantém-se a velocidade do modelo e o novo arquivo deve cobrir o intervalo solicitado, incluindo os cortes de origem. Duração de texto/camada altera somente aquele bloco.

**Preservação:** trocar o vídeo principal não apaga textos nem legendas. Se já houver transcrição, a versão recebe um aviso para revisá-la ou gerar a fala da nova mídia. Análises editoriais antigas e relações A/B não são reutilizadas como se ainda fossem válidas.

Templates, aliases e fila são guardados separadamente no navegador. Use **Exportar modelo**, **Baixar projeto JSON** e **Baixar fila / backup** para backup; o modelo pode ser importado em **Biblioteca** e a fila em **Restaurar fila**. Levar os JSONs para outro computador exige levar também as mídias locais.

Arquivos principais: `src/lib/templates.ts`, `src/features/templates/TemplatesPanel.tsx` e `tests/templates.test.ts`.
