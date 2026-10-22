# Checklist de validação da V6 no Windows

O ambiente de geração não concluiu `npm install`; as verificações a seguir **não** foram executadas aqui. Use este checklist antes de produzir trabalhos de clientes ou publicar os Reels.

- [ ] `npm install` sem erros e `npm run check` sem erros.
- [ ] `npm run build` conclui sem erros.
- [ ] Importação de vídeo MP4 H.264 com áudio audível na prévia.
- [ ] Importação de SRT com horários conferidos.
- [ ] Edição de uma legenda não altera as outras.
- [ ] Palavra `[BALEIA]` aparece sem colchetes e com cor destacada.
- [ ] Arraste de blocos e alças preserva posição e duração.
- [ ] Word timing: entrada de palavra coincide com áudio real.
- [ ] Fonte local, contorno e itálico aparecem no preview **e** no MP4.
- [ ] Quatro presets de referência mostram caixa neon, rabisco, manuscrito e elegante.
- [ ] Cortes de vídeo reproduzem sem glitches na junção.
- [ ] Keyframes alteram posição/zoom de acordo com o frame.
- [ ] Vídeo final MP4 abre no player local com áudio e textos sincronizados.
- [ ] Projetos JSON podem ser salvos e reabertos com mídia disponível.
- [ ] Teste de render em lote executado com duas composições pequenas.
- [ ] Integrações opcionais Whisper/faster-whisper/Ollama testadas quando instaladas.

## Problemas comuns

**MP4 não exporta:** confira a instalação NPM, a disponibilidade de FFmpeg e erros exibidos pelo editor. O navegador não codifica diretamente: o servidor Vite local inicia o Remotion CLI.

**O JSON abriu sem vídeo:** projetos JSON não incorporam bytes do arquivo; mantenha a pasta `public/media` junto do projeto.

**Fontes divergentes:** importe os arquivos originais e selecione as fontes no painel. A instalação de uma família no Windows não garante a mesma fonte no render.

**Whisper não inicia:** instale Python e `pip install -U openai-whisper` ou `pip install -U faster-whisper`, e confirme que o executável configurado em `REEL_PYTHON` está acessível.

**FaceDetector indisponível:** browser não disponibiliza essa API; ajuste manualmente pela timeline e keyframes.

**Corte de silêncio mexeu na sincronização:** recarregue o projeto anterior pelo JSON e compare os pontos editados; cortes automáticos exigem revisão de todos os trechos.
