    // =====================
    // Data
    // =====================
    const paymentHistory = [
        { id: 1, date: "2024-02-01", description: "Diplomado: Desarrollo Web Full Stack", amount: 299, status: "completed", method: "Tarjeta de Crédito", invoice: "INV-2024-001", course: "Desarrollo Web Full Stack" },
        { id: 2, date: "2024-01-15", description: "Diplomado: Data Science con Python", amount: 399, status: "completed", method: "PayPal", invoice: "INV-2024-002", course: "Data Science con Python" },
        { id: 3, date: "2024-01-01", description: "Suscripción Premium - Enero", amount: 29, status: "completed", method: "Tarjeta de Débito", invoice: "INV-2024-003", course: "Suscripción Premium" },
        { id: 4, date: "2024-02-08", description: "Diplomado: Inteligencia Artificial", amount: 449, status: "pending", method: "Transferencia Bancaria", invoice: "INV-2024-004", course: "Inteligencia Artificial" },
        { id: 5, date: "2024-01-28", description: "Tutoría Personalizada - React", amount: 50, status: "failed", method: "Tarjeta de Crédito", invoice: "INV-2024-005", course: "Tutoría React" },
    ];

    const paymentMethods = [
        { id: 1, type: "credit", brand: "Visa", last4: "4242", expiryMonth: "12", expiryYear: "2025", isDefault: true },
        { id: 2, type: "credit", brand: "Mastercard", last4: "8888", expiryMonth: "08", expiryYear: "2026", isDefault: false },
        { id: 3, type: "paypal", email: "maria.gonzalez@email.com", isDefault: false },
    ];

    // =====================
    // Utility Functions
    // =====================
    const getStatusIcon = (status) => ({ completed: "check-circle", pending: "clock", failed: "alert-circle" }[status] || "clock");
    const getStatusClass = (status) => ({ completed: "status-completed", pending: "status-pending", failed: "status-failed" }[status] || "status-pending");
    const getStatusText = (status) => ({ completed: "Completado", pending: "Pendiente", failed: "Fallido" }[status] || "Pendiente");
    const getCardIcon = (brand) => ({ visa: "💳", mastercard: "💳", paypal: "🅿️" }[brand?.toLowerCase()] || "💳");
    const formatDate = (dateString) => new Date(dateString).toLocaleDateString('es-ES');

    // =====================
    // Render Functions
    // =====================
    const renderPaymentHistory = () => {
        const container = document.getElementById('payment-history-list');
        if(!container) return;
        container.innerHTML = paymentHistory.map((payment, index) => `
            <div class="payment-item" data-payment-id="${payment.id}" data-index="${index}">
                <div class="payment-info">
                    <div class="payment-icon"><i data-lucide="${getStatusIcon(payment.status)}"></i></div>
                    <div class="payment-details">
                        <h3>${payment.description}</h3>
                        <div class="payment-meta">
                            <span><i data-lucide="calendar"></i>${formatDate(payment.date)}</span>
                            <span>${payment.method}</span>
                        </div>
                    </div>
                </div>
                <div class="payment-actions">
                    <div class="payment-amount">
                        <div class="amount">$${payment.amount}</div>
                        <span class="badge ${getStatusClass(payment.status)}">${getStatusText(payment.status)}</span>
                    </div>
                    <div class="payment-buttons">
                        <button class="btn btn-outline btn-sm btn-view-payment"><i data-lucide="eye"></i>Ver</button>
                        ${payment.status === 'completed' ? `<button class="btn btn-outline btn-sm btn-download-invoice"><i data-lucide="download"></i>Factura</button>` : ''}
                    </div>
                </div>
            </div>
        `).join('');
        lucide.createIcons();
    };

    const renderPaymentMethods = () => {
        const container = document.getElementById('payment-methods-list');
        if(!container) return;
        container.innerHTML = paymentMethods.map((method, index) => `
            <div class="payment-method" data-method-id="${method.id}" data-index="${index}">
                <div class="method-info">
                    <div class="method-icon">${getCardIcon(method.type === 'paypal' ? 'paypal' : method.brand)}</div>
                    <div class="method-details">
                        ${method.type === 'paypal' ? `<p>PayPal</p><p>${method.email}</p>` : `<p>${method.brand} •••• ${method.last4}</p><p>Expira ${method.expiryMonth}/${method.expiryYear}</p>`}
                    </div>
                </div>
                <div class="method-actions">
                    ${method.isDefault ? '<span class="badge badge-secondary">Por defecto</span>' : ''}
                    <button class="btn btn-outline btn-sm btn-delete-method"><i data-lucide="trash-2"></i></button>
                </div>
            </div>
        `).join('');
        lucide.createIcons();
    };



    const renderInvoices = (filteredPayments = null) => {
        const payments = filteredPayments || paymentHistory.filter(p => p.status === 'completed');
        const container = document.getElementById('invoices-list');
        if(!container) return;
        container.innerHTML = payments.map((payment, index) => `
            <div class="invoice-item" data-invoice-id="${payment.id}" data-index="${index}">
                <div class="invoice-info">
                    <div class="invoice-icon"><i data-lucide="download"></i></div>
                    <div class="invoice-details">
                        <h3>${payment.invoice}</h3>
                        <p>${formatDate(payment.date)} • ${payment.course}</p>
                    </div>
                </div>
                <div class="invoice-actions">
                    <div class="invoice-amount">
                        <div class="amount">$${payment.amount}</div>
                        <span class="badge status-completed">Pagado</span>
                    </div>
                    <div class="payment-buttons">
                        <button class="btn btn-outline btn-sm btn-view-invoice"><i data-lucide="eye"></i>Ver</button>
                        <button class="btn btn-primary btn-sm btn-download-invoice-file"><i data-lucide="download"></i>Descargar</button>
                    </div>
                </div>
            </div>
        `).join('');
        lucide.createIcons();
    };

    // =====================
    // Tabs
    // =====================
    const tabTriggers = document.querySelectorAll('.tab-trigger');

    tabTriggers.forEach(trigger => {
        trigger.addEventListener('click', () => {
            const targetTab = trigger.getAttribute('data-tab');

            tabTriggers.forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            trigger.classList.add('active');
            document.getElementById(targetTab).classList.add('active');

            switch (targetTab) {
                case 'history': renderPaymentHistory(); break;
                case 'methods': renderPaymentMethods(); break;
                case 'plans': renderPlans(); break;
                case 'invoices': renderInvoices(); break;
            }

            lucide.createIcons();
        });
    });

    // =====================
    // Comprar Diplomado / Pagar Ahora
    // =====================
    const initBuyCourse = () => {
        const buyBtn = document.querySelector('.buy-course-btn'); 
        if(!buyBtn) return;

        buyBtn.addEventListener('click', () => {
            const courseTitle = document.getElementById('course-title').innerText;
            const coursePrice = 29; 
            localStorage.setItem('selectedCourse', JSON.stringify({ title: courseTitle, price: coursePrice }));
            window.location.href = 'pagos.html';
        });
    };

    const initPaySelectedCourse = () => {
        const selectedCourse = JSON.parse(localStorage.getItem('selectedCourse'));
        const container = document.getElementById('selected-course-container');
        const courseDiv = document.getElementById('selected-course');
        const payBtn = document.getElementById('pay-course-btn');

        if(selectedCourse && container && courseDiv && payBtn){
            container.style.display = 'block';
            courseDiv.innerText = `${selectedCourse.title} - $${selectedCourse.price}`;

            payBtn.addEventListener('click', () => {
                alert(`Procesando pago de ${selectedCourse.title} por $${selectedCourse.price}`);
                document.querySelector('.tab-trigger[data-tab="methods"]').click();
            });
        }
    };

    // =====================
    // Inicialización
    // =====================
    document.addEventListener('DOMContentLoaded', () => {
        renderPaymentHistory();
        renderPaymentMethods();
        renderPlans();
        renderInvoices();

        initBuyCourse();
        initPaySelectedCourse();

        lucide.createIcons();
        console.log('Pagos App initialized successfully');
    });

    // =====================
    // Export
    // =====================
    window.PagosApp = {
        refreshAllData: () => { 
            renderPaymentHistory(); 
            renderPaymentMethods(); 
            renderPlans(); 
            renderInvoices(); 
            lucide.createIcons(); 
        },
        paymentHistory, paymentMethods, subscriptionPlans
    };
