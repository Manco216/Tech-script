document.addEventListener("DOMContentLoaded", () => {
    cargarKpisInstructor();
    cargarDetalleDiplomados();

    const exportBtn = document.getElementById("btnExportPDF");
    if (exportBtn) {
        exportBtn.addEventListener("click", exportarPDF);
    }
});

// ============================
// KPIs PRINCIPALES DEL INSTRUCTOR
// ============================
async function cargarKpisInstructor() {
    try {
        const res = await fetch("/instructor/api/reportes/kpis");
        const data = await res.json();

        document.getElementById("kpi-estudiantes").textContent = data.total_estudiantes.toLocaleString();
        document.getElementById("kpi-finalizados").textContent = data.finalizados.toLocaleString();
        document.getElementById("kpi-ingresos").textContent = "$" + data.ingresos_totales.toLocaleString();
        document.getElementById("kpi-finalizacion").textContent = data.tasa_finalizacion + "%";
    } catch (err) {
        console.error("Error cargando KPIs del instructor:", err);
    }
}

// ============================
// DETALLE POR DIPLOMADO
// ============================
async function cargarDetalleDiplomados() {
    try {
        const res = await fetch("/instructor/api/reportes/detalle-diplomados");
        const data = await res.json();

        const ctx = document.getElementById("chartIngresos").getContext("2d");

        new Chart(ctx, {
            type: "bar",
            data: {
                labels: data.map(d => d.diplomado),
                datasets: [
                    {
                        label: "Ingresos ($)",
                        data: data.map(d => d.ingresos),
                        backgroundColor: "rgba(34,197,94,0.6)",
                        borderColor: "#16a34a",
                        borderWidth: 1
                    },
                    {
                        label: "Finalizados",
                        data: data.map(d => d.finalizados),
                        backgroundColor: "rgba(59,130,246,0.4)",
                        borderColor: "#3b82f6",
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                scales: { y: { beginAtZero: true } },
                plugins: {
                    legend: { position: "bottom" }
                }
            }
        });
    } catch (err) {
        console.error("Error cargando detalle de diplomados:", err);
    }
}

// ============================
// EXPORTAR PDF
// ============================
function exportarPDF() {
    const element = document.getElementById("reportContent");
    const fecha = new Date().toLocaleDateString("es-CO");

    const opciones = {
        margin: [10, 10, 10, 10],
        filename: `Reporte_Instructor_${fecha}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
    };

    html2pdf().set(opciones).from(element).save();
}
