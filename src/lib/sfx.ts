export const SFX_OPTIONS = [
  {file: 'whoosh-fast.wav', label: 'Whoosh rápido'}, {file: 'whoosh-cinematic.wav', label: 'Whoosh cinematográfico'},
  {file: 'impact-boom.wav', label: 'Impacto / boom'}, {file: 'pop-clean.wav', label: 'Pop limpo'},
  {file: 'camera-click.wav', label: 'Clique de câmera'}, {file: 'vinyl-scratch.wav', label: 'Vinil / scratch'},
  {file: 'coin-ding.wav', label: 'Moeda / ding'}, {file: 'riser-speed.wav', label: 'Riser de velocidade'},
  {file: 'cash-register.wav', label: 'Caixa registradora / ka-ching'}, {file: 'sale-cha-ching.wav', label: 'Venda concluída / cha-ching'},
  {file: 'profit-up.wav', label: 'Lucro subindo'}, {file: 'cash-counting.wav', label: 'Contagem de dinheiro'},
  {file: 'coin-rain.wav', label: 'Chuva de moedas'}, {file: 'bell-notification.wav', label: 'Sininho de notificação'},
  {file: 'glitch-digital.wav', label: 'Glitch digital'}, {file: 'popup-bubble.wav', label: 'Pop-up / bolha'},
  {file: 'error-buzzer.wav', label: 'Erro / buzzer'}, {file: 'counter-tick.wav', label: 'Incremento de número'},
  {file: 'counter-finish.wav', label: 'Número concluído'}, {file: 'success-chime.wav', label: 'Sucesso / confirmação'},
  {file: 'ui-click.wav', label: 'Clique de interface'}, {file: 'transition-swipe.wav', label: 'Transição / swipe'}
] as const;

export const builtInSfxFile = (src?: string) => src?.match(/^\/sfx\/([a-z0-9-]+\.wav)$/i)?.[1] ?? null;
