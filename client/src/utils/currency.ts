export const USD_TO_RWF_RATE = 1450;

const rwfFormatter = new Intl.NumberFormat('en-RW', {
  maximumFractionDigits: 0
});

export const usdToRwf = (amount: number): number =>
  Math.round(amount * USD_TO_RWF_RATE);

export const rwfToUsd = (amount: number): number =>
  amount / USD_TO_RWF_RATE;

export const formatRwfFromUsd = (amount: number): string =>
  `${rwfFormatter.format(usdToRwf(amount))} RWF`;
