/**
 * Calculates the discount and final amount based on cart total and offer details.
 * @param {Number} cartTotal - The total cart value before discount.
 * @param {String} discountType - 'Percentage' or 'Flat'.
 * @param {Number} discountValue - The value of the discount.
 * @returns {Object} - { discount, finalAmount }
 */
export const calculateDiscount = (cartTotal, discountType, discountValue) => {
  let discount = 0;

  if (discountType === 'Percentage') {
    discount = (cartTotal * discountValue) / 100;
  } else if (discountType === 'Flat') {
    discount = discountValue;
  }

  let finalAmount = cartTotal - discount;

  // Final amount must not be negative
  if (finalAmount < 0) {
    finalAmount = 0;
    discount = cartTotal; // Adjust discount so it doesn't exceed cart total
  }

  return { discount, finalAmount };
};
