let categoryChartInstance = null;
let expenseTrendInstance = null;
let savingsVsExpensesInstance = null;
let reportRefreshTimer = null;

function getReportsInitialData() {
    const scriptTag = document.getElementById('reports-data');
    if (!scriptTag) {
        return null;
    }

    try {
        return JSON.parse(scriptTag.textContent || '{}');
    } catch (error) {
        console.error('Failed to parse reports data:', error);
        return null;
    }
}

function formatCurrency(value) {
    const amount = Number(value || 0);
    return '₹' + amount.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

function setTextContent(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
}

function setProgressBarWidth(id, percent) {
    const element = document.getElementById(id);
    if (element) {
        const safePercent = Math.max(0, Number(percent || 0));
        element.style.setProperty('--bar-width', safePercent + '%');
    }
}

function destroyChart(instance) {
    if (instance) {
        instance.destroy();
    }
    return null;
}

function buildSelectOptions(selectElement, options, selectedValue) {
    if (!selectElement) {
        return;
    }

    const currentValue = selectedValue ?? selectElement.value ?? 'all';
    selectElement.innerHTML = '';

    options.forEach((option) => {
        const optionElement = document.createElement('option');
        optionElement.value = option.value;
        optionElement.textContent = option.label;
        if (option.value === currentValue) {
            optionElement.selected = true;
        }
        selectElement.appendChild(optionElement);
    });

    if (![...selectElement.options].some((option) => option.value === currentValue)) {
        selectElement.value = 'all';
    }
}

function updateFilterSelects(data) {
    const monthSelects = [document.getElementById('dateRange'), document.getElementById('chartMonth')].filter(Boolean);
    const categorySelects = [document.getElementById('typeFilter'), document.getElementById('chartCategory')].filter(Boolean);

    monthSelects.forEach((selectElement) => {
        buildSelectOptions(selectElement, [{ value: 'all', label: 'All Months' }, ...(data.available_months || [])], data.filters?.month || 'all');
    });

    categorySelects.forEach((selectElement) => {
        buildSelectOptions(selectElement, data.available_categories || [{ value: 'all', label: 'All Categories' }], data.filters?.category || 'all');
    });
}

function updateSummaryCards(data) {
    const summary = data.summary || {};
    const budget = data.budget || {};

    setTextContent('totalIncomeValue', formatCurrency(summary.income));
    setTextContent('totalExpenseValue', formatCurrency(summary.expense));
    setTextContent('netSavingsValue', formatCurrency(summary.balance));
    setTextContent('incomeSummaryValue', formatCurrency(summary.income));
    setTextContent('budgetValue', formatCurrency(budget.value));
    setTextContent('budgetPercent', `${Number(budget.percent || 0)}%`);
    setTextContent('budgetActualValue', formatCurrency(summary.expense));
    setTextContent('budgetActualPercent', `${Number(budget.percent || 0)}%`);
    setTextContent('budgetMessage', budget.message || '');

    setProgressBarWidth('incomeProgressBar', Math.min(Number(budget.percent || 0), 100));
    setProgressBarWidth('budgetProgressBar', budget.percent || 0);
    setProgressBarWidth('budgetActualProgressBar', budget.percent || 0);

    const incomeHint = document.getElementById('incomeSummaryHint');
    if (incomeHint) {
        const transactionCount = data.meta?.transaction_count ?? 0;
        incomeHint.innerHTML = `<i class="fas fa-sync-alt"></i> ${transactionCount} transactions tracked live`;
    }

    const headerParagraph = document.querySelector('.reports-header p');
    if (headerParagraph) {
        headerParagraph.textContent = 'Track your financial insights';
    }
}

function updateInsights(data) {
    const insightsList = document.getElementById('insightsList');
    if (!insightsList) {
        return;
    }

    const insights = data.insights || [];
    if (insights.length === 0) {
        insightsList.innerHTML = '<div style="background: rgba(139, 92, 246, 0.15); border: 1px solid rgba(167, 139, 250, 0.3); border-radius: 12px; padding: 15px; color: #cbd5e1;">Add transactions to see live insights.</div>';
        return;
    }

    insightsList.innerHTML = insights.map((insight, index) => {
        const title = index === 0
            ? `🔥 You spend most on ${insight.name}`
            : `📌 ${insight.name} is in your top spending`;

        return `
            <div style="background: rgba(139, 92, 246, 0.15); border: 1px solid rgba(167, 139, 250, 0.3); border-radius: 12px; padding: 15px;">
                <div style="font-size: 14px; color: #c4b5fd; font-weight: 600; margin-bottom: 4px;">${title}</div>
                <div style="font-size: 12px; color: #cbd5e1;">${formatCurrency(insight.amount)} spent</div>
            </div>
        `;
    }).join('');
}

function updateTransactionsTable(data) {
    const tableBody = document.querySelector('#transactionsTable tbody');
    if (!tableBody) {
        return;
    }

    const transactions = data.transactions || [];
    if (transactions.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 20px; color: #cbd5e1;">No transactions yet</td></tr>';
        return;
    }

    tableBody.innerHTML = transactions.map((transaction) => {
        const amountClass = transaction.type === 'Income' ? 'income' : 'expense';
        const amountPrefix = transaction.type === 'Income' ? '+ ' : '';
        return `
            <tr class="transaction-row">
                <td class="date-cell">${transaction.date || ''}</td>
                <td class="category-cell">${transaction.category || ''}</td>
                <td class="desc-cell">${transaction.type || ''}</td>
                <td class="amount-cell ${amountClass}">${amountPrefix}${formatCurrency(transaction.amount)}</td>
            </tr>
        `;
    }).join('');
}

function buildPalette(size) {
    const colors = ['#f472b6', '#8b5cf6', '#22c55e', '#38bdf8', '#f59e0b', '#fb7185', '#a78bfa', '#14b8a6'];
    return Array.from({ length: size }, (_, index) => colors[index % colors.length]);
}

function renderCharts(data) {
    const charts = data.charts || {};

    const categoryCtx = document.getElementById('categoryChart');
    categoryChartInstance = destroyChart(categoryChartInstance);
    if (categoryCtx) {
        categoryChartInstance = new Chart(categoryCtx, {
            type: 'bar',
            data: {
                labels: charts.category_labels || [],
                datasets: [{
                    label: 'Expense',
                    data: charts.category_values || [],
                    backgroundColor: buildPalette((charts.category_labels || []).length),
                    borderRadius: 8,
                    borderSkipped: false,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#cbd5e1',
                            font: { size: 12, weight: 'bold' },
                            padding: 15,
                            usePointStyle: true,
                        },
                    },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        titleColor: '#e0e7ff',
                        bodyColor: '#cbd5e1',
                        borderColor: 'rgba(139, 92, 246, 0.5)',
                        borderWidth: 1,
                    },
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: '#94a3b8' },
                        grid: { color: 'rgba(100, 116, 139, 0.2)' },
                    },
                    x: {
                        ticks: { color: '#94a3b8' },
                        grid: { color: 'rgba(100, 116, 139, 0.2)' },
                    },
                },
            },
        });
    }

    const expenseTrendCtx = document.getElementById('expenseTrendChart');
    expenseTrendInstance = destroyChart(expenseTrendInstance);
    if (expenseTrendCtx) {
        expenseTrendInstance = new Chart(expenseTrendCtx, {
            type: 'line',
            data: {
                labels: charts.month_labels || [],
                datasets: [{
                    label: 'Expense Trend',
                    data: charts.expense_trend || [],
                    borderColor: '#f472b6',
                    backgroundColor: 'rgba(244, 114, 182, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 6,
                    pointBackgroundColor: '#f472b6',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointHoverRadius: 8,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        titleColor: '#e0e7ff',
                        bodyColor: '#cbd5e1',
                        borderColor: 'rgba(139, 92, 246, 0.5)',
                        borderWidth: 1,
                    },
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: '#94a3b8' },
                        grid: { color: 'rgba(100, 116, 139, 0.2)' },
                    },
                    x: {
                        ticks: { color: '#94a3b8' },
                        grid: { color: 'rgba(100, 116, 139, 0.2)' },
                    },
                },
            },
        });
    }

    const savingsVsExpensesCtx = document.getElementById('savingsVsExpensesChart');
    savingsVsExpensesInstance = destroyChart(savingsVsExpensesInstance);
    if (savingsVsExpensesCtx) {
        savingsVsExpensesInstance = new Chart(savingsVsExpensesCtx, {
            type: 'bar',
            data: {
                labels: ['Savings', 'Expenses'],
                datasets: [{
                    label: 'Amount (₹)',
                    data: [Number(data.summary?.balance || 0), Number(data.summary?.expense || 0)],
                    backgroundColor: ['rgba(34, 197, 94, 0.75)', 'rgba(236, 72, 153, 0.75)'],
                    borderColor: ['rgba(34, 197, 94, 1)', 'rgba(236, 72, 153, 1)'],
                    borderWidth: 2,
                    borderRadius: 8,
                    maxBarThickness: 60,
                }],
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false },
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: '#a78bfa',
                            font: { weight: 'bold' },
                        },
                        grid: { color: 'rgba(139, 92, 246, 0.1)' },
                    },
                    x: {
                        ticks: {
                            color: '#e0e7ff',
                            font: { weight: 'bold' },
                        },
                        grid: { display: false },
                    },
                },
            },
        });
    }
}

function syncFilterPair(sourceId, value) {
    const groupMap = {
        dateRange: ['dateRange', 'chartMonth'],
        chartMonth: ['dateRange', 'chartMonth'],
        typeFilter: ['typeFilter', 'chartCategory'],
        chartCategory: ['typeFilter', 'chartCategory'],
    };

    const targets = groupMap[sourceId] || [];
    targets.forEach((targetId) => {
        const target = document.getElementById(targetId);
        if (target && target.value !== value) {
            target.value = value;
        }
    });
}

function getSelectedFilters() {
    const month = document.getElementById('dateRange')?.value || 'all';
    const category = document.getElementById('typeFilter')?.value || 'all';
    return { month, category };
}

async function loadReportsData() {
    const filters = getSelectedFilters();
    const params = new URLSearchParams();

    if (filters.month) {
        params.set('month', filters.month);
    }
    if (filters.category) {
        params.set('category', filters.category);
    }

    const response = await fetch(`/api/reports-data?${params.toString()}`, {
        headers: { 'Accept': 'application/json' },
        cache: 'no-store',
    });

    if (!response.ok) {
        throw new Error(`Failed to load reports data (${response.status})`);
    }

    const payload = await response.json();
    if (!payload.success) {
        throw new Error(payload.message || 'Failed to load reports data');
    }

    renderReports(payload.data);
}

function renderReports(data) {
    updateFilterSelects(data);
    updateSummaryCards(data);
    updateInsights(data);
    updateTransactionsTable(data);
    renderCharts(data);
    syncFilterPair('dateRange', data.filters?.month || 'all');
    syncFilterPair('typeFilter', data.filters?.category || 'all');

    const headerTitle = document.querySelector('.reports-header h2');
    if (headerTitle && data.meta?.generated_at) {
        const existingIcon = headerTitle.querySelector('span');
        headerTitle.innerHTML = `Reports <span style="font-size:1.2em;vertical-align:middle;">📊</span>`;
        void existingIcon;
    }
}

async function refreshReports() {
    try {
        await loadReportsData();
    } catch (error) {
        console.error(error);
    }
}

function applyFilters() {
    refreshReports();
}

function bindFilterEvents() {
    const filterIds = ['dateRange', 'typeFilter', 'chartMonth', 'chartCategory'];
    filterIds.forEach((id) => {
        const element = document.getElementById(id);
        if (!element) {
            return;
        }

        element.addEventListener('change', function() {
            syncFilterPair(id, this.value);
            refreshReports();
        });
    });
}

function bindDownloadPdf() {
    const downloadButton = document.getElementById('downloadPdfBtn');
    if (!downloadButton || !window.jspdf || !window.jspdf.jsPDF) {
        return;
    }

    downloadButton.addEventListener('click', function() {
        const pdf = new window.jspdf.jsPDF('p', 'mm', 'a4');
        pdf.text('Expense Report', 14, 16);
        if (typeof pdf.autoTable === 'function') {
            pdf.autoTable({
                html: '#transactionsTable',
                startY: 22,
                theme: 'grid',
                headStyles: { fillColor: [139, 92, 246] },
                styles: { fontSize: 10 },
                margin: { left: 14, right: 14 },
            });
        }
        pdf.save('expense_report.pdf');
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const initialData = getReportsInitialData();
    if (initialData) {
        renderReports(initialData);
    }

    bindFilterEvents();
    bindDownloadPdf();

    if (reportRefreshTimer) {
        clearInterval(reportRefreshTimer);
    }

    reportRefreshTimer = window.setInterval(() => {
        refreshReports();
    }, 15000);
});
