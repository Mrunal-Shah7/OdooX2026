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

export function formatWorkedHours(decimalStrOrNum: string | number): string {
  const val = typeof decimalStrOrNum === 'number' ? decimalStrOrNum : parseFloat(decimalStrOrNum);
  if (isNaN(val) || val <= 0) return '0h';
  const totalMinutes = Math.round(val * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (minutes === 0) return `${hours}h`;
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}

export function formatDateTimeInput(isoStr: string | null | undefined): string {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return isoStr;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return `${day}/${month}/${year}; ${hours}:${minutes}:${seconds}`;
}

export function parseDateTimeInput(str: string | null | undefined): string | null {
  if (!str || !str.trim()) return null;
  const s = str.trim();
  const match = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})[;\s]+(\d{1,2}):(\d{1,2}):?(\d{1,2})?$/);
  if (match) {
    const [, day, month, year, hours, minutes, seconds = '00'] = match;
    const iso = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}.000Z`;
    return new Date(iso).toISOString();
  }
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d.toISOString();
}
