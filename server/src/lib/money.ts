import { Decimal } from '@prisma/client/runtime/library';

export function moneyString(value: Decimal | string | number): string {
  return new Decimal(value).toFixed(2);
}

export function quantityString(value: Decimal | string | number): string {
  return new Decimal(value).toFixed(2);
}

export function roundHalfUp(value: Decimal, places = 2): Decimal {
  return value.toDecimalPlaces(places, Decimal.ROUND_HALF_UP);
}
