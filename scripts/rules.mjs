export const SYNTAX = ['keyword', 'function', 'type', 'string', 'number', 'property', 'parameter', 'tag', 'attribute', 'regex', 'operator'];
export const READABLE = ['fg', ...SYNTAX, 'comment', 'punctuation'];
export const STATUS = ['error', 'warning', 'info', 'hint', 'added', 'modified', 'deleted', 'conflict'];

export const FG_RANGE = { dark: [10, 15], soft: [7, 10.5], light: [10, 15] };
export const LOUD_CAP = { dark: 0.9, soft: 0.94, light: 0.62 };
export const APCA_MIN = { fg: 70, syntax: 50, comment: 45 };

export const PAIRS = [
  ...[
    ['keyword', 'function'], ['keyword', 'type'], ['keyword', 'string'], ['keyword', 'number'],
    ['function', 'type'], ['function', 'string'], ['function', 'number'],
    ['type', 'string'], ['type', 'number'], ['string', 'number'],
    ['tag', 'attribute'], ['tag', 'keyword'], ['regex', 'string'], ['attribute', 'string'],
    ['error', 'warning'], ['warning', 'info'], ['error', 'hint'],
    ['added', 'deleted'], ['added', 'modified'], ['modified', 'deleted'],
  ].map(([a, b]) => ({ a, b, min: 0.07, minBy: { light: 0.06 } })),
  ...['keyword', 'function', 'type', 'string', 'number'].map((k) => ({ a: k, b: 'fg', min: 0.1, minBy: { soft: 0.08 } })),
  ...['tag', 'attribute', 'regex'].map((k) => ({ a: k, b: 'fg', min: 0.08 })),
  ...[['property', 'function'], ['parameter', 'property']].map(([a, b]) => ({ a, b, min: 0.05 })),
  ...[['property', 'fg'], ['parameter', 'fg'], ['operator', 'fg'], ['comment', 'fg'], ['punctuation', 'fg']].map(([a, b]) => ({ a, b, min: 0.045 })),
  { a: 'bgLine', b: 'bg', min: 0.02 },
];
