class ContractGenerator {
    constructor() {
        this.form = document.getElementById('contractForm');
        this.preview = document.getElementById('contractPreview');
        this.generatePDFBtn = document.getElementById('generatePDF');
        this.printPDFBtn = document.getElementById('printPDF');
        
        this.initializeEventListeners();
        this.setDefaultDate();
    }

    initializeEventListeners() {
        // Escuchar cambios en el formulario
        this.form.addEventListener('input', () => this.updatePreview());
        this.form.addEventListener('change', () => this.updatePreview());
        
        // Manejar campos personalizados
        document.getElementById('planAmount').addEventListener('change', (e) => {
            const customAmountField = document.getElementById('customAmount');
            if (e.target.value === 'custom') {
                customAmountField.style.display = 'block';
                customAmountField.required = true;
            } else {
                customAmountField.style.display = 'none';
                customAmountField.required = false;
                customAmountField.value = '';
            }
            this.updatePreview();
        });

        document.getElementById('planTerm').addEventListener('change', (e) => {
            const customTermField = document.getElementById('customTerm');
            if (e.target.value === 'custom') {
                customTermField.style.display = 'block';
                customTermField.required = true;
            } else {
                customTermField.style.display = 'none';
                customTermField.required = false;
                customTermField.value = '';
            }
            this.updatePreview();
        });

        // Botones de acción
        this.generatePDFBtn.addEventListener('click', () => this.generatePDF());
        this.printPDFBtn.addEventListener('click', () => this.printContract());
    }

    setDefaultDate() {
        const today = new Date();
        const formattedDate = today.toISOString().split('T')[0];
        document.getElementById('startDate').value = formattedDate;
        this.updatePreview();
    }

    getFormData() {
        const formData = new FormData(this.form);
        const data = {};
        
        for (let [key, value] of formData.entries()) {
            data[key] = value;
        }

        // Manejar campos personalizados
        if (data.planAmount === 'custom') {
            data.planAmount = parseFloat(data.customAmount) || 0;
        } else {
            data.planAmount = parseFloat(data.planAmount) || 0;
        }

        if (data.planTerm === 'custom') {
            data.planTerm = parseInt(data.customTerm) || 0;
        } else {
            data.planTerm = parseInt(data.planTerm) || 0;
        }

        return data;
    }

    calculatePayments(amount, startDate) {
        if (!amount || !startDate) return [];

        const start = new Date(startDate);
        const daysInMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
        const dayOfMonth = start.getDate();
        const daysRemaining = daysInMonth - dayOfMonth + 1;
        
        // Calcular cuota inicial proporcional
        const dailyAmount = amount / daysInMonth;
        const firstPayment = dailyAmount * daysRemaining;

        return {
            firstPayment: Math.round(firstPayment * 100) / 100,
            regularPayment: amount,
            daysInFirstMonth: daysRemaining,
            totalDays: daysInMonth
        };
    }

    generatePaymentSchedule(data) {
        if (!data.startDate || !data.planAmount || !data.planTerm) return [];

        const payments = this.calculatePayments(data.planAmount, data.startDate);
        const schedule = [];
        const startDate = new Date(data.startDate);

        // Primera cuota (proporcional)
        schedule.push({
            date: new Date(startDate),
            amount: payments.firstPayment,
            description: `Cuota inicial (${payments.daysInFirstMonth} días)`,
            isFirst: true
        });

        // Cuotas regulares
        for (let i = 1; i < data.planTerm; i++) {
            const paymentDate = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
            schedule.push({
                date: paymentDate,
                amount: payments.regularPayment,
                description: 'Cuota mensual',
                isFirst: false
            });
        }

        return schedule;
    }

    formatDate(date) {
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }

    isFormValid(data) {
        return data.clientName && 
               data.clientAddress && 
               data.planAmount > 0 && 
               data.planTerm > 0 && 
               data.startDate;
    }

    updatePreview() {
        const data = this.getFormData();
        const isValid = this.isFormValid(data);

        // Habilitar/deshabilitar botones
        this.generatePDFBtn.disabled = !isValid;
        this.printPDFBtn.disabled = !isValid;

        if (!isValid) {
            this.preview.innerHTML = `
                <div class="preview-placeholder">
                    <svg width="64" height="64" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                    </svg>
                    <p>Complete el formulario para ver la vista previa</p>
                </div>
            `;
            return;
        }

        const schedule = this.generatePaymentSchedule(data);
        const totalAmount = schedule.reduce((sum, payment) => sum + payment.amount, 0);

        this.preview.innerHTML = `
            <div class="preview-content">
                <div class="contract-header">
                    <h2>CONTRATO DE SERVICIOS BH</h2>
                    <div class="date">Generado el ${this.formatDate(new Date())}</div>
                </div>

                <div class="client-info">
                    <h3>Información del Cliente</h3>
                    <p><strong>Nombre:</strong> ${data.clientName}</p>
                    <p><strong>Dirección:</strong> ${data.clientAddress.replace(/\n/g, '<br>')}</p>
                </div>

                <div class="plan-details">
                    <h3>Detalles del Plan</h3>
                    <div class="plan-summary">
                        <div class="plan-item">
                            <div class="label">Monto Mensual</div>
                            <div class="value">${this.formatCurrency(data.planAmount)}</div>
                        </div>
                        <div class="plan-item">
                            <div class="label">Plazo</div>
                            <div class="value">${data.planTerm} meses</div>
                        </div>
                        <div class="plan-item">
                            <div class="label">Fecha Inicio</div>
                            <div class="value">${this.formatDate(new Date(data.startDate))}</div>
                        </div>
                        <div class="plan-item">
                            <div class="label">Total a Pagar</div>
                            <div class="value">${this.formatCurrency(totalAmount)}</div>
                        </div>
                    </div>
                </div>

                <div class="payment-schedule">
                    <h3>Cronograma de Pagos</h3>
                    <table class="payment-table">
                        <thead>
                            <tr>
                                <th>Fecha de Pago</th>
                                <th>Descripción</th>
                                <th>Monto</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${schedule.map(payment => `
                                <tr class="${payment.isFirst ? 'first-payment' : ''}">
                                    <td>${this.formatDate(payment.date)}</td>
                                    <td>${payment.description}</td>
                                    <td class="amount">${this.formatCurrency(payment.amount)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    generatePDF() {
        const data = this.getFormData();
        if (!this.isFormValid(data)) return;

        const schedule = this.generatePaymentSchedule(data);
        const totalAmount = schedule.reduce((sum, payment) => sum + payment.amount, 0);

        // Crear nuevo documento PDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Configuración de fuentes y colores
        const primaryColor = [37, 99, 235]; // #2563eb
        const textColor = [30, 41, 59]; // #1e293b
        const lightGray = [148, 163, 184]; // #94a3b8

        // Encabezado
        doc.setFontSize(24);
        doc.setTextColor(...primaryColor);
        doc.setFont(undefined, 'bold');
        doc.text('CONTRATO DE SERVICIOS BH', 105, 30, { align: 'center' });

        doc.setFontSize(12);
        doc.setTextColor(...lightGray);
        doc.setFont(undefined, 'normal');
        doc.text(`Generado el ${this.formatDate(new Date())}`, 105, 40, { align: 'center' });

        // Información del cliente
        let yPosition = 60;
        doc.setFontSize(16);
        doc.setTextColor(...textColor);
        doc.setFont(undefined, 'bold');
        doc.text('Información del Cliente', 20, yPosition);

        yPosition += 10;
        doc.setFontSize(12);
        doc.setFont(undefined, 'normal');
        doc.text(`Nombre: ${data.clientName}`, 20, yPosition);

        yPosition += 8;
        const addressLines = data.clientAddress.split('\n');
        doc.text(`Dirección: ${addressLines[0]}`, 20, yPosition);
        addressLines.slice(1).forEach((line, index) => {
            yPosition += 6;
            doc.text(`           ${line}`, 20, yPosition);
        });

        // Detalles del plan
        yPosition += 20;
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('Detalles del Plan', 20, yPosition);

        yPosition += 15;
        doc.setFontSize(12);
        doc.setFont(undefined, 'normal');

        // Crear tabla de resumen
        const summaryData = [
            ['Monto Mensual', this.formatCurrency(data.planAmount)],
            ['Plazo', `${data.planTerm} meses`],
            ['Fecha de Inicio', this.formatDate(new Date(data.startDate))],
            ['Total a Pagar', this.formatCurrency(totalAmount)]
        ];

        summaryData.forEach(([label, value]) => {
            doc.text(label + ':', 20, yPosition);
            doc.setFont(undefined, 'bold');
            doc.text(value, 80, yPosition);
            doc.setFont(undefined, 'normal');
            yPosition += 8;
        });

        // Cronograma de pagos
        yPosition += 15;
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('Cronograma de Pagos', 20, yPosition);

        yPosition += 15;
        doc.setFontSize(10);

        // Encabezados de tabla
        doc.setFont(undefined, 'bold');
        doc.text('Fecha de Pago', 20, yPosition);
        doc.text('Descripción', 70, yPosition);
        doc.text('Monto', 150, yPosition);

        yPosition += 5;
        doc.line(20, yPosition, 190, yPosition);
        yPosition += 8;

        // Filas de pagos
        doc.setFont(undefined, 'normal');
        schedule.forEach((payment, index) => {
            if (yPosition > 270) {
                doc.addPage();
                yPosition = 30;
            }

            const dateStr = this.formatDate(payment.date);
            const amountStr = this.formatCurrency(payment.amount);

            if (payment.isFirst) {
                doc.setFillColor(254, 243, 199); // #fef3c7
                doc.rect(19, yPosition - 6, 172, 12, 'F');
            }

            doc.text(dateStr, 20, yPosition);
            doc.text(payment.description, 70, yPosition);
            doc.text(amountStr, 150, yPosition);

            yPosition += 12;
        });

        // Guardar el PDF
        const fileName = `contrato-${data.clientName.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);
    }

    printContract() {
        const data = this.getFormData();
        if (!this.isFormValid(data)) return;

        // Crear ventana de impresión con el contenido de la vista previa
        const printContent = this.preview.innerHTML;
        const printWindow = window.open('', '_blank');
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Contrato - ${data.clientName}</title>
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        line-height: 1.6;
                        color: #1e293b;
                        margin: 0;
                        padding: 2rem;
                    }
                    .contract-header {
                        text-align: center;
                        margin-bottom: 2rem;
                        padding-bottom: 1rem;
                        border-bottom: 2px solid #2563eb;
                    }
                    .contract-header h2 {
                        font-size: 1.8rem;
                        color: #2563eb;
                        margin-bottom: 0.5rem;
                    }
                    .client-info {
                        margin-bottom: 2rem;
                        padding: 1.5rem;
                        background: #f8fafc;
                        border-radius: 8px;
                        border-left: 4px solid #2563eb;
                    }
                    .plan-summary {
                        display: grid;
                        grid-template-columns: repeat(2, 1fr);
                        gap: 1rem;
                        margin-bottom: 1.5rem;
                    }
                    .plan-item {
                        background: #f0f9ff;
                        padding: 1rem;
                        border-radius: 8px;
                        text-align: center;
                    }
                    .payment-table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 1rem;
                    }
                    .payment-table th,
                    .payment-table td {
                        padding: 0.75rem;
                        text-align: left;
                        border: 1px solid #e2e8f0;
                    }
                    .payment-table th {
                        background: #f8fafc;
                        font-weight: 600;
                    }
                    .first-payment {
                        background: #fef3c7;
                    }
                    @media print {
                        body { margin: 0; }
                    }
                </style>
            </head>
            <body>
                ${printContent}
            </body>
            </html>
        `);
        
        printWindow.document.close();
        printWindow.focus();
        
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
    }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new ContractGenerator();
});