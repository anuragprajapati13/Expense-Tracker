// Dashboard related JavaScript

let pieChartInstance = null;
let barChartInstance = null;

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded');
    console.log('Category Data:', window.categoryData);
    
    setTimeout(() => {
        initializeCharts();
    }, 200);
});

function initializeCharts() {
    initializePieChart();
    initializeBarChart();
}

function initializePieChart() {
    const pieCtx = document.getElementById('pieChart');
    if (!pieCtx) {
        console.log('Pie Chart Canvas not found');
        return;
    }
    
    console.log('Initializing Pie Chart...');
    const categoryData = window.categoryData || {};
    const categories = Object.keys(categoryData);
    const amounts = Object.values(categoryData);
    
    console.log('Categories:', categories);
    console.log('Amounts:', amounts);
    
    if (categories.length === 0) {
        console.log('No category data available');
        return;
    }
    
    const colors = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8B5CF6', '#ec4899', '#14b8a6', '#f97316'];
    
    // Destroy previous instance if exists
    if (pieChartInstance) {
        pieChartInstance.destroy();
    }
    
    pieChartInstance = new Chart(pieCtx, {
        type: 'doughnut',
        data: {
            labels: categories,
            datasets: [{
                data: amounts,
                backgroundColor: colors.slice(0, categories.length),
                borderColor: '#0f172a',
                borderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        font: {
                            size: 12
                        },
                        padding: 15,
                        usePointStyle: true,
                        color: '#cbd5e1'
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return '₹' + context.parsed + ' (' + Math.round((context.parsed / context.dataset.data.reduce((a, b) => a + b, 0) * 100)) + '%)';
                        }
                    }
                }
            }
        }
    });
}

function initializeBarChart() {
    const barCtx = document.getElementById('expenseChart');
    if (!barCtx) return;
    
    // Destroy previous instance if exists
    if (barChartInstance) {
        barChartInstance.destroy();
    }

    // Get real monthly data from window object
    const monthlyIncomeData = window.monthlyIncome || {};
    const monthlyExpenseData = window.monthlyExpense || {};
    
    // Get all unique months and sort them
    const allMonths = new Set([...Object.keys(monthlyIncomeData), ...Object.keys(monthlyExpenseData)]);
    const sortedMonths = Array.from(allMonths).sort();
    
    // Format month labels
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formatMonthLabel = (dateStr) => {
        try {
            const [year, month] = dateStr.split('-');
            const monthIndex = parseInt(month) - 1;
            return `${monthNames[monthIndex]} ${year}`;
        } catch (e) {
            return dateStr;
        }
    };
    
    // If no data, use empty arrays
    const labels = sortedMonths.length > 0 
        ? sortedMonths.map(formatMonthLabel)
        : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    
    const incomeValues = sortedMonths.map(month => monthlyIncomeData[month] || 0);
    const expenseValues = sortedMonths.map(month => monthlyExpenseData[month] || 0);
    
    barChartInstance = new Chart(barCtx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Income',
                    data: incomeValues,
                    backgroundColor: '#3b82f6',
                    borderRadius: 6,
                    borderSkipped: false
                },
                {
                    label: 'Expenses',
                    data: expenseValues,
                    backgroundColor: '#f59e0b',
                    borderRadius: 6,
                    borderSkipped: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        font: {
                            size: 12
                        },
                        padding: 15,
                        usePointStyle: true,
                        color: '#cbd5e1'
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ₹' + context.parsed.y;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(139, 92, 246, 0.1)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#94a3b8',
                        callback: function(value) {
                            return '₹' + value/1000 + 'k';
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#94a3b8',
                        font: {
                            size: 12,
                            weight: 'bold'
                        }
                    }
                }
            }
        }
    });
}
