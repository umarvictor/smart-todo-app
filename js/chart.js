// ======================================================
// chart.js
// Weekly Analytics Chart
// Shows tasks created and completed per day
// for the last 7 days using Chart.js
// ======================================================

let chartInstance = null;

function renderChart() {

    const canvas = document.getElementById("weeklyChart");
    if (!canvas) return;

    // ====================================================
    // BUILD 7-DAY DATE RANGE
    // ====================================================

    const labels    = [];
    const totals    = [];
    const completed = [];
    const today     = new Date();

    for (let i = 6; i >= 0; i--) {

        const d = new Date(today);
        d.setDate(today.getDate() - i);

        const dateStr = d.toISOString().split("T")[0];

        // Short label e.g. "Mon 9/4"
        const label = d.toLocaleDateString(undefined, {
            weekday: "short",
            month:   "numeric",
            day:     "numeric"
        });

        labels.push(label);

        // Tasks created on this day
        const tasks     = getTasks();
        const dayTasks  = tasks.filter(t => {
            const created = new Date(t.createdAt)
                .toISOString()
                .split("T")[0];
            return created === dateStr;
        });

        totals.push(dayTasks.length);
        completed.push(dayTasks.filter(t => t.completed).length);

    }


    // ====================================================
    // DATE RANGE LABEL
    // ====================================================

    const rangeEl = document.getElementById("chartRange");
    if (rangeEl) {

        const start = new Date(today);
        start.setDate(today.getDate() - 6);

        rangeEl.textContent =
            start.toLocaleDateString(undefined, {
                month: "short",
                day:   "numeric"
            }) +
            " – " +
            today.toLocaleDateString(undefined, {
                month: "short",
                day:   "numeric"
            });
    }


    // ====================================================
    // DESTROY PREVIOUS CHART INSTANCE
    // ====================================================
    // Must destroy before re-creating to avoid
    // Chart.js "canvas already in use" error

    if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
    }


    // ====================================================
    // CREATE CHART
    // ====================================================

    chartInstance = new Chart(canvas, {
        type: "bar",
        data: {
            labels,
            datasets: [
                {
                    label:           "Total Tasks",
                    data:            totals,
                    backgroundColor: "rgba(59,130,246,0.25)",
                    borderColor:     "rgba(59,130,246,0.7)",
                    borderWidth:     1,
                    borderRadius:    4
                },
                {
                    label:           "Completed",
                    data:            completed,
                    backgroundColor: "rgba(34,197,94,0.3)",
                    borderColor:     "rgba(34,197,94,0.7)",
                    borderWidth:     1,
                    borderRadius:    4
                }
            ]
        },
        options: {
            responsive:          true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color:    "#94a3b8",
                        font:     { size: 12 },
                        boxWidth: 12
                    }
                },
                tooltip: {
                    backgroundColor: "#1e293b",
                    titleColor:      "#f1f5f9",
                    bodyColor:       "#94a3b8",
                    borderColor:     "#334155",
                    borderWidth:     1
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: "#64748b",
                        font:  { size: 11 }
                    },
                    grid: {
                        color: "rgba(255,255,255,0.04)"
                    }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        color:    "#64748b",
                        font:     { size: 11 },
                        stepSize: 1
                    },
                    grid: {
                        color: "rgba(255,255,255,0.04)"
                    }
                }
            }
        }
    });

}


// ======================================================
// INITIALIZE ON PAGE LOAD
// ======================================================

document.addEventListener("DOMContentLoaded", () => {
    renderChart();
});

