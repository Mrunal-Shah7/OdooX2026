import { Decimal } from '@prisma/client/runtime/library';

export { Decimal };

export function toDecimal(value: Decimal | string | number): Decimal {
  if (value instanceof Decimal) return value;
  return new Decimal(value);
}

export function moneyString(value: Decimal | string | number): string {
  return roundHalfUp(toDecimal(value), 2).toFixed(2);
}

export function quantityString(value: Decimal | string | number, places = 2): string {
  return roundHalfUp(toDecimal(value), places).toFixed(places);
}

export function roundHalfUp(value: Decimal | string | number, places = 2): Decimal {
  const dec = toDecimal(value);
  return dec.toDecimalPlaces(places, Decimal.ROUND_HALF_UP);
}

export function addMoney(a: Decimal | string | number, b: Decimal | string | number): Decimal {
  return toDecimal(a).add(toDecimal(b));
}

export function subtractMoney(a: Decimal | string | number, b: Decimal | string | number): Decimal {
  return toDecimal(a).sub(toDecimal(b));
}

export function multiplyMoney(a: Decimal | string | number, b: Decimal | string | number): Decimal {
  return toDecimal(a).mul(toDecimal(b));
}

export function divideMoney(a: Decimal | string | number, b: Decimal | string | number): Decimal {
  const divisor = toDecimal(b);
  if (divisor.isZero()) {
    return new Decimal(0);
  }
  return toDecimal(a).div(divisor);
}
