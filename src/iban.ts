const IBAN_LENGTHS: Record<string, number> = {
  AD: 24, AE: 23, AL: 28, AT: 20, AZ: 28, BA: 20, BE: 16, BG: 22,
  BH: 22, BR: 29, BY: 28, CH: 21, CR: 22, CY: 28, CZ: 24, DE: 22,
  DK: 18, DO: 28, EE: 20, EG: 29, ES: 24, FI: 18, FO: 18, FR: 27,
  GB: 22, GE: 22, GI: 23, GL: 18, GR: 27, GT: 28, HR: 21, HU: 28,
  IE: 22, IL: 23, IQ: 23, IS: 26, IT: 27, JO: 30, KW: 30, KZ: 20,
  LB: 28, LC: 32, LI: 21, LT: 20, LU: 20, LV: 21, LY: 25, MC: 27,
  MD: 24, ME: 22, MK: 19, MR: 27, MT: 31, MU: 30, NL: 18, NO: 15,
  PK: 24, PL: 28, PS: 29, PT: 25, QA: 29, RO: 24, RS: 22, SA: 24,
  SC: 31, SE: 24, SI: 19, SK: 24, SM: 27, ST: 25, SV: 28, TL: 23,
  TN: 24, TR: 26, UA: 29, VA: 22, VG: 24, XK: 20,
};

const COUNTRY_NAMES: Record<string, string> = {
  ES: 'España', DE: 'Alemania', FR: 'Francia', IT: 'Italia', PT: 'Portugal',
  GB: 'Reino Unido', NL: 'Países Bajos', BE: 'Bélgica', IE: 'Irlanda', AD: 'Andorra',
};

export const compactIban = (value: string) => value.replace(/[\s-]+/g, '').toUpperCase();

export const knownIbanCountry = (value: string) => {
  const compact = compactIban(value);
  return compact.length >= 2 && Boolean(IBAN_LENGTHS[compact.slice(0, 2)]);
};

const checksumOk = (compact: string) => {
  const rearranged = compact.slice(4) + compact.slice(0, 4);
  let digits = '';
  for (const character of rearranged) {
    digits += character >= '0' && character <= '9' ? character : String(character.charCodeAt(0) - 55);
  }
  let rest = 0;
  for (const character of digits) rest = (rest * 10 + Number(character)) % 97;
  return rest === 1;
};

export const ibanProblem = (value: string): string => {
  const compact = compactIban(value);
  if (!compact) return 'Escribe el IBAN.';
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(compact)) return 'El IBAN solo lleva letras y números.';
  const expected = IBAN_LENGTHS[compact.slice(0, 2)];
  if (!expected) return 'No reconocemos el país de ese IBAN.';
  if (compact.length !== expected) {
    const country = COUNTRY_NAMES[compact.slice(0, 2)] || compact.slice(0, 2);
    const diff = expected - compact.length;
    if (diff > 0) return `El IBAN de ${country} tiene ${expected} caracteres. Faltan ${diff}.`;
    return `El IBAN de ${country} tiene ${expected} caracteres. Sobran ${-diff}.`;
  }
  if (!checksumOk(compact)) {
    return 'Los dos números de control, justo después de las letras del país, no cuadran con el resto. Cópialo tal cual del banco.';
  }
  return '';
};
