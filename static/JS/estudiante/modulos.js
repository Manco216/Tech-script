// modulos.js - Con sistema de pagos integrado (BRAINTREE)

class ModulosApp {
    constructor() {
        this.diplomadoId = this.getDiplomadoIdFromURL();
        this.diplomado = null;
        this.modulos = [];
        this.accessStatus = null;
        this.dropinInstance = null;
        this.init();
    }
    
    getDiplomadoIdFromURL() {
        const path = window.location.pathname;
        const match = path.match(/\/modulos\/(\d+)/);
        return match ? parseInt(match[1]) : null;
    }

    async init() {
        if (!this.diplomadoId) {
            this.showError('ID de diplomado no válido');
            return;
        }

        await this.verificarAcceso();
        await this.loadDiplomadoData();
        await this.loadContenidos();
        this.setupEventListeners();
        this.setupSidebar();
    }

    // =================== VERIFICAR ACCESO ===================
    async verificarAcceso() {
        try {
            const response = await fetch(`/pagos/api/verificar-acceso/${this.diplomadoId}`);
            
            if (!response.ok) {
                throw new Error('Error al verificar acceso');
            }
            
            this.accessStatus = await response.json();
            console.log('Estado de acceso:', this.accessStatus);
            
        } catch (error) {
            console.error('Error al verificar acceso:', error);
            this.showError('No se pudo verificar el acceso al diplomado');
        }
    }

    // =================== CARGAR DATOS DEL DIPLOMADO ===================
    async loadDiplomadoData() {
        try {
            const response = await fetch(`/estudiante/api/diplomados/${this.diplomadoId}`);
            
            if (!response.ok) {
                throw new Error('Error al cargar el diplomado');
            }
            
            this.diplomado = await response.json();
            this.renderDiplomadoInfo();
            
        } catch (error) {
            console.error('Error al cargar diplomado:', error);
            this.showError('No se pudo cargar la información del diplomado');
        }
    }

    // =================== CARGAR CONTENIDOS ===================
async loadContenidos() {
    try {
        const response = await fetch(`/estudiante/api/diplomados/${this.diplomadoId}/contenidos`);
        
        if (!response.ok) {
            throw new Error('Error al cargar contenidos');
        }
        
        const data = await response.json();
        
        // Adaptar contenidos a estructura de lecciones
        this.modulos = [{
            titulo: "Contenidos del Diplomado",
            lecciones: data.contenidos || []
        }];
        
        this.matriculado = data.matriculado;
        
        this.renderModulos();
        
    } catch (error) {
        console.error('Error al cargar contenidos:', error);
        this.showError('No se pudieron cargar los contenidos');
    }
}

    // =================== RENDERIZAR INFO DEL DIPLOMADO ===================
    renderDiplomadoInfo() {
        if (!this.diplomado) return;

        document.getElementById('course-title').textContent = this.diplomado.titulo;
        document.getElementById('level').textContent = `Nivel ${this.diplomado.nivel}`;
        document.getElementById('classes').textContent = `${this.diplomado.estadisticas.total_contenidos} clases`;
        document.getElementById('duration').textContent = `${this.diplomado.duracion_horas} horas de contenido`;
        document.getElementById('course-description').textContent = this.diplomado.descripcion;
        document.getElementById('rating-score').textContent = this.diplomado.estadisticas.rating;
        document.getElementById('opinions').textContent = `${this.diplomado.estadisticas.total_estudiantes} opiniones ›`;

        this.updateActionButton();
    }

    // =================== ACTUALIZAR BOTÓN DE ACCIÓN ===================
    updateActionButton() {
        const startBtn = document.getElementById('start-course-btn');
        const buyBtn = document.querySelector('.buy-course-btn');

        if (!this.accessStatus) return;

        if (startBtn) startBtn.style.display = 'none';
        if (buyBtn) buyBtn.style.display = 'none';

        switch (this.accessStatus.access) {
            case 'enrolled':
                if (startBtn) {
                    startBtn.innerHTML = '<i class="fas fa-play"></i> Continuar Curso';
                    startBtn.style.display = 'block';
                    startBtn.onclick = () => this.continuarCurso();
                }
                break;

            case 'free':
                if (startBtn) {
                    startBtn.innerHTML = '<i class="fas fa-gift"></i> Empezar Curso Gratis';
                    startBtn.style.display = 'block';
                    startBtn.onclick = () => this.matricularGratis();
                }
                break;

            case 'requires_payment':
                if (buyBtn) {
                    const precio = this.formatPrice(this.accessStatus.precio);
                    buyBtn.innerHTML = `<i class="fas fa-shopping-cart"></i> Comprar por ${precio}`;
                    buyBtn.style.display = 'block';
                    buyBtn.onclick = () => this.mostrarModalPago();
                }
                break;
        }
    }

    // =================== MATRICULAR GRATIS ===================
    async matricularGratis() {
        try {
            const response = await fetch(`/pagos/api/matricular-gratis/${this.diplomadoId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error al matricularse');
            }

            this.showNotification('Matriculado exitosamente', 'success');
            
            setTimeout(() => {
                location.reload();
            }, 1000);
            
        } catch (error) {
            console.error('Error:', error);
            this.showNotification(error.message, 'error');
        }
    }

    // =================== CONTINUAR CURSO ===================
  async continuarCurso() {
    try {
        // Obtener el primer contenido del diplomado
        const response = await fetch(`/estudiante/api/diplomado/${this.diplomadoId}/primer-contenido`);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'No se pudo obtener el contenido');
        }
        
        if (data.contenido_id) {
            window.location.href = `/estudiante/clase/${data.contenido_id}`;
        } else {
            this.showNotification('Este diplomado no tiene contenidos disponibles', 'warning');
        }
        
    } catch (error) {
        console.error('Error al continuar curso:', error);
        this.showNotification('Error al cargar el contenido', 'error');
    }
}

    // =================== MOSTRAR MODAL DE PAGO ===================
    async mostrarModalPago() {
        const modal = this.createPaymentModal();
        document.body.appendChild(modal);
        
        setTimeout(() => {
            modal.classList.add('active');
        }, 10);

        await this.initBraintree(modal);
    }

    // =================== CREAR MODAL DE PAGO ===================
    createPaymentModal() {
        const modal = document.createElement('div');
        modal.className = 'payment-modal';
        modal.innerHTML = `
            <div class="payment-modal-overlay"></div>
            <div class="payment-modal-content">
                <button class="close-modal" onclick="this.closest('.payment-modal').remove()">
                    <i class="fas fa-times"></i>
                </button>
                
                <div class="payment-header">
                    <i class="fas fa-graduation-cap"></i>
                    <h2>Finalizar Compra</h2>
                    <p>${this.diplomado.titulo}</p>
                </div>

                <div class="payment-summary">
                    <div class="summary-row">
                        <span>Precio del diplomado:</span>
                        <strong>${this.formatPrice(this.accessStatus.precio)}</strong>
                    </div>
                    <div class="summary-row total">
                        <span>Total a pagar:</span>
                        <strong>${this.formatPrice(this.accessStatus.precio)}</strong>
                    </div>
                </div>

                <div class="payment-methods">
                    <h3>Pagar con Tarjeta, Google Pay o PayPal</h3>
                    
                    <div id="braintree-dropin-container"></div>
                    
                    <button id="submit-button" class="btn btn-primary" disabled style="width: 100%; margin-top: 15px;">
                        Pagar Ahora
                    </button>
                    <p style="text-align: center; margin-top: 10px; font-size: 0.8em; color: #666;">
                        Transacción segura con Braintree
                    </p>

                </div>

                <div class="payment-security">
                    <i class="fas fa-lock"></i>
                    <span>Transacción 100% segura, impulsada por Braintree/PayPal</span>
                </div>
            </div>
        `;

        modal.querySelector('.payment-modal-overlay').onclick = () => modal.remove();

        return modal;
    }

    // =================== INICIALIZAR BRAINTREE DROP-IN ===================
   // =================== INICIALIZAR BRAINTREE DROP-IN ===================
async initBraintree(modal) {
    const dropinContainer = modal.querySelector('#braintree-dropin-container');
    const submitButton = modal.querySelector('#submit-button');

    try {
        this.showNotification('Cargando métodos de pago...', 'info');

        const response = await fetch('/pagos/api/generar-client-token');
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Fallo al obtener el token de Braintree.');
        }

        const clientToken = data.client_token;
        
        braintree.dropin.create({
            authorization: clientToken,
            container: dropinContainer,
            locale: 'es_ES',
            
            // Configuración de tarjetas con todos los campos visibles
            card: {
                cardholderName: {
                    required: true
                },
                overrides: {
                    fields: {
                        number: {
                            placeholder: '4111 1111 1111 1111',
                            maskInput: false
                        },
                        expirationDate: {
                            placeholder: 'MM/AA'
                        },
                        cvv: {
                            placeholder: '123',
                            maskInput: {
                                character: '•'
                            }
                        },
                        cardholderName: {
                            placeholder: 'Nombre del titular'
                        }
                    },
                    styles: {
                        'input': {
                            'font-size': '16px',
                            'color': '#1e293b'
                        },
                        'input.invalid': {
                            'color': '#ef4444'
                        },
                        'input.valid': {
                            'color': '#10b981'
                        }
                    }
                }
            },
            
            // PayPal
            paypal: {
                flow: 'checkout',
                amount: this.accessStatus.precio.toString(),
                currency: 'USD',
                buttonStyle: {
                    color: 'blue',
                    shape: 'rect',
                    size: 'responsive'
                }
            },
            
            // Google Pay
            googlePay: {
                googlePayVersion: 2,
                merchantInfo: {
                    merchantName: 'Tech-script'
                },
                transactionInfo: {
                    currencyCode: 'USD',
                    totalPriceStatus: 'FINAL',
                    totalPrice: this.accessStatus.precio.toString()
                },
                allowedPaymentMethods: [{
                    type: 'CARD',
                    parameters: {
                        billingAddressRequired: false
                    }
                }],
                buttonColor: 'default',
                buttonType: 'buy'
            },
            
            // Configuración de traducción
            translations: {
                cardholderNameLabel: 'Nombre del titular',
                cardNumberLabel: 'Número de tarjeta',
                cvvLabel: 'CVV',
                expirationDateLabel: 'Fecha de expiración (MM/AA)',
                postalCodeLabel: 'Código postal'
            }
            
        }, (createErr, instance) => {
            if (createErr) {
                console.error('Error al crear Drop-in:', createErr);
                this.showNotification('Error al cargar la pasarela de pagos.', 'error');
                submitButton.disabled = true;
                return;
            }
            
            this.dropinInstance = instance;
            this.showNotification('Pasarela de pagos lista.', 'success');
            submitButton.disabled = false;

            submitButton.onclick = () => this.handlePaymentSubmission();

            instance.on('paymentMethodRequestable', (event) => {
                submitButton.disabled = false;
                submitButton.textContent = 'Pagar Ahora';
                console.log('Método de pago listo:', event.type);
            });
            
            instance.on('noPaymentMethodRequestable', () => {
                submitButton.disabled = true;
                submitButton.textContent = 'Complete los datos';
            });

            // Log cuando cambia el método de pago
            instance.on('paymentOptionSelected', (event) => {
                console.log('Método seleccionado:', event.paymentOption);
            });
        });

    } catch (error) {
        console.error('Error Braintree:', error);
        this.showNotification(error.message, 'error');
        if(submitButton) submitButton.disabled = true;
    }
}

    // =================== MANEJAR ENVÍO DEL PAGO ===================
    async handlePaymentSubmission() {
        if (!this.dropinInstance) return;

        this.showNotification('Procesando pago...', 'info');
        const submitButton = document.querySelector('#submit-button');
        submitButton.disabled = true;

        try {
            const { nonce } = await this.dropinInstance.requestPaymentMethod();

            const response = await fetch('/pagos/api/procesar-pago-bt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    diplomado_id: this.diplomadoId,
                    payment_nonce: nonce
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error al procesar el pago.');
            }

            this.showNotification('Pago exitoso! Redirigiendo...', 'success');
            
            document.querySelector('.payment-modal')?.remove();

            setTimeout(() => {
                location.reload();
            }, 1500);

        } catch (error) {
            console.error('Error de transacción:', error);
            this.showNotification(error.message || 'La transacción falló. Intenta de nuevo.', 'error');
            submitButton.disabled = false;
        }
    }

    // =================== RENDERIZAR MÓDULOS ===================
    renderModulos() {
        const container = document.querySelector('.course-content');
        if (!container) return;

        const h2 = container.querySelector('h2');
        container.innerHTML = '';
        if (h2) container.appendChild(h2);

        if (this.modulos.length === 0) {
            container.innerHTML += `
                <div style="text-align: center; padding: 3rem;">
                    <i class="fas fa-inbox" style="font-size: 3rem; color: #cbd5e1;"></i>
                    <h3 style="color: #64748b;">No hay contenido disponible aún</h3>
                </div>
            `;
            return;
        }

        this.modulos.forEach((modulo, index) => {
            container.innerHTML += this.createModuloHTML(modulo, index);
        });

        container.innerHTML += this.getCertificateHTML();
        this.setupAccordions();
    }

    // =================== CREAR HTML DE MÓDULO ===================
    createModuloHTML(modulo, index) {
        const leccionesHTML = modulo.lecciones
            .map((leccion, leccionIndex) => this.createLeccionHTML(leccion, index, leccionIndex))
            .join('');

        return `
            <div class="lesson-section">
                <button class="module-title collapsible">
                    <i class="fas fa-brain"></i>
                    <span>${modulo.titulo}</span>
                    <i class="fas fa-chevron-down toggle-icon"></i>
                </button>
                <div class="lesson-list">
                    ${leccionesHTML}
                </div>
            </div>
        `;
    }

    // =================== CREAR HTML DE LECCIÓN ===================
    createLeccionHTML(leccion, moduleIndex, leccionIndex) {
        const numero = leccionIndex + 1;
        const iconoEstado = this.getEstadoIcon(leccion.estado);
        const textoEstado = this.getEstadoText(leccion.estado);
        const bloqueado = !leccion.puede_acceder;

        return `
            <div class="lesson-item ${leccion.estado} ${bloqueado ? 'locked' : ''}" 
                 data-leccion-id="${leccion.id}"
                 data-puede-acceder="${leccion.puede_acceder}">
                <div class="lesson-number">${numero}</div>
                <div class="lesson-content">
                    <h4>${leccion.titulo}</h4>
                    <div class="lesson-status">
                        ${bloqueado ? '<i class="fas fa-lock"></i> Bloqueado' : `${iconoEstado} ${textoEstado}`}
                    </div>
                    <div class="lesson-duration">${leccion.duracion}</div>
                </div>
                ${bloqueado ? '<i class="fas fa-lock lock-icon"></i>' : ''}
            </div>
        `;
    }

    getEstadoIcon(estado) {
        const iconos = {
            'completed': '<i class="fas fa-check-circle" style="color: #10b981;"></i>',
            'in-progress': '<i class="fas fa-spinner fa-spin" style="color: #f59e0b;"></i>',
            'pending': '<i class="fas fa-clock" style="color: #94a3b8;"></i>'
        };
        return iconos[estado] || iconos['pending'];
    }

    getEstadoText(estado) {
        const textos = {
            'completed': 'Completado',
            'in-progress': 'En progreso',
            'pending': 'Pendiente'
        };
        return textos[estado] || 'Pendiente';
    }

    getCertificateHTML() {
        return `
            <div class="certificate-section">
                <div class="certificate-badge">
                    <i class="fas fa-graduation-cap"></i> Certificado digital
                </div>
                <div class="certificate-content">
                    <h3>Comparte tus logros con un certificado</h3>
                    <p>Al completar el diplomado recibirás un certificado digital.</p>
                </div>
            </div>
        `;
    }

    setupAccordions() {
        const headers = document.querySelectorAll('.module-title');
        
        headers.forEach(header => {
            header.addEventListener('click', () => {
                const content = header.nextElementSibling;
                const toggleIcon = header.querySelector('.toggle-icon');
                const isOpen = content.classList.contains('open');
                
                content.classList.toggle('open', !isOpen);
                if (!isOpen) {
                    content.style.maxHeight = content.scrollHeight + 'px';
                    toggleIcon?.classList.add('rotated');
                } else {
                    content.style.maxHeight = null;
                    toggleIcon?.classList.remove('rotated');
                }
            });
        });
    }

    setupEventListeners() {
        document.addEventListener('click', (e) => {
            const lessonItem = e.target.closest('.lesson-item');
            if (lessonItem) {
                this.handleLeccionClick(lessonItem);
            }
        });
    }
    
    handleLeccionClick(lessonItem) {
        const puedeAcceder = lessonItem.dataset.puedeAcceder === 'true';
        const leccionId = lessonItem.dataset.leccionId;

        if (!puedeAcceder) {
            this.showNotification('Debes matricularte para acceder a este contenido', 'warning');
            this.mostrarModalPago();
            return;
        }

        window.location.href = `/estudiante/clase/${leccionId}`;
    }

    formatPrice(price) {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(price);
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => notification.classList.add('show'), 10);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    showError(message) {
            const content = document.querySelector('.course-content');
            if (content) {
                content.innerHTML = `
                    <div style="text-align: center; padding: 3rem;">
                        <i class="fas fa-exclamation-circle" style="font-size: 3rem; color: #ef4444;"></i>
                        <h3 style="color: #64748b;">${message}</h3>
                        <button onclick="location.href='/estudiante/diplomados'" class="btn btn-primary" style="margin-top: 1rem;">
                            Volver a Diplomados
                        </button>
                    </div>
                `;
            }
        }

        setupSidebar() {
            const toggleBtn = document.getElementById('toggleSidebar');
            const toggleTopBtn = document.getElementById('toggleSidebarTop');
            const sidebar = document.getElementById('sidebar');

            toggleBtn?.addEventListener('click', () => sidebar.classList.toggle('collapsed'));
            toggleTopBtn?.addEventListener('click', () => sidebar.classList.toggle('active'));
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        window.modulosApp = new ModulosApp();
    });