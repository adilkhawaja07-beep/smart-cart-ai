/**
 * Pricing Service - handles all pricing logic
 * Separation of business logic from UI
 */

interface PricingCalculation {
  subtotal: number;
  deliveryFee: number;
  tax: number;
  total: number;
}

const DELIVERY_THRESHOLD = 50; // Free delivery above $50
const BASE_DELIVERY_FEE = 4.99;
const TAX_RATE = 0.08; // 8%

export class PricingService {
  /**
   * Calculate delivery fee based on subtotal
   */
  static calculateDeliveryFee(subtotal: number): number {
    return subtotal >= DELIVERY_THRESHOLD ? 0 : BASE_DELIVERY_FEE;
  }

  /**
   * Calculate tax based on subtotal
   */
  static calculateTax(subtotal: number): number {
    return subtotal * TAX_RATE;
  }

  /**
   * Get free delivery threshold
   */
  static getFreeDeliveryThreshold(): number {
    return DELIVERY_THRESHOLD;
  }

  /**
   * Calculate complete pricing
   */
  static calculatePricing(subtotal: number): PricingCalculation {
    const deliveryFee = this.calculateDeliveryFee(subtotal);
    const tax = this.calculateTax(subtotal);
    const total = subtotal + deliveryFee + tax;

    return { subtotal, deliveryFee, tax, total };
  }

  /**
   * Get discount percentage
   */
  static getDiscountPercentage(
    originalPrice: number | undefined,
    currentPrice: number
  ): number {
    if (!originalPrice || originalPrice <= 0) return 0;
    return Math.round((1 - currentPrice / originalPrice) * 100);
  }

  /**
   * Calculate profit margin
   */
  static calculateMarginPercentage(costPrice: number, sellingPrice: number): number {
    if (costPrice <= 0) return 0;
    return ((sellingPrice - costPrice) / sellingPrice) * 100;
  }
}

export default PricingService;
