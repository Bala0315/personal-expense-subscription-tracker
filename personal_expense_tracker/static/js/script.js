const PALETTE = [
  "#2563EB",
  "#0EA5E9",
  "#10B981",
  "#F59E0B",
  "#6366F1",
  "#EC4899",
  "#14B8A6",
  "#64748B",
];

function getChartPayload() {
  const el = document.getElementById("chart-payload");
  if (!el) return null;
  try {
    return JSON.parse(el.textContent || "{}");
  } catch {
    return null;
  }
}

function renderPie(canvasId, labels, values) {
  const ctx = document.getElementById(canvasId);
  if (!ctx || typeof Chart === "undefined") return;
  new Chart(ctx, {
    type: "pie",
    data: {
      labels: labels.length ? labels : ["No Data"],
      datasets: [
        {
          data: values.length ? values : [1],
          backgroundColor: values.length ? PALETTE : ["#E2E8F0"],
          borderWidth: 2,
          borderColor: "#FFFFFF",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "right" } },
    },
  });
}

function renderDoughnut(canvasId, budgetLimit, totalSpent) {
  const ctx = document.getElementById(canvasId);
  if (!ctx || typeof Chart === "undefined") return;
  const remaining = Math.max(0, budgetLimit - totalSpent);
  const isOver = totalSpent > budgetLimit && budgetLimit > 0;
  new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: isOver ? ["Budget Limit", "Over Budget"] : ["Spent", "Remaining"],
      datasets: [
        {
          data: isOver
            ? [budgetLimit, Number((totalSpent - budgetLimit).toFixed(2))]
            : [totalSpent, Number(remaining.toFixed(2))],
          backgroundColor: isOver ? ["#F59E0B", "#DC2626"] : ["#2563EB", "#E2E8F0"],
          borderWidth: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "68%",
      plugins: { legend: { position: "bottom" } },
    },
  });
}

function renderBar(canvasId, labels, values) {
  const ctx = document.getElementById(canvasId);
  if (!ctx || typeof Chart === "undefined") return;
  new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Monthly Expenses (₹)",
          data: values,
          backgroundColor: "#2563EB",
          borderRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: { y: { beginAtZero: true } },
    },
  });
}

function renderLine(canvasId, labels, values) {
  const ctx = document.getElementById(canvasId);
  if (!ctx || typeof Chart === "undefined") return;
  new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Daily Spending (₹)",
          data: values,
          borderColor: "#2563EB",
          backgroundColor: "rgba(37, 99, 235, 0.12)",
          fill: true,
          tension: 0.3,
          pointRadius: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: { y: { beginAtZero: true } },
    },
  });
}

function editSubscription(sub) {
  document.getElementById("sub_id").value = sub.id;
  document.getElementById("sub_name").value = sub.name;
  document.getElementById("sub_amount").value = sub.amount;
  document.getElementById("sub_cycle").value = sub.billing_cycle;
  document.getElementById("sub_category").value = sub.category;
  document.getElementById("sub_status").value = sub.status;
  document.getElementById("sub_start").value = sub.start_date;
  document.getElementById("sub_next").value = sub.next_payment_date;
  document.getElementById("subFormHeading").textContent = "Edit Subscription";
  document.getElementById("subSubmitBtn").textContent = "Update Subscription";
  document.getElementById("subCancelBtn").classList.remove("d-none");
}

function resetSubscriptionForm() {
  document.getElementById("subscriptionForm").reset();
  document.getElementById("sub_id").value = "";
  document.getElementById("subFormHeading").textContent = "Add Subscription";
  document.getElementById("subSubmitBtn").textContent = "Save Subscription";
  document.getElementById("subCancelBtn").classList.add("d-none");
}

document.addEventListener("DOMContentLoaded", () => {
  const data = getChartPayload();
  if (!data) return;

  renderPie("dashboardCategoryPie", data.categoryLabels || [], data.categoryValues || []);
  renderDoughnut("dashboardBudgetDoughnut", data.budgetLimit || 0, data.totalSpent || 0);
  renderDoughnut("budgetPageDoughnut", data.budgetLimit || 0, data.totalSpent || 0);

  renderPie("reportsPieChart", data.categoryLabels || [], data.categoryValues || []);
  renderBar("reportsBarChart", data.monthlyLabels || [], data.monthlyValues || []);
  renderDoughnut("reportsDoughnutChart", data.budgetLimit || 0, data.totalSpent || 0);
  renderLine("reportsLineChart", data.dailyLabels || [], data.dailyValues || []);
});
