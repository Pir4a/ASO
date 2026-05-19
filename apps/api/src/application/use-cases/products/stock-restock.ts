/** True when the product becomes purchasable again (was out, now has stock). */
export function isProductRestock(previousStock: number, nextStock: number): boolean {
  return previousStock <= 0 && nextStock > 0;
}
