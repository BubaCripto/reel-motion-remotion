/**
 * Source of truth for scenes that can be rendered in the editor. The same
 * compact list is given to Gemini, so it can only request supported motions.
 */
export const MOTION_SCENE_CATALOG = [
  {id: 'growth-graph', label: 'Gráfico de crescimento', use: 'resultados, vendas, crescimento e métricas'},
  {id: 'target-lock', label: 'Mira de foco', use: 'atenção em um ponto, produto ou rosto'},
  {id: 'rocket-launch', label: 'Foguete CTA', use: 'encerramento e chamada para ação'},
  {id: 'stamp-impact', label: 'Carimbo de impacto', use: 'alerta, erro ou afirmação forte'},
  {id: 'hazard-warning', label: 'Alerta', use: 'riscos e proibições'},
  {id: 'hourglass', label: 'Ampulheta', use: 'tempo, espera e urgência'},
  {id: 'speed-gauge', label: 'Velocímetro', use: 'velocidade e aceleração'},
  {id: 'neural-brain', label: 'Rede neural', use: 'ideias, estratégia e insight'},
  {id: 'social-cta', label: 'CTA social', use: 'seguir, curtir, comentar, salvar ou enviar'},
  {id: 'social-comment', label: 'Comentário / DM', use: 'prova social, pergunta ou conversa'},
  {id: 'metric-counter', label: 'Contador numérico', use: 'percentual, número, preço ou meta'},
  {id: 'comparison', label: 'Comparação X vs Y', use: 'antes/depois, erro/acerto e alternativas'},
  {id: 'checklist', label: 'Checklist', use: 'passos, benefícios e itens de uma lista'},
  {id: 'progress-bar', label: 'Progresso', use: 'etapas, avanço e resultado em andamento'},
  {id: 'focus-spotlight', label: 'Foco / lupa', use: 'destacar uma informação ou área importante'},
  {id: 'calendar-clock', label: 'Calendário / relógio', use: 'prazo, data, rotina e urgência'}
  ,{id: 'social-notification', label: 'Notificação social', use: 'nova curtida, seguidor ou mensagem'},
  {id: 'social-profile', label: 'Perfil social', use: 'apresentar criador, marca ou prova social'},
  {id: 'search-bar', label: 'Busca animada', use: 'mostrar o que pesquisar ou uma palavra-chave'},
  {id: 'cursor-click', label: 'Cursor e clique', use: 'demonstrar clique, botão ou instrução na tela'},
  {id: 'glitch-rgb', label: 'Glitch RGB', use: 'quebra de padrão e impacto visual curto'},
  {id: 'impact-flash', label: 'Flash de impacto', use: 'transição, revelação ou palavra forte'},
  {id: 'crt-vhs', label: 'CRT / VHS', use: 'estética retrô e mudança de capítulo'},
  {id: 'confetti', label: 'Confete', use: 'vitória, conquista e celebração'}
  ,{id: 'bar-chart', label: 'Gráfico de barras', use: 'comparar resultados, números e desempenho'},
  {id: 'conversion-funnel', label: 'Funil de conversão', use: 'mostrar etapas de vendas, aquisição ou processo'},
  {id: 'ranking-podium', label: 'Ranking / pódio', use: 'posição, prioridade e melhores opções'},
  {id: 'timeline-steps', label: 'Linha do tempo', use: 'explicar uma sequência, plano ou evolução'},
  {id: 'radar-scan', label: 'Radar e mapa', use: 'localização, monitoramento e oportunidade'},
  {id: 'domino-effect', label: 'Efeito dominó', use: 'consequência em cadeia e processo'},
  {id: 'traffic-light', label: 'Semáforo', use: 'sinalizar parar, atenção ou avançar'},
  {id: 'balance-scale', label: 'Balança', use: 'trade-off, escolha e equilíbrio'}
] as const;

export type MotionSceneId = typeof MOTION_SCENE_CATALOG[number]['id'];

export const motionSceneIds = MOTION_SCENE_CATALOG.map(item => item.id);

export const MOTION_CATALOG_FOR_AI = MOTION_SCENE_CATALOG
  .map(item => `- ${item.id}: ${item.use}`)
  .join('\n');

export const isMotionSceneId = (value: unknown): value is MotionSceneId =>
  typeof value === 'string' && motionSceneIds.includes(value as MotionSceneId);
