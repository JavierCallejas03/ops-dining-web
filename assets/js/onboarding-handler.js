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
        form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function validateStep() {
        const activeStep = document.querySelector('.step-content.active');
        const inputs = activeStep.querySelectorAll('input[required], select[required], textarea[required]');
        let isValid = true;

        inputs.forEach(input => {
            if (!input.value.trim()) {
                input.style.borderColor = '#ff4444';
                isValid = false;
            } else {
                input.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            }
        });

        if (!isValid) {
            alert('Por favor, rellena todos los campos obligatorios (*) para continuar.');
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
        
        // Show loading state on button
        submitBtn.disabled = true;
        submitBtn.innerText = 'Enviando Dossier...';

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        // Add extra metadata
        data.submittedAt = new Date().toISOString();
        data.source = 'Onboarding Page';

        try {
            const response = await fetch(ONBOARDING_WEBHOOK_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                successMessage.classList.remove('hidden');
                window.scrollTo(0, 0);
            } else {
                throw new Error('Error en el servidor');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Hubo un problema al enviar el dossier. Por favor, inténtalo de nuevo.');
            submitBtn.disabled = false;
            submitBtn.innerText = 'Finalizar y Enviar';
        }
    });
});
