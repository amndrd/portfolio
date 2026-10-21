// Portfolio entries, one per grid cell (same order as GRID in pictos.js).
// Placeholder content: the titles are the planned projects; numbers, texts and links will be replaced.
// view: ASCII design shown on the panel screen ('tower', 'network' or 'torus').

const ENTRY_DEFAULTS = {
  language: 'PYTHON', year: '2026', type: 'PROJECT', duration: 'TBD',
  composition: [['PYTHON', 100]],
  stack: ['TBD'], listTitle: 'STATUS', list: ['PLANNED'],
  description: ['Description coming soon.'],
  view: 'torus', viewLabel: ['PREVIEW', 'DRAG TO ORBIT'],
  log: ['Loading project data ... OK'],
  media: { images: 0, videos: 0, files: 0 },
  github: '',
};

const ENTRIES = [
  {
    title: 'GPT-2 FROM SCRATCH', type: 'DEEP LEARNING', duration: '6 WEEKS',
    composition: [['PYTHON', 91], ['JUPYTER', 7], ['SHELL', 2]],
    stack: ['PYTORCH', 'NUMPY', 'MATPLOTLIB'],
    listTitle: 'MODEL', list: ['124M PARAMETERS', '12 LAYERS x 12 HEADS', '50 257 TOKEN VOCAB'],
    description: ['GPT-2 (124M) rebuilt from scratch in PyTorch:', 'tokenizer, transformer and training loop,', 'trained until it matches the original results.'],
    view: 'tower', viewLabel: ['MODEL', '12 LAYERS x 12 HEADS, DRAG TO ORBIT'],
    log: ['Loading tokenizer ... BPE, 50 257 tokens', 'Building transformer: 12 layers x 12 heads', 'Restoring checkpoint: step 19073', 'Validation loss: 3.07   target: 3.28   OK'],
    media: { images: 14, videos: 3, files: 12 },
  },
  { title: 'NEURAL NET FROM SCRATCH', type: 'DEEP LEARNING', stack: ['NUMPY'], view: 'network', viewLabel: ['NETWORK', '4 LAYERS, DRAG TO ORBIT'] },
  { title: 'AI JOB APP', type: 'FULL-STACK + AI', language: 'TYPESCRIPT', composition: [['TYPESCRIPT', 100]] },
  { title: 'PRODUCTION ML', type: 'MLOPS' },
  { title: 'FILE STORAGE APP', type: 'FULL-STACK', language: 'TYPESCRIPT', composition: [['TYPESCRIPT', 100]], stack: ['NEXT.JS 15'] },
  { title: 'DIFFUSION MODEL', type: 'GENERATIVE AI', view: 'network', viewLabel: ['NETWORK', 'DRAG TO ORBIT'] },
  { title: 'SOCIAL NETWORK APP', type: 'FULL-STACK', language: 'TYPESCRIPT', composition: [['TYPESCRIPT', 100]] },
  { title: 'FINE-TUNED LLM', type: 'LLM', view: 'tower', viewLabel: ['MODEL', 'DRAG TO ORBIT'] },
  { title: 'GPT FROM SCRATCH', type: 'DEEP LEARNING', view: 'tower', viewLabel: ['MODEL', 'DRAG TO ORBIT'] },
  { title: 'AI MINESWEEPER SOLVER', type: 'GAME AI' },
  ...Array.from({ length: 5 }, () => ({ title: 'EMPTY SLOT', type: 'COMING SOON', viewLabel: ['PREVIEW', 'COMING SOON'], list: ['NOTHING HERE YET'] })),
].map(e => ({ ...ENTRY_DEFAULTS, ...e }));
