const loginContainer = document.querySelector('.login-container');
const btnSignIn = document.getElementById('btn-sign-in');
const btnSignUp = document.getElementById('btn-sign-up');

btnSignIn.addEventListener("click", () => {
    loginContainer.classList.remove('toggle');
});
btnSignUp.addEventListener("click", () => {
    loginContainer.classList.add("toggle");
});

// Mostrar/ocultar contraseña
document.querySelectorAll('.password-eye').forEach(eye => {
    const container = eye.closest('.container-input');
    const input = container.querySelector('input');
    const icon = eye.querySelector('ion-icon');

    eye.addEventListener('click', () => {
        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
        icon.setAttribute('name', isPassword ? 'eye-off-outline' : 'eye-outline');
        input.focus();
        const length = input.value.length;
        input.setSelectionRange(length, length);
    });
});

// Lógica de formulario de 2 pasos
const steps = document.querySelectorAll(".sign-up .step");
const btnNext = document.getElementById("btn-next");
const btnPrev = document.getElementById("btn-prev");
const stepText = document.getElementById("step-text");

let currentStep = 0;

btnNext.addEventListener("click", () => {
    steps[currentStep].classList.remove("active");
    currentStep++;
    steps[currentStep].classList.add("active");
    stepText.textContent = `Paso ${currentStep + 1} de 2`;
});

btnPrev.addEventListener("click", () => {
    steps[currentStep].classList.remove("active");
    currentStep--;
    steps[currentStep].classList.add("active");
    stepText.textContent = `Paso ${currentStep + 1} de 2`;
});

