from flask import Blueprint, render_template, request, jsonify

expense_bp = Blueprint('expenses', __name__, url_prefix='/expenses')


from flask import session, current_app
from collections import defaultdict
from datetime import datetime

@expense_bp.route('/dashboard')
def dashboard():
    if 'user_id' not in session:
        return render_template('dashboard/dashboard.html')  # Or redirect to login

    user_id = session['user_id']
    mongo = current_app.extensions['pymongo']
    expenses = list(mongo.db.expenses.find({'user_id': user_id}))
    bills = list(mongo.db.bills.find({'user_id': user_id})) if 'bills' in mongo.db.list_collection_names() else []

    # Calculate stats
    balance = 0
    income = 0
    expense = 0
    budget_remaining = 0
    percent_used = 0
    category_data = defaultdict(float)
    recent_expenses = []

    for e in expenses:
        amount = float(e.get('amount', 0))
        if e.get('type') == 'Income':
            income += amount
            balance += amount
        else:
            expense += amount
            balance -= amount
            cat = e.get('category', 'Other')
            category_data[cat] += amount

    # Example: Assume a fixed budget for demo, or fetch from user profile/settings
    budget = 12000
    budget_remaining = budget - expense
    percent_used = int((expense / budget) * 100) if budget else 0

    # Sort expenses by date (descending) for recent transactions
    recent_expenses = sorted(expenses, key=lambda x: x.get('date', ''), reverse=True)

    # Prepare bills (if any)
    bills = sorted(bills, key=lambda x: x.get('due_date', '')) if bills else []

    return render_template(
        'dashboard/dashboard.html',
        balance=balance,
        income=income,
        expense=expense,
        budget_remaining=budget_remaining,
        percent_used=percent_used,
        category_data=dict(category_data),
        expenses=recent_expenses,
        bills=bills
    )

@expense_bp.route('/api/add', methods=['POST'])
def add_expense():
    # Handle adding expense via API
    pass

@expense_bp.route('/api/delete/<int:expense_id>', methods=['DELETE'])
def delete_expense(expense_id):
    # Handle deleting expense via API
    pass

@expense_bp.route('/api/list', methods=['GET'])
def list_expenses():
    # Handle listing expenses via API
    pass
