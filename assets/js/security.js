/* ============================================
   OPS DINING — Capa de Seguridad Runtime
   Protecciones anti-intrusión del lado cliente.
   ============================================ */

(function () {
    'use strict';

    const OPS_SECURITY = {
        VERSION: '1.0.0',
        RATE_LIMIT_MAX: 3,
        RATE_LIMIT_WINDOW_MS: 60000,
        MIN_SUBMIT_TIME_MS: 2000,
        formSubmissions: [],
        formLoadTime: null,

        /* ---- 1. ANTI-IFRAME (Clickjacking Protection) ---- */
        initAntiIframe: function () {
            if (window.self !== window.top) {
                try {
                    window.top.location = window.self.location;
                } catch (e) {
                    document.body.innerHTML = '';
                    document.body.style.display = 'none';
                }
            }
        },

        /* ---- 2. ANTI-DEVTOOLS (Detección consola) ---- */
        initAntiDevTools: function () {
            // Deshabilitar clic derecho
            document.addEventListener('contextmenu', function (e) {
                e.preventDefault();
                return false;
            });

            // Deshabilitar atajos de teclado para DevTools
            document.addEventListener('keydown', function (e) {
                // F12
                if (e.key === 'F12') {
                    e.preventDefault();
                    return false;
                }
                // Ctrl+Shift+I / Ctrl+Shift+J / Ctrl+Shift+C
                if (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) {
                    e.preventDefault();
                    return false;
                }
                // Ctrl+U (ver código fuente)
                if (e.ctrlKey && e.key.toUpperCase() === 'U') {
                    e.preventDefault();
                    return false;
                }
            });
        },

        /* ---- 3. INPUT SANITIZATION (Anti-XSS) ---- */
        sanitizeInput: function (str) {
            if (typeof str !== 'string') return '';
            var div = document.createElement('div');
            div.appendChild(document.createTextNode(str));
            return div.innerHTML
                .replace(/javascript:/gi, '')
                .replace(/on\w+\s*=/gi, '')
                .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        },

        sanitizeAllInputs: function (form) {
            var inputs = form.querySelectorAll('input, textarea, select');
            var clean = true;
            for (var i = 0; i < inputs.length; i++) {
                var original = inputs[i].value;
                var sanitized = this.sanitizeInput(original);
                if (original !== sanitized) {
                    inputs[i].value = sanitized;
                    clean = false;
                }
            }
            return clean;
        },

        /* ---- 4. ANTI-TAMPERING (Form Integrity) ---- */
        validateFormIntegrity: function (form) {
            var allowedFields = ['nombre', 'restaurante', 'email', 'telefono', '_gotcha'];
            var inputs = form.querySelectorAll('input[name], textarea[name], select[name]');
            for (var i = 0; i < inputs.length; i++) {
                if (allowedFields.indexOf(inputs[i].name) === -1) {
                    console.warn('[OPS Security] Campo inyectado detectado:', inputs[i].name);
                    return false;
                }
            }
            return true;
        },

        /* ---- 5. RATE LIMITER ---- */
        checkRateLimit: function () {
            var now = Date.now();
            // Limpiar envíos fuera de ventana
            this.formSubmissions = this.formSubmissions.filter(function (t) {
                return now - t < OPS_SECURITY.RATE_LIMIT_WINDOW_MS;
            });

            if (this.formSubmissions.length >= this.RATE_LIMIT_MAX) {
                return false;
            }

            this.formSubmissions.push(now);
            return true;
        },

        /* ---- 6. ANTI-BOT (Timing Check) ---- */
        initTimingCheck: function () {
            this.formLoadTime = Date.now();
        },

        isHumanTiming: function () {
            if (!this.formLoadTime) return true;
            return (Date.now() - this.formLoadTime) > this.MIN_SUBMIT_TIME_MS;
        },

        /* ---- 7. HONEYPOT CHECK ---- */
        checkHoneypot: function (form) {
            var honeypot = form.querySelector('[name="_gotcha"]');
            if (honeypot && honeypot.value.length > 0) {
                return false; // Bot detectado
            }
            return true;
        },

        /* ---- 8. EMAIL VALIDATION ---- */
        validateEmail: function (email) {
            var re = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
            return re.test(email);
        },

        /* ---- 9. PHONE VALIDATION ---- */
        validatePhone: function (phone) {
            var cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
            return /^\+?\d{7,15}$/.test(cleaned);
        },

        /* ---- 10. CSP VIOLATION REPORTER ---- */
        initCSPReporter: function () {
            document.addEventListener('securitypolicyviolation', function (e) {
                console.warn('[OPS Security] CSP Violation:', {
                    directive: e.violatedDirective,
                    blocked: e.blockedURI,
                    source: e.sourceFile
                });
            });
        },

        /* ---- 11. ANTI-CLIPBOARD SCRAPING ---- */
        initAntiScraping: function () {
            var protectedElements = document.querySelectorAll('a[href^="tel:"], a[href^="mailto:"]');
            for (var i = 0; i < protectedElements.length; i++) {
                protectedElements[i].addEventListener('copy', function (e) {
                    e.preventDefault();
                });
                protectedElements[i].style.userSelect = 'none';
                protectedElements[i].style.webkitUserSelect = 'none';
            }
        },

        /* ---- 12. LINK PROTECTION (Anti-Open Redirect) ---- */
        initLinkProtection: function () {
            document.addEventListener('click', function (e) {
                var link = e.target.closest('a[href]');
                if (!link) return;

                var href = link.getAttribute('href');
                // Permitir anchors internos, tel:, mailto:, javascript:void(0)
                if (!href || href.startsWith('#') || href.startsWith('tel:') ||
                    href.startsWith('mailto:') || href === 'javascript:void(0)') {
                    return;
                }

                // Bloquear links externos no autorizados
                var allowedDomains = [
                    window.location.hostname,
                    'cdn.tailwindcss.com',
                    'fonts.googleapis.com',
                    'fonts.gstatic.com',
                    'images.unsplash.com',
                    'bvfaxdlrujgswyicjecn.supabase.co'
                ];

                try {
                    var url = new URL(href, window.location.origin);
                    var isAllowed = allowedDomains.some(function (d) {
                        return url.hostname === d || url.hostname.endsWith('.' + d);
                    });

                    if (!isAllowed && url.origin !== window.location.origin) {
                        e.preventDefault();
                        console.warn('[OPS Security] External link blocked:', href);
                    }
                } catch (err) {
                    // URL inválida, bloquear
                    e.preventDefault();
                }
            });
        },

        /* ---- FULL FORM VALIDATION ---- */
        validateSubmission: function (form) {
            // 1. Honeypot
            if (!this.checkHoneypot(form)) {
                return { valid: false, reason: 'Bot detectado (honeypot)' };
            }

            // 2. Timing
            if (!this.isHumanTiming()) {
                return { valid: false, reason: 'Envío demasiado rápido (posible bot)' };
            }

            // 3. Rate limit
            if (!this.checkRateLimit()) {
                return { valid: false, reason: 'Demasiados envíos. Espere un momento.' };
            }

            // 4. Form integrity
            if (!this.validateFormIntegrity(form)) {
                return { valid: false, reason: 'Formulario comprometido' };
            }

            // 5. Sanitize
            this.sanitizeAllInputs(form);

            // 6. Email validation
            var emailInput = form.querySelector('[name="email"]');
            if (emailInput && !this.validateEmail(emailInput.value)) {
                return { valid: false, reason: 'Email no válido' };
            }

            // 7. Phone validation
            var phoneInput = form.querySelector('[name="telefono"]');
            if (phoneInput && !this.validatePhone(phoneInput.value)) {
                return { valid: false, reason: 'Teléfono no válido' };
            }

            return { valid: true };
        },

        /* ---- INIT ---- */
        init: function () {
            this.initAntiIframe();
            this.initAntiDevTools();
            this.initCSPReporter();
            this.initAntiScraping();
            this.initLinkProtection();
            this.initTimingCheck();
        }
    };

    // Expose to global for form-handler.js
    window.OPS_SECURITY = OPS_SECURITY;

    // Auto-init on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            OPS_SECURITY.init();
        });
    } else {
        OPS_SECURITY.init();
    }
})();
