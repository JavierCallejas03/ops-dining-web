/* ============================================
   OPS DINING — Form Handler (n8n Webhook)
   Envía datos al webhook de n8n en lugar de Formspree.
   Integra validación con security.js.
   ============================================ */

(function () {
    'use strict';

    /* =============================================
       CONFIGURACIÓN — Cambiar URL del webhook aquí
       ============================================= */
    var WEBHOOK_URL = 'https://n8n.opsdining.com/webhook/ops-dining-form';

    var form = document.getElementById('secure-form');
    var submitBtn = document.getElementById('submit-btn');
    var statusMsg = document.getElementById('form-status');

    if (!form) return;

    // Registrar tiempo de carga para anti-bot timing
    if (window.OPS_SECURITY) {
        window.OPS_SECURITY.initTimingCheck();
    }

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        /* ---- SECURITY VALIDATION ---- */
        if (window.OPS_SECURITY) {
            var validation = window.OPS_SECURITY.validateSubmission(form);
            if (!validation.valid) {
                showStatus(validation.reason, true);
                return;
            }
        }

        /* ---- DISABLE BUTTON ---- */
        submitBtn.disabled = true;
        submitBtn.innerText = 'PROCESANDO...';

        /* ---- PREPARE DATA ---- */
        var formData = {
            nombre: form.querySelector('[name="nombre"]').value.trim(),
            restaurante: form.querySelector('[name="restaurante"]').value.trim(),
            email: form.querySelector('[name="email"]').value.trim(),
            telefono: form.querySelector('[name="telefono"]').value.trim(),
            timestamp: new Date().toISOString(),
            source: 'web-opsdining'
        };

        try {
            /* ---- DETERMINE ENDPOINT ---- */
            var endpoint = WEBHOOK_URL || form.getAttribute('action');

            if (!endpoint) {
                throw new Error('No endpoint configured');
            }

            var res = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                showStatus('SOLICITUD ENVIADA CON ÉXITO.', false);
                form.reset();
                submitBtn.innerText = 'ENVIADO';

                // Re-init timing para siguiente envío
                if (window.OPS_SECURITY) {
                    window.OPS_SECURITY.initTimingCheck();
                }
            } else {
                throw new Error('Server responded with ' + res.status);
            }
        } catch (error) {
            showStatus('ERROR AL ENVIAR. INTÉNTELO DE NUEVO.', true);
            submitBtn.disabled = false;
            submitBtn.innerText = 'REINTENTAR ENVÍO';
        }
    });

    /* ---- STATUS DISPLAY ---- */
    function showStatus(message, isError) {
        if (!statusMsg) return;
        statusMsg.innerText = message;
        statusMsg.classList.remove('hidden');

        if (isError) {
            statusMsg.className = 'mt-12 text-[10px] font-bold uppercase tracking-widest block p-6 border border-red-500 text-red-500 italic text-center';
        } else {
            statusMsg.className = 'mt-12 text-[10px] font-bold uppercase tracking-widest block p-6 border border-navy text-navy italic text-center';
        }
    }
})();
