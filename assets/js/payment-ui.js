/**
 * Ops Dining — Payment UI Controller
 * ====================================
 * Handles checkout page interactions, validation, and flow.
 */

(function () {
    'use strict';

    /* ── STATE ── */
    let currentPlan = null;
    let pricing = null;
    let selectedMethod = 'card';
    let gateway = null;
    let reference = '';
    let isProcessing = false;

    /* ── DOM REFS ── */
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    /* ── INIT ── */
    document.addEventListener('DOMContentLoaded', async () => {
        // 1. Read plan from URL
        const params = new URLSearchParams(window.location.search);
        const planId = params.get('plan');
        const discount = params.get('discount') || null;

        if (!planId || !PLANS[planId]) {
            showError();
            return;
        }

        // 2. Calculate pricing
        currentPlan = planId;
        pricing = calculatePricing(planId, discount);
        reference = generateReference();

        // 3. Render page
        renderOrderSummary();
        renderPlanBadge();
        showCheckout();

        // 4. Initialize payment gateway
        gateway = await PaymentGateway.create();

        // If Stripe is live, mount card element
        if (!PaymentGateway.isDemoMode()) {
            gateway.mountPaymentElement('stripe-card-element');
            $('#demo-card-inputs').classList.add('hidden');
            $('#stripe-card-element').classList.remove('hidden');
        }

        // 5. Setup event listeners
        setupMethodTabs();
        setupFormValidation();
        setupPayButton();
        setupCardFormatting();

        // 6. Transfer reference
        $('#transfer-ref').textContent = reference;
    });

    /* ── RENDER ── */

    function showError() {
        $('#error-page').classList.remove('hidden');
        $('#checkout-content').classList.add('hidden');
    }

    function showCheckout() {
        $('#error-page').classList.add('hidden');
        $('#checkout-content').classList.remove('hidden');
    }

    function renderOrderSummary() {
        if (!pricing) return;
        const p = pricing;

        $('#summary-plan-name').textContent = p.plan.name;
        $('#summary-plan-subtitle').textContent = p.plan.subtitle;

        // Features
        const featList = $('#summary-features');
        featList.innerHTML = '';
        p.plan.features.forEach((f) => {
            const li = document.createElement('li');
            li.className = 'flex items-start gap-3 text-sm text-white/70';
            li.innerHTML = `<svg class="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg><span>${f}</span>`;
            featList.appendChild(li);
        });

        // Prices
        $('#summary-subtotal').textContent = p.formatted.subtotal;
        $('#summary-iva').textContent = p.formatted.iva;
        $('#summary-total').textContent = p.formatted.total;

        // Discount row
        if (p.discountAmount > 0) {
            $('#summary-discount-row').classList.remove('hidden');
            $('#summary-discount-label').textContent = p.discountLabel;
            $('#summary-discount-amount').textContent = '-' + p.formatted.discount;
        }

        // Pay button text
        $('#pay-btn-amount').textContent = p.formatted.total;
    }

    function renderPlanBadge() {
        const badge = $('#plan-badge');
        const colors = {
            basico: 'from-slate-500 to-slate-600',
            core: 'from-amber-600 to-yellow-500',
            high: 'from-purple-600 to-pink-500',
        };
        badge.className = `inline-block px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.25em] bg-gradient-to-r ${colors[currentPlan] || colors.core} text-white`;
    }

    /* ── METHOD TABS ── */

    function setupMethodTabs() {
        $$('[data-method]').forEach((tab) => {
            tab.addEventListener('click', () => {
                const method = tab.dataset.method;
                selectedMethod = method;

                // Update active tab styles (inline to avoid Tailwind CDN issue)
                $$('[data-method]').forEach((t) => {
                    t.style.borderColor = 'transparent';
                    t.style.color = 'rgba(255,255,255,0.4)';
                    t.style.backgroundColor = 'transparent';
                });
                tab.style.borderColor = '#c5a059';
                tab.style.color = '#ffffff';
                tab.style.backgroundColor = 'rgba(255,255,255,0.05)';

                // Show corresponding content
                $$('.method-content').forEach((c) => c.classList.add('hidden'));
                $(`#method-${method}`).classList.remove('hidden');

                // Update pay button text
                updatePayButton();
            });
        });
    }

    function updatePayButton() {
        const btn = $('#pay-btn');
        const amountText = pricing.formatted.total;

        if (selectedMethod === 'transfer') {
            btn.querySelector('span').textContent = `Confirmar Pedido — ${amountText}`;
        } else if (selectedMethod === 'paypal') {
            btn.querySelector('span').textContent = `Pagar con PayPal — ${amountText}`;
        } else {
            btn.querySelector('span').textContent = `Pagar ${amountText}`;
        }
    }

    /* ── CARD INPUT FORMATTING ── */

    function setupCardFormatting() {
        const cardNum = $('#card-number');
        const cardExp = $('#card-expiry');
        const cardCvc = $('#card-cvc');

        if (cardNum) {
            cardNum.addEventListener('input', (e) => {
                let v = e.target.value.replace(/\D/g, '').slice(0, 16);
                e.target.value = v.replace(/(\d{4})(?=\d)/g, '$1 ');
            });
        }

        if (cardExp) {
            cardExp.addEventListener('input', (e) => {
                let v = e.target.value.replace(/\D/g, '').slice(0, 4);
                if (v.length > 2) v = v.slice(0, 2) + ' / ' + v.slice(2);
                e.target.value = v;
            });
        }

        if (cardCvc) {
            cardCvc.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4);
            });
        }
    }

    /* ── FORM VALIDATION ── */

    function setupFormValidation() {
        // Real-time validation on blur
        $$('#checkout-form input[required]').forEach((input) => {
            input.addEventListener('blur', () => validateField(input));
            input.addEventListener('input', () => {
                if (input.classList.contains('border-red-500')) validateField(input);
            });
        });
    }

    function validateField(input) {
        const value = input.value.trim();
        let valid = true;
        let msg = '';

        if (!value) {
            valid = false;
            msg = 'Campo obligatorio';
        } else if (input.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            valid = false;
            msg = 'Email no válido';
        } else if (input.name === 'cif' && !/^[A-Za-z]\d{7}[A-Za-z0-9]$/.test(value)) {
            valid = false;
            msg = 'Formato CIF no válido (ej: B12345678)';
        }

        const errEl = input.parentElement.querySelector('.field-error');
        if (!valid) {
            input.style.borderColor = 'rgba(239,68,68,0.5)';
            if (errEl) {
                errEl.textContent = msg;
                errEl.classList.remove('hidden');
            }
        } else {
            input.style.borderColor = 'rgba(255,255,255,0.1)';
            if (errEl) errEl.classList.add('hidden');
        }

        return valid;
    }

    function validateForm() {
        let valid = true;
        $$('#checkout-form input[required]').forEach((input) => {
            if (!validateField(input)) valid = false;
        });

        // Terms checkbox
        const terms = $('#terms-check');
        if (terms && !terms.checked) {
            valid = false;
            $('#terms-error').classList.remove('hidden');
        } else {
            $('#terms-error').classList.add('hidden');
        }

        // Card fields (demo mode)
        if (selectedMethod === 'card' && PaymentGateway.isDemoMode()) {
            ['#card-number', '#card-expiry', '#card-cvc'].forEach((sel) => {
                const el = $(sel);
                if (el && !el.value.trim()) {
                    el.style.borderColor = 'rgba(239,68,68,0.5)';
                    valid = false;
                }
            });
        }

        return valid;
    }

    /* ── PAY BUTTON ── */

    function setupPayButton() {
        const form = $('#checkout-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (isProcessing) return;
            if (!validateForm()) {
                shakeButton();
                return;
            }

            await processPayment();
        });
    }

    function shakeButton() {
        const btn = $('#pay-btn');
        btn.classList.add('animate-shake');
        setTimeout(() => btn.classList.remove('animate-shake'), 500);
    }

    async function processPayment() {
        isProcessing = true;
        const btn = $('#pay-btn');

        // Show loading state
        btn.disabled = true;
        btn.innerHTML = `<div class="flex items-center justify-center gap-3"><svg class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg><span>Procesando pago...</span></div>`;

        try {
            // Collect billing data
            const billingData = {
                nombre: $('[name="nombre"]').value.trim(),
                email: $('[name="email"]').value.trim(),
                empresa: $('[name="empresa"]').value.trim(),
                cif: $('[name="cif"]').value.trim(),
            };

            // Process with gateway
            const result = await gateway.processPayment(pricing.total, 'eur', {
                plan: currentPlan,
                reference,
                ...billingData,
            });

            // Send order data to webhook
            await sendOrderToWebhook({
                referencia: reference,
                plan: currentPlan,
                precio_base: pricing.subtotal,
                descuento: pricing.discountAmount,
                iva: pricing.iva,
                total: pricing.total,
                cliente: billingData,
                metodo_pago: selectedMethod,
                payment_id: result.id,
                demo: result.demo || false,
                timestamp: new Date().toISOString(),
            });

            // Show success
            showSuccess(billingData);
        } catch (err) {
            showPaymentError(err.message);
        } finally {
            isProcessing = false;
            btn.disabled = false;
            btn.innerHTML = `<span>Pagar ${pricing.formatted.total}</span>`;
        }
    }

    /* ── SUCCESS / ERROR SCREENS ── */

    function showSuccess(billing) {
        const overlay = $('#success-overlay');
        overlay.classList.remove('hidden');
        document.body.style.overflow = 'hidden';

        $('#success-ref').textContent = reference;
        $('#success-plan').textContent = pricing.plan.name;
        $('#success-total').textContent = pricing.formatted.total;
        $('#success-email').textContent = billing.email;

        // Animate in
        requestAnimationFrame(() => {
            overlay.querySelector('.success-card').classList.add('animate-success-in');
        });
    }

    function showPaymentError(message) {
        const errDiv = $('#payment-error');
        errDiv.textContent = message || 'Error procesando el pago. Inténtalo de nuevo.';
        errDiv.classList.remove('hidden');
        setTimeout(() => errDiv.classList.add('hidden'), 6000);
    }
})();
