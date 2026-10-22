const USD_TO_RWF_RATE = 1450;

function formatRwfFromUsd(amount) {
  const rwfAmount = Math.round(amount * USD_TO_RWF_RATE);
  return `${new Intl.NumberFormat('en-RW', { maximumFractionDigits: 0 }).format(rwfAmount)} RWF`;
}

module.exports = { formatRwfFromUsd };
