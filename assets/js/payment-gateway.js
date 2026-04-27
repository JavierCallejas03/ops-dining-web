/**
 * Ops Dining — Payment Gateway Abstraction Layer
 * ================================================
 * Provider-agnostic. Change provider = change 1 config line.
 * Card data NEVER touches our server — provider iframe handles it.
 */

const GATEWAY_CONFIG = {
    // ──── CHANGE PROVIDER HERE ────
    provider: 'stripe',

    // Set false ONLY when you have added your Stripe Publishable Key below
    demoMode: true,

    stripe: {
        // Replace with your Stripe publishable key (pk_live_... or pk_test_...)
        publishableKey: 'pk_live_51TQs4KR7FprGmFRA4SoA0CodGoSG2PIpkvkFsm3HaNrnD1zN6DElp5KmL3u3ncoTFE01bxGOIIrf95NHu52kzM3400TGX3LIvP',
        // n8n webhook URL that creates PaymentIntent server-side
        paymentEndpoint: 'https://n8n.opsdining.com/webhook/create-payment-intent',
    },

    paypal: {
        clientId: '',
    },

    transfer: {
        iban: 'ES00 0000 0000 00 0000000000',
        beneficiary: 'OPS DINING',
        bank: 'Tu Banco',
        concept: 'Servicio Ops Dining',
    },

    // Webhook to receive order data (n8n)
    orderWebhook: 'https://n8n.opsdining.com/webhook/order-success',
};

/* ──────────────────────────────────────────────
   PLANS CONFIGURATION
   ────────────────────────────────────────────── */
const PLANS = {
    basico: {
        id: 'basico',
        name: 'Recepcionista Virtual 24/7',
        subtitle: 'Soporte 24/7 y Reservas',
        price: 1000,
        features: [
            'Captación de reservas web y RRSS',
            'Atención fuera de horario comercial',
            'Soporte por email',
        ],
    },
    core: {
        id: 'core',
        name: 'Guardián de Reservas',
        subtitle: 'Automatización y No-Shows',
        price: 2000,
        features: [
            'Todo del Plan Básico',
            'Confirmaciones automáticas',
            'Reducción de No-Shows',
            'Soporte prioritario',
        ],
    },
    high: {
        id: 'high',
        name: 'Escudo Telefónico',
        subtitle: 'Gestión Integral de Llamadas',
        price: 3000,
        features: [
            'Todo del Plan Core',
            'Atención de voz en hora punta',
            'Gestión integral de llamadas',
            'Soporte 24/7 dedicado',
        ],
    },
};

// Discounts — prepared for future use
const DISCOUNTS = {
    // Uncomment and configure when ready:
    // bundle_basico_core: { percent: 10, code: 'PACK10', label: 'Pack Operativo' },
    // bundle_core_high: { percent: 15, code: 'PACK15', label: 'Pack Premium' },
};

const IVA_RATE = 0.21;

/* ──────────────────────────────────────────────
   PAYMENT ADAPTER INTERFACE
   ────────────────────────────────────────────── */

class PaymentAdapter {
    constructor(config) {
        this.config = config;
    }
    async initialize() {
        throw new Error('initialize() must be implemented');
    }
    async processPayment(amount, currency, metadata) {
        throw new Error('processPayment() must be implemented');
    }
    mountPaymentElement(containerId) {
        throw new Error('mountPaymentElement() must be implemented');
    }
    destroy() {}
}

/* ──────────────────────────────────────────────
   STRIPE ADAPTER
   ────────────────────────────────────────────── */

class StripeAdapter extends PaymentAdapter {
    constructor(config) {
        super(config);
        this.stripe = null;
        this.elements = null;
        this.cardElement = null;
    }

    async initialize() {
        if (!this.config.publishableKey) {
            console.warn('[PaymentGateway] Stripe key not configured — demo mode active');
            return false;
        }
        try {
            this.stripe = Stripe(this.config.publishableKey);
            this.elements = this.stripe.elements({
                locale: 'es',
                fonts: [{ cssSrc: 'https://fonts.googleapis.com/css2?family=Outfit:wght@400;500&display=swap' }],
            });
            return true;
        } catch (err) {
            console.error('[PaymentGateway] Stripe init failed:', err);
            return false;
        }
    }

    mountPaymentElement(containerId) {
        if (!this.elements) return false;
        const container = document.getElementById(containerId);
        if (!container) return false;

        this.cardElement = this.elements.create('card', {
            style: {
                base: {
                    color: '#f5f5f7',
                    fontFamily: 'Outfit, sans-serif',
                    fontSize: '16px',
                    fontWeight: '400',
                    '::placeholder': { color: 'rgba(255,255,255,0.3)' },
                },
                invalid: { color: '#ef4444' },
            },
            hidePostalCode: true,
        });
        this.cardElement.mount('#' + containerId);
        return true;
    }

    async processPayment(amount, currency, metadata) {
        if (!this.stripe || !this.config.paymentEndpoint) {
            throw new Error('Stripe not configured. Set publishableKey and paymentEndpoint.');
        }

        // 1. Call n8n webhook to create PaymentIntent
        const response = await fetch(this.config.paymentEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: Math.round(amount * 100), currency, metadata }),
        });

        if (!response.ok) throw new Error('Error creating payment intent');
        const { clientSecret } = await response.json();

        // 2. Confirm payment with Stripe
        const result = await this.stripe.confirmCardPayment(clientSecret, {
            payment_method: { card: this.cardElement },
        });

        if (result.error) throw new Error(result.error.message);
        return { success: true, id: result.paymentIntent.id, status: result.paymentIntent.status };
    }

    destroy() {
        if (this.cardElement) this.cardElement.destroy();
    }
}

/* ──────────────────────────────────────────────
   DEMO ADAPTER (simulates payment flow)
   ────────────────────────────────────────────── */

class DemoAdapter extends PaymentAdapter {
    async initialize() {
        return true;
    }

    mountPaymentElement() {
        return true; // Demo uses regular HTML inputs
    }

    async processPayment(amount, currency, metadata) {
        // Simulate processing delay
        await new Promise((resolve) => setTimeout(resolve, 2500));
        return {
            success: true,
            id: 'demo_' + Date.now(),
            status: 'succeeded',
            demo: true,
        };
    }
}

/* ──────────────────────────────────────────────
   GATEWAY FACTORY
   ────────────────────────────────────────────── */

const PaymentGateway = {
    _adapter: null,

    async create() {
        const cfg = GATEWAY_CONFIG;

        if (cfg.demoMode) {
            this._adapter = new DemoAdapter(cfg);
        } else {
            switch (cfg.provider) {
                case 'stripe':
                    this._adapter = new StripeAdapter(cfg.stripe);
                    break;
                // Future providers:
                // case 'paypal': this._adapter = new PayPalAdapter(cfg.paypal); break;
                // case 'redsys': this._adapter = new RedsysAdapter(cfg.redsys); break;
                default:
                    console.warn('[PaymentGateway] Unknown provider, falling back to demo');
                    this._adapter = new DemoAdapter(cfg);
            }
        }

        const initialized = await this._adapter.initialize();
        if (!initialized && !cfg.demoMode) {
            console.warn('[PaymentGateway] Provider init failed, falling back to demo');
            this._adapter = new DemoAdapter(cfg);
            await this._adapter.initialize();
        }

        return this._adapter;
    },

    getAdapter() {
        return this._adapter;
    },

    isDemoMode() {
        return GATEWAY_CONFIG.demoMode || this._adapter instanceof DemoAdapter;
    },
};

/* ──────────────────────────────────────────────
   UTILITY: Generate unique reference
   ────────────────────────────────────────────── */

function generateReference() {
    const year = new Date().getFullYear();
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return `OD-${year}-${code}`;
}

/* ──────────────────────────────────────────────
   UTILITY: Price calculations
   ────────────────────────────────────────────── */

function calculatePricing(plan, discountCode) {
    const planData = PLANS[plan];
    if (!planData) return null;

    let subtotal = planData.price;
    let discountAmount = 0;
    let discountLabel = '';

    // Check discount code (future use)
    if (discountCode) {
        const discount = Object.values(DISCOUNTS).find((d) => d.code === discountCode);
        if (discount) {
            discountAmount = subtotal * (discount.percent / 100);
            discountLabel = discount.label;
        }
    }

    const baseAfterDiscount = subtotal - discountAmount;
    const iva = baseAfterDiscount * IVA_RATE;
    const total = baseAfterDiscount + iva;

    return {
        plan: planData,
        subtotal,
        discountAmount,
        discountLabel,
        baseAfterDiscount,
        iva,
        total,
        formatted: {
            subtotal: formatEUR(subtotal),
            discount: formatEUR(discountAmount),
            base: formatEUR(baseAfterDiscount),
            iva: formatEUR(iva),
            total: formatEUR(total),
        },
    };
}

function formatEUR(amount) {
    return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR',
    }).format(amount);
}

/* ──────────────────────────────────────────────
   UTILITY: Send order to webhook
   ────────────────────────────────────────────── */

async function sendOrderToWebhook(orderData) {
    const endpoint = GATEWAY_CONFIG.orderWebhook;
    if (!endpoint) {
        console.warn('[PaymentGateway] No orderWebhook configured');
        return { success: true, demo: true };
    }

    try {
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData),
        });
        return { success: res.ok };
    } catch (err) {
        console.error('[PaymentGateway] Webhook error:', err);
        return { success: false, error: err.message };
    }
}
