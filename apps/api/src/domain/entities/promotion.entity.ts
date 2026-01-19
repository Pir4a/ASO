export type PromotionType = 'percentage' | 'fixed' | 'buy_x_get_y';

export class Promotion {
    id: string;
    code: string;
    type: PromotionType;
    value: number; // percentage (0-100) or fixed amount in cents
    minOrderAmount?: number; // in cents
    maxUsages?: number;
    currentUsages: number;
    validFrom: Date;
    validUntil: Date;
    isActive: boolean;

    constructor(partial: Partial<Promotion>) {
        Object.assign(this, partial);
        this.currentUsages = this.currentUsages ?? 0;
        this.isActive = this.isActive ?? true;
    }

    isValid(): boolean {
        const now = new Date();
        return (
            this.isActive &&
            now >= this.validFrom &&
            now <= this.validUntil &&
            (!this.maxUsages || this.currentUsages < this.maxUsages)
        );
    }

    calculateDiscount(orderTotal: number): number {
        if (!this.isValid()) return 0;
        if (this.minOrderAmount && orderTotal < this.minOrderAmount) return 0;

        switch (this.type) {
            case 'percentage':
                return Math.round(orderTotal * (this.value / 100));
            case 'fixed':
                return Math.min(this.value, orderTotal);
            default:
                return 0;
        }
    }
}
