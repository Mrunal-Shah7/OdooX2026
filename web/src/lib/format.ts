const moneyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const usdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat('en-IN', {
  year: 'numeric',
  month: 'short',
  day: '2-digit',
});

const dateLongFormatter = new Intl.DateTimeFormat('en-IN', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

export function formatMoney(amount: string, currency: 'INR' | 'USD' = 'INR'): string {
  const value = Number.parseFloat(amount);
  if (Number.isNaN(value)) return amount;
  return currency === 'USD' ? usdFormatter.format(value) : moneyFormatter.format(value);
}

export function formatDate(date: string): string {
  return dateFormatter.format(new Date(`${date}T12:00:00`));
}

export function formatDateLong(date: string): string {
  return dateLongFormatter.format(new Date(`${date}T12:00:00`));
}

export function formatNumber(value: string | number, fractionDigits = 2): string {
  const num = typeof value === 'number' ? value : Number.parseFloat(value);
  if (Number.isNaN(num)) return String(value);
  return num.toLocaleString('en-IN', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}
