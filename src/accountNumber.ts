import { compactIban, ibanProblem, knownIbanCountry } from './iban';

export type AccountCountryChoice = 'ES' | 'AR' | 'OTHER';

export type AccountReview = {
  problem: string;
  checked: boolean;
  compact: string;
  country: string;
  currency: string;
};

const CBU_BANK = [7, 1, 3, 9, 7, 1, 3];
const CBU_ACCOUNT = [3, 9, 7, 1, 3, 9, 7, 1, 3, 9, 7, 1, 3];

const cbuDigit = (number: string, weights: number[]) => {
  const total = [...number].reduce((sum, digit, index) => sum + Number(digit) * weights[index], 0);
  return (10 - (total % 10)) % 10;
};

export const cbuOk = (value: string) => {
  const compact = compactIban(value);
  if (!/^\d{22}$/.test(compact)) return false;
  return cbuDigit(compact.slice(0, 7), CBU_BANK) === Number(compact[7])
    && cbuDigit(compact.slice(8, 21), CBU_ACCOUNT) === Number(compact[21]);
};

const currencyFor = (code: string, current: string) => {
  if (code === 'AR') return 'ARS';
  if (code === 'GB') return 'GBP';
  if (code === 'CH') return 'CHF';
  if (['ES', 'DE', 'FR', 'IT', 'PT', 'NL', 'BE', 'IE', 'AT', 'AD'].includes(code)) return 'EUR';
  return current || 'EUR';
};

export const accountProblem = (choice: AccountCountryChoice, value: string): string => {
  const compact = compactIban(value);
  if (choice === 'ES') {
    const problem = ibanProblem(value);
    if (problem) return problem;
    if (!compact.startsWith('ES')) return 'Para una cuenta de España, el IBAN tiene que empezar por ES.';
    return '';
  }
  if (choice === 'AR') {
    if (!compact) return 'Escribe el CBU o CVU.';
    if (!/^\d+$/.test(compact)) return 'El CBU o CVU solo lleva números.';
    if (compact.length !== 22) {
      const diff = 22 - compact.length;
      if (diff > 0) return `El CBU o CVU de Argentina tiene 22 números. Faltan ${diff}.`;
      return `El CBU o CVU de Argentina tiene 22 números. Sobran ${-diff}.`;
    }
    if (!cbuOk(compact)) return 'El CBU o CVU no cuadra. Revisa un número.';
    return '';
  }
  if (!compact) return 'Escribe el número de cuenta.';
  if (compact.length > 34) return 'El número de cuenta es demasiado largo.';
  if (knownIbanCountry(compact)) return ibanProblem(value);
  if (cbuOk(compact)) return '';
  if (!/^[A-Z0-9]+$/.test(compact)) return 'El número de cuenta solo lleva letras y números.';
  if (compact.length < 4) return 'El número de cuenta es demasiado corto.';
  return '';
};

export const reviewAccount = (choice: AccountCountryChoice, value: string, currentCurrency = 'EUR'): AccountReview => {
  const compact = compactIban(value);
  const problem = accountProblem(choice, value);
  if (choice === 'ES') {
    return { problem, checked: !problem, compact, country: 'ES', currency: 'EUR' };
  }
  if (choice === 'AR') {
    return { problem, checked: !problem, compact, country: 'AR', currency: 'ARS' };
  }
  if (problem) return { problem, checked: false, compact, country: 'XX', currency: currentCurrency || 'EUR' };
  if (knownIbanCountry(compact)) {
    const code = compact.slice(0, 2);
    return { problem: '', checked: true, compact, country: code, currency: currencyFor(code, currentCurrency) };
  }
  if (cbuOk(compact)) return { problem: '', checked: true, compact, country: 'AR', currency: 'ARS' };
  return { problem: '', checked: false, compact, country: 'XX', currency: currentCurrency || 'EUR' };
};
