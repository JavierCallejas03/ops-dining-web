document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('onboarding-form');
    const steps = document.querySelectorAll('.step-content');
    const nextBtn = document.getElementById('next-btn');
    const prevBtn = document.getElementById('prev-btn');
    const submitBtn = document.getElementById('submit-btn');
    const progressFill = document.getElementById('progress-fill');
    const stepLabel = document.getElementById('step-label');
    const stepPercentage = document.getElementById('step-percentage');
    const successMessage = document.getElementById('success-message');

    let currentStep = 1;
    const totalSteps = steps.length;

    // Configuración de n8n - Debes crear un nuevo Webhook en n8n para esto
    const ONBOARDING_WEBHOOK_URL = 'https://n8n.opsdining.com/webhook/ops-dining-onboarding';

    function updateUI() {
        // Update Steps Visibility
        steps.forEach(step => {
            step.classList.toggle('active', parseInt(step.dataset.step) === currentStep);
        });

        // Update Progress Bar
        const percentage = (currentStep / totalSteps) * 100;
        progressFill.style.width = `${percentage}%`;
        stepLabel.innerText = `Paso ${currentStep} de ${totalSteps}`;
        stepPercentage.innerText = `${Math.round(percentage)}%`;

        // Update Buttons
        prevBtn.classList.toggle('invisible', currentStep === 1);
        
        if (currentStep === totalSteps) {
            nextBtn.classList.add('hidden');
            submitBtn.classList.remove('hidden');
        } else {
            nextBtn.classList.remove('hidden');
            submitBtn.classList.add('hidden');
        }

        // Scroll to top of form
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function validateStep() {
        const activeStep = document.querySelector('.step-content.active');
        const inputs = activeStep.querySelectorAll('input, select, textarea');
        let isValid = true;

        inputs.forEach(input => {
            // 1. Limpiar estados previos
            input.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            const parent = input.closest('div');
            const existingError = parent.querySelector('.error-msg');
            if (existingError) existingError.remove();

            let isFieldValid = true;
            let errorMsg = "";

            // 2. Validación de campos obligatorios
            if (input.hasAttribute('required') && !input.value.trim()) {
                isFieldValid = false;
                errorMsg = "Este campo es obligatorio";
            } 
            // 3. Validación de patrones (ej: el teléfono de 9 números)
            else if (input.hasAttribute('pattern') && input.value.trim()) {
                const pattern = new RegExp("^" + input.getAttribute('pattern') + "$");
                if (!pattern.test(input.value.trim())) {
                    isFieldValid = false;
                    errorMsg = input.title || "Formato incorrecto";
                }
            }
            // 4. Validación de Emails
            else if (input.type === 'email' && input.value.trim()) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(input.value.trim())) {
                    isFieldValid = false;
                    errorMsg = "Introduce un email válido";
                }
            }
            // 5. Validación de URLs
            else if (input.type === 'url' && input.value.trim()) {
                try { 
                    new URL(input.value.trim()); 
                } catch(_) {
                    isFieldValid = false;
                    errorMsg = "Introduce una URL válida (ej: https://web.com)";
                }
            }

            // 6. Aplicar visual de error si falla
            if (!isFieldValid) {
                isValid = false;
                input.style.borderColor = '#ef4444';
                const msg = document.createElement('p');
                msg.className = 'error-msg text-[#ef4444] text-[10px] mt-1 italic animate-pulse';
                msg.innerText = errorMsg;
                parent.appendChild(msg);
            }
        });

        if (!isValid) {
            const firstError = activeStep.querySelector('.error-msg');
            if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        return isValid;
    }

    nextBtn.addEventListener('click', () => {
        if (validateStep()) {
            currentStep++;
            updateUI();
        }
    });

    prevBtn.addEventListener('click', () => {
        if (currentStep > 1) {
            currentStep--;
            updateUI();
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!validateStep()) return;

        // Show loading state
        submitBtn.disabled = true;
        const originalText = submitBtn.innerText;
        submitBtn.innerText = 'Enviando...';

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        data.submittedAt = new Date().toISOString();

        try {
            const response = await fetch(ONBOARDING_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                successMessage.classList.remove('hidden');
                document.body.style.overflow = 'hidden';
                window.scrollTo(0, 0);
            } else {
                throw new Error('Error en el servidor');
            }
        } catch (error) {
            alert('Error al enviar. Inténtalo de nuevo.');
            submitBtn.disabled = false;
            submitBtn.innerText = originalText;
        }
    });
});
