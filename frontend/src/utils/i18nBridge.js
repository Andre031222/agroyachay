const FALLBACKS = {
  'common.confirm': 'Confirmar · Confirm',
  'common.cancel': 'Cancelar · Cancel',
};

let translate = (key) => FALLBACKS[key] || key;

export const setTranslator = (fn) => {
  translate = fn;
};

export const translateKey = (key, params) => translate(key, params);
