from flask import Flask, render_template, request, redirect, session, flash, get_flashed_messages, jsonify
from collections import defaultdict

import calendar as pycalendar
from datetime import datetime
from flask_pymongo import PyMongo
from urllib.parse import urlsplit, urlunsplit

import os
import sys
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)

# =============== PRODUCTION CONFIGURATION ===============
# Set Flask to production mode
app.config["ENV"] = os.getenv("FLASK_ENV", "production")
app.config["DEBUG"] = os.getenv("FLASK_DEBUG", "False").lower() == "true"

# Secret key - must be set in production
secret_key = os.getenv("SECRET_KEY")
if not secret_key:
    if app.config["DEBUG"]:
        # Development mode - default to a development key
        secret_key = "dev-secret-key-change-in-production"
    else:
        # Production mode - require SECRET_KEY to be set
        print("ERROR: SECRET_KEY environment variable not set. Production cannot proceed.")
        sys.exit(1)

app.secret_key = secret_key

# =============== MONGODB CONFIGURATION ===============
mongo_uri = os.getenv("MONGO_URI", "").strip()

if mongo_uri:
    # Parse URI to ensure database name is in path
    parts = urlsplit(mongo_uri)
    if not parts.path or parts.path == "/":
        # Flask-PyMongo needs a DB name in URI path, otherwise mongo.db is None.
        default_db_name = os.getenv("MONGO_DB_NAME", "expense_tracker")
        mongo_uri = urlunsplit((parts.scheme, parts.netloc, f"/{default_db_name}", parts.query, parts.fragment))
else:
    # Fallback to local MongoDB for development only
    if app.config["DEBUG"]:
        mongo_uri = "mongodb://localhost:27017/expense_tracker"
    else:
        print("ERROR: MONGO_URI environment variable not set. Production cannot proceed.")
        sys.exit(1)

app.config["MONGO_URI"] = mongo_uri

# Initialize MongoDB with error handling
try:
    mongo = PyMongo(app)
except Exception as e:
    # Check if this is a placeholder URI or invalid URI
    error_msg = str(e)
    if any(placeholder in mongo_uri for placeholder in ["YOUR_", "your_", "PLACEHOLDER", "placeholder", "example.com"]):
        # This is a placeholder URI - app is being tested with sample .env
        print("⚠️  WARNING: Invalid MongoDB URI detected (placeholder values found).")
        print("   Please update your .env file with actual MongoDB Atlas credentials.")
        print(f"   Error: {error_msg}")
        # Create a dummy PyMongo instance that will fail gracefully when accessed
        class DummyMongo:
            class DummyDB:
                def __getattr__(self, name):
                    raise RuntimeError("MongoDB not configured. Update .env with real MongoDB URI.")
            db = DummyDB()
        mongo = DummyMongo()
    else:
        # This is a real error, not a placeholder
        print(f"❌ CRITICAL: MongoDB connection error: {error_msg}")
        raise

# Register OTP blueprint after app and mongo are defined
from auth_otp.routes import otp_blueprint, set_mongo
set_mongo(mongo)
app.register_blueprint(otp_blueprint)

# ---------------- CONTEXT PROCESSOR FOR NOTIFICATIONS BADGE ----------------
@app.context_processor
def inject_unread_notifications():
    if 'user_id' in session:
        user_id = session['user_id']
        # Example: notifications collection with 'read' field
        unread_count = mongo.db.notifications.count_documents({'user_id': user_id, 'read': False})
        return dict(unread_notifications=unread_count)
    return dict(unread_notifications=0)


# ---------------- ANALYTICS ----------------
@app.route("/analytics")
def analytics():
    if "user_id" not in session:
        return redirect("/")


    user_id = session["user_id"]
    expenses = list(mongo.db.expenses.find({"user_id": user_id}))

    total_income = 0
    total_expense = 0
    monthly_income = {}
    monthly_expense = {}
    category_data = {}
    weekly_spending = defaultdict(float)

    for e in expenses:
        date_str = e.get("date", "")
        month_key = date_str[:7] if len(date_str) >= 7 else date_str
        amount = float(e.get("amount", 0))
        if e.get("type") == "Income":
            total_income += amount
            monthly_income[month_key] = monthly_income.get(month_key, 0) + amount
        else:
            total_expense += amount
            monthly_expense[month_key] = monthly_expense.get(month_key, 0) + amount
            # Category calculation for expense breakdown
            cat = e.get("category", "Other")
            category_data[cat] = category_data.get(cat, 0) + amount
            # Weekly spending (by weekday name)
            try:
                weekday = pycalendar.day_name[datetime.strptime(date_str, "%Y-%m-%d").weekday()]
                weekly_spending[weekday] += amount
            except Exception:
                pass

    # Ensure all weekdays are present
    week_days = list(pycalendar.day_name)
    weekly_spending_data = [weekly_spending.get(day, 0) for day in week_days]

    balance = total_income - total_expense

    return render_template(
        "dashboard/analytics.html",
        income=total_income,
        expense=total_expense,
        balance=balance,
        monthly_income=monthly_income,
        monthly_expense=monthly_expense,
        category_data=category_data,
        weekly_labels=week_days,
        weekly_spending=weekly_spending_data,
        category_labels=list(category_data.keys()),
        category_values=list(category_data.values()),
        income_vs_expense=[total_income, total_expense]
    )


# ---------------- END MONGODB CONFIG ----------------

# ---------------- LOGIN ----------------
@app.route("/", methods=["GET", "POST"])
def login():
    error = None
    


    if request.method == "POST":
        email = request.form.get("email", "").strip().lower()
        password = request.form.get("password", "").strip()

        if not email or not password:
            error = "Email and password are required!"
        else:
            user = mongo.db.users.find_one({"email": email})
            if user:
                stored_pw = user.get("password", "")
                import bcrypt
                # Convert stored password string to bytes for bcrypt
                if isinstance(stored_pw, str):
                    stored_pw_bytes = stored_pw.encode('utf-8')
                else:
                    stored_pw_bytes = bytes(stored_pw)
                if bcrypt.checkpw(password.encode('utf-8'), stored_pw_bytes):
                    session["user_id"] = str(user["_id"])
                    session["user_name"] = user["name"]
                    return redirect("/dashboard")
                else:
                    error = "Invalid email or password. Please try again or register."
            else:
                error = "Invalid email or password. Please try again or register."

    return render_template("auth/login.html", error=error)


# ---------------- REGISTER ----------------
@app.route("/register", methods=["GET", "POST"])
def register():
    error = None
    success = None
    

    if request.method == "POST":
        name = request.form.get("name", "").strip()
        email = request.form.get("email", "").strip()
        password = request.form.get("password", "").strip()

        if not name or not email or not password:
            error = "All fields are required!"
        elif len(password) < 6:
            error = "Password must be at least 6 characters long!"
        else:
            # Prevent duplicate email
            existing_user = mongo.db.users.find_one({"email": email})
            if existing_user:
                error = "Email already registered! Please login instead."
            else:
                import bcrypt
                # Hash the password before storing
                hashed_pw = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
                user_doc = {
                    "name": name,
                    "email": email,
                    "password": hashed_pw.decode('utf-8'),
                    "budget": 0,
                    "created_at": datetime.now()
                }
                mongo.db.users.insert_one(user_doc)
                success = "Account created successfully! Redirecting to login..."
                return redirect("/")

    return render_template("auth/register.html", error=error, success=success)

    return render_template("auth/register.html")


# ---------------- DASHBOARD ----------------
@app.route("/dashboard")
def dashboard():
    if "user_id" not in session:
        return redirect("/")

    user_id = session["user_id"]

    # Get all transactions from MongoDB
    expenses = list(mongo.db.expenses.find({"user_id": user_id}))

    total_income = 0
    total_expense = 0
    category_data = {}
    type_summary = {"Income": 0, "Expense": 0}
    monthly_income = {}
    monthly_expense = {}

    for e in expenses:
        # Monthly breakdown (extract YYYY-MM format)
        month_key = e.get("date", "")[:7] if len(e.get("date", "")) >= 7 else e.get("date", "")
        if e.get("type") == "Income":
            amount = float(e.get("amount", 0))
            total_income += amount
            type_summary["Income"] += amount
            monthly_income[month_key] = monthly_income.get(month_key, 0) + amount
        else:
            amount = float(e.get("amount", 0))
            total_expense += amount
            type_summary["Expense"] += amount
            monthly_expense[month_key] = monthly_expense.get(month_key, 0) + amount
            # Category calculation for expense breakdown
            cat = e.get("category", "Other")
            if cat in category_data:
                category_data[cat] += amount
            else:
                category_data[cat] = amount

    balance = total_income - total_expense

    # Get user and budget info from MongoDB
    from bson import ObjectId
    try:
        user_obj_id = ObjectId(user_id)
    except Exception:
        user_obj_id = user_id
    user = mongo.db.users.find_one({"_id": user_obj_id})
    if not user:
        budget = 0
    else:
        budget = user.get("budget", 0)

    budget_remaining = budget - total_expense
    percent_used = 0
    if budget > 0:
        percent_used = (total_expense / budget) * 100

    # --- Fetch upcoming bills for the user ---
    bills = list(mongo.db.bills.find({"user_id": user_id}))
    for bill in bills:
        bill['icon'] = bill.get('icon', 'fa-file-invoice')
        bill['status'] = bill.get('status', 'Pending').capitalize()
        bill['due_date'] = bill.get('due_date', '')

    return render_template(
        "dashboard/dashboard.html",
        income=total_income,
        expense=total_expense,
        balance=balance,
        expenses=expenses,
        category_data=category_data,
        type_summary=type_summary,
        budget=budget,
        budget_remaining=budget_remaining,
        percent_used=percent_used,
        monthly_income=monthly_income,
        monthly_expense=monthly_expense,
        bills=bills
    )
# ---------------- ADD BILL (EXAMPLE ROUTE) ----------------
@app.route("/add_bill", methods=["GET", "POST"])
def add_bill():
    if "user_id" not in session:
        return redirect("/")

    message = None
    error = None

    if request.method == "POST":
        try:
            name = request.form["name"]
            amount = float(request.form["amount"])
            due_date = request.form["due_date"]  # Expecting YYYY-MM-DD
            status = request.form.get("status", "Pending")
            icon = request.form.get("icon", "fa-file-invoice")

            bill_doc = {
                "user_id": session["user_id"],
                "name": name,
                "amount": amount,
                "due_date": due_date,
                "status": status,
                "icon": icon
            }
            mongo.db.bills.insert_one(bill_doc)
            message = "Bill added successfully!"
        except Exception as e:
            error = f"Error adding bill: {str(e)}"

    return render_template("dashboard/add_bill.html", message=message, error=error)


# ---------------- SET BUDGET ----------------
@app.route("/set_budget", methods=["POST"])
def set_budget():
    if "user_id" not in session:
        return redirect("/")

    budget = float(request.form["budget"])
    user_id = session["user_id"]
    mongo.db.users.update_one({"_id": mongo.db.users.codec_options.document_class()._id.__class__(user_id)}, {"$set": {"budget": budget}})
    return redirect("/dashboard")


# ---------------- ADD TRANSACTION ----------------
@app.route("/add", methods=["GET", "POST"])
def add_expense():
    if "user_id" not in session:
        return redirect("/")

    message = None
    error = None


    if request.method == "POST":
        try:
            amount = float(request.form["amount"])
            category = request.form["category"]
            type_ = request.form["type"]
            date = request.form["date"]
            description = request.form.get("description", "")

            expense_doc = {
                "user_id": session["user_id"],
                "amount": amount,
                "category": category,
                "type": type_,
                "date": date,
                "description": description
            }
            mongo.db.expenses.insert_one(expense_doc)
            message = "Transaction added successfully ✓"
        except Exception as e:
            error = f"Error adding transaction: {str(e)}"

    today = datetime.now().strftime("%Y-%m-%d")
    return render_template("dashboard/add_expense.html", today=today, message=message, error=error)


def _parse_amount(value):
    try:
        return float(value or 0)
    except Exception:
        return 0.0


def _extract_month_key(date_value):
    date_text = str(date_value or "").strip()
    if len(date_text) >= 7:
        return date_text[:7]
    return date_text


def _format_month_label(month_key):
    if not month_key:
        return "Unknown"
    try:
        return datetime.strptime(f"{month_key}-01", "%Y-%m-%d").strftime("%B %Y")
    except Exception:
        return month_key


def _build_reports_payload(user_id, month_filter="all", category_filter="all"):
    from bson import ObjectId

    try:
        user_obj_id = ObjectId(user_id)
    except Exception:
        user_obj_id = user_id

    user = mongo.db.users.find_one({"_id": user_obj_id})
    budget = _parse_amount(user.get("budget", 0)) if user else 0.0

    transactions = []
    month_keys = set()
    category_names = set()

    for doc in mongo.db.expenses.find({"user_id": user_id}):
        amount = _parse_amount(doc.get("amount", 0))
        raw_type = str(doc.get("type", "Expense") or "Expense").strip().lower()
        transaction_type = "Income" if raw_type == "income" else "Expense"
        category = str(doc.get("category", "Other") or "Other").strip()
        date_value = str(doc.get("date", ""))
        month_key = _extract_month_key(date_value)

        if month_key:
            month_keys.add(month_key)
        if transaction_type == "Expense" and category:
            category_names.add(category)

        transactions.append(
            {
                "id": str(doc.get("_id", "")),
                "date": date_value,
                "amount": amount,
                "category": category,
                "type": transaction_type,
                "description": doc.get("description", ""),
                "month_key": month_key,
            }
        )

    month_filter = (month_filter or "all").strip()
    category_filter = (category_filter or "all").strip()
    month_filter_key = month_filter.lower()
    category_filter_key = category_filter.lower()

    def matches_filters(item):
        if month_filter_key not in ("", "all", "all months") and item["month_key"] != month_filter:
            return False

        if category_filter_key in ("", "all", "all categories"):
            return True

        if category_filter_key == "income":
            return item["type"] == "Income"

        if category_filter_key == "expense":
            return item["type"] == "Expense"

        return str(item["category"]).strip().lower() == category_filter_key

    filtered_transactions = [item for item in transactions if matches_filters(item)]
    filtered_transactions.sort(key=lambda item: item["date"] or "", reverse=True)

    total_income = sum(item["amount"] for item in filtered_transactions if item["type"] == "Income")
    total_expense = sum(item["amount"] for item in filtered_transactions if item["type"] == "Expense")
    balance = total_income - total_expense

    monthly_income = defaultdict(float)
    monthly_expense = defaultdict(float)
    category_data = defaultdict(float)

    for item in filtered_transactions:
        month_key = item["month_key"]
        if item["type"] == "Income":
            monthly_income[month_key] += item["amount"]
        else:
            monthly_expense[month_key] += item["amount"]
            if item["category"]:
                category_data[item["category"]] += item["amount"]

    sorted_month_keys = sorted(month_keys)
    month_labels = [_format_month_label(month_key) for month_key in sorted_month_keys]
    expense_trend = [monthly_expense.get(month_key, 0) for month_key in sorted_month_keys]
    income_trend = [monthly_income.get(month_key, 0) for month_key in sorted_month_keys]
    sorted_categories = sorted(category_data.items(), key=lambda entry: entry[1], reverse=True)
    top_categories = [
        {"name": name, "amount": amount}
        for name, amount in sorted_categories[:3]
    ]

    budget_remaining = budget - total_expense
    budget_percent = round((total_expense / budget) * 100) if budget > 0 else 0
    budget_status = "danger" if budget > 0 and total_expense > budget else "safe"

    budget_message = "Set a budget in Settings to track spending live."
    if budget > 0:
        if budget_remaining >= 0:
            budget_message = f"You are within budget by ₹{budget_remaining:,.0f}."
        else:
            budget_message = f"You exceeded your budget by ₹{abs(budget_remaining):,.0f}."

    category_options = ["all", "Income", "Expense", *sorted(category_names)]

    return {
        "summary": {
            "income": round(total_income, 2),
            "expense": round(total_expense, 2),
            "balance": round(balance, 2),
        },
        "budget": {
            "value": round(budget, 2),
            "remaining": round(budget_remaining, 2),
            "percent": int(budget_percent),
            "status": budget_status,
            "message": budget_message,
        },
        "filters": {
            "month": month_filter,
            "category": category_filter,
        },
        "available_months": [
            {"value": month_key, "label": _format_month_label(month_key)}
            for month_key in sorted(month_keys, reverse=True)
        ],
        "available_categories": [
            {"value": category, "label": ("All Categories" if category == "all" else category)}
            for category in category_options
        ],
        "charts": {
            "month_labels": month_labels,
            "expense_trend": expense_trend,
            "income_trend": income_trend,
            "category_labels": [name for name, _amount in sorted_categories],
            "category_values": [amount for _name, amount in sorted_categories],
        },
        "transactions": [
            {
                "id": item["id"],
                "date": item["date"],
                "category": item["category"],
                "type": item["type"],
                "amount": round(item["amount"], 2),
                "description": item["description"],
            }
            for item in filtered_transactions[:10]
        ],
        "insights": top_categories,
        "meta": {
            "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "transaction_count": len(filtered_transactions),
        },
    }


# ---------------- DELETE TRANSACTION ----------------
@app.route("/delete/<int:id>")
def delete_expense(id):
    if "user_id" not in session:
        return redirect("/")

    # Secure delete (only own data)
    user_id = session["user_id"]
    mongo.db.expenses.delete_one({"_id": id, "user_id": user_id})
    return redirect("/dashboard")


# ---------------- REPORTS ----------------
@app.route("/reports")
def reports():
    if "user_id" not in session:
        return redirect("/")

    user_id = session["user_id"]
    month_filter = request.args.get("month", "all")
    category_filter = request.args.get("category", "all")
    reports_data = _build_reports_payload(user_id, month_filter, category_filter)

    return render_template(
        "dashboard/reports.html",
        reports_data=reports_data
    )


@app.route("/api/reports-data")
def reports_data_api():
    if "user_id" not in session:
        return jsonify({"success": False, "message": "Not authorized"}), 401

    user_id = session["user_id"]
    month_filter = request.args.get("month", "all")
    category_filter = request.args.get("category", "all")
    payload = _build_reports_payload(user_id, month_filter, category_filter)
    return jsonify({"success": True, "data": payload})


# ---------------- CALENDAR ----------------

@app.route("/calendar")
def calendar():
    if "user_id" not in session:
        return redirect("/")


    user_id = session["user_id"]
    expenses = list(mongo.db.expenses.find({"user_id": user_id}))

    total_income = 0
    total_expense = 0

    for e in expenses:
        amount = float(e.get("amount", 0))
        if e.get("type") == "Income":
            total_income += amount
        else:
            total_expense += amount

    balance = total_income - total_expense

    return render_template(
        "dashboard/calendar.html",
        income=total_income,
        expense=total_expense,
        balance=balance
    )


# ---------------- SETTINGS ----------------
@app.route("/settings", methods=["GET", "POST"])
def settings():
    if "user_id" not in session:
        return redirect("/")

    user_id = session["user_id"]
    from bson import ObjectId
    try:
        user_obj_id = ObjectId(user_id)
    except Exception:
        user_obj_id = user_id
    user = mongo.db.users.find_one({"_id": user_obj_id})
    error = None
    success = None

    if request.method == "POST":
        try:
            budget = float(request.form.get("budget", 0))
            if budget < 0:
                error = "Budget cannot be negative!"
            else:
                mongo.db.users.update_one({"_id": user_obj_id}, {"$set": {"budget": budget}})
                success = f"Budget updated to ₹{budget}!"
        except ValueError:
            error = "Please enter a valid number for budget!"

    # Calculate current month expenses
    from datetime import date
    current_month = str(date.today())[:7]  # YYYY-MM format
    current_month_expenses = list(mongo.db.expenses.find({"user_id": user_id, "type": "Expense"}))
    current_month_expense = sum(
        float(e.get("amount", 0)) for e in current_month_expenses
        if e.get("date", "").startswith(current_month)
    )
    user_budget = user.get("budget", 0) if user else 0
    remaining = user_budget - current_month_expense
    percentage = (current_month_expense / user_budget * 100) if user_budget > 0 else 0

    return render_template(
        "dashboard/settings.html",
        user_budget=user_budget,
        current_month_expense=current_month_expense,
        remaining=remaining,
        percentage=percentage,
        error=error,
        success=success
    )


# ---------------- BUDGET NOTIFICATION DEMO ----------------
@app.route("/budget-notification-demo")
def budget_notification_demo():
    return render_template("budget-notification-demo.html")


# ---------------- PROFILE ----------------
@app.route("/profile")
def profile():
    if "user_id" not in session:
        return redirect("/")
    
    user_id = session["user_id"]
    from bson import ObjectId
    try:
        user_obj_id = ObjectId(user_id)
    except Exception:
        user_obj_id = user_id
    user = mongo.db.users.find_one({"_id": user_obj_id})
    # Get user statistics
    expenses = list(mongo.db.expenses.find({"user_id": user_id}))
    total_transactions = len(expenses)
    return render_template(
        "dashboard/profile.html",
        user=user,
        total_transactions=total_transactions
    )


# ---------------- ACCOUNT SETTINGS ----------------
@app.route("/account-settings", methods=["GET", "POST"])
def account_settings():
    if "user_id" not in session:
        return redirect("/")
    
    user_id = session["user_id"]
    from bson import ObjectId
    try:
        user_obj_id = ObjectId(user_id)
    except Exception:
        user_obj_id = user_id
    user = mongo.db.users.find_one({"_id": user_obj_id})
    error = None
    success = None

    if request.method == "POST":
        try:
            name = request.form.get("name", "").strip()
            if not name:
                error = "Name cannot be empty!"
            elif len(name) < 2:
                error = "Name must be at least 2 characters!"
            else:
                mongo.db.users.update_one({"_id": user_obj_id}, {"$set": {"name": name}})
                success = f"Account updated successfully!"
                user = mongo.db.users.find_one({"_id": user_obj_id})
        except Exception as e:
            error = f"Error updating account: {str(e)}"

    return render_template(
        "dashboard/account-settings.html",
        user=user,
        error=error,
        success=success
    )


# ---------------- BILLING ----------------
@app.route("/billing")
def billing():
    if "user_id" not in session:
        return redirect("/")
    
    user_id = session["user_id"]
    from bson import ObjectId
    try:
        user_obj_id = ObjectId(user_id)
    except Exception:
        user_obj_id = user_id
    user = mongo.db.users.find_one({"_id": user_obj_id})
    return render_template("dashboard/billing.html", user=user)




# ---------------- LOGOUT ----------------
@app.route("/logout")
def logout():
    session.clear()
    return redirect("/")



# ---------------- PAYMENT REMINDERS API (MongoDB) ----------------
from bson import ObjectId

@app.route("/api/reminders")
def get_reminders():
    if "user_id" not in session:
        return jsonify({"success": False, "message": "Not authorized"}), 401
    user_id = session["user_id"]
    reminders = list(mongo.db.payment_reminders.find({"user_id": user_id}))
    reminders_list = []
    for r in reminders:
        reminders_list.append({
            'id': str(r.get('_id')),
            'title': r.get('title'),
            'amount': r.get('amount'),
            'category': r.get('category'),
            'reminder_date': r.get('reminder_date'),
            'description': r.get('description'),
            'is_paid': r.get('is_paid', False)
        })
    return jsonify({"success": True, "reminders": reminders_list})

@app.route("/api/reminders/add", methods=["POST"])
def add_reminder():
    if "user_id" not in session:
        return jsonify({"success": False, "message": "Not authorized"}), 401
    try:
        data = request.get_json()
        user_id = session["user_id"]
        reminder_doc = {
            "user_id": user_id,
            "title": data.get('title'),
            "amount": float(data.get('amount', 0)),
            "category": data.get('category', 'Bills'),
            "reminder_date": data.get('reminder_date'),
            "description": data.get('description', ''),
            "is_paid": False
        }
        mongo.db.payment_reminders.insert_one(reminder_doc)
        return jsonify({"success": True, "message": "Reminder added successfully"})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 400

@app.route("/api/reminders/<reminder_id>/mark-paid", methods=["POST"])
def mark_reminder_paid(reminder_id):
    if "user_id" not in session:
        return jsonify({"success": False, "message": "Not authorized"}), 401
    try:
        user_id = session["user_id"]
        result = mongo.db.payment_reminders.update_one(
            {"_id": ObjectId(reminder_id), "user_id": user_id},
            {"$set": {"is_paid": True}}
        )
        if result.matched_count == 0:
            return jsonify({"success": False, "message": "Reminder not found"}), 404
        return jsonify({"success": True, "message": "Marked as paid"})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 400

@app.route("/api/reminders/<reminder_id>/delete", methods=["POST"])
def delete_reminder(reminder_id):
    if "user_id" not in session:
        return jsonify({"success": False, "message": "Not authorized"}), 401
    try:
        user_id = session["user_id"]
        result = mongo.db.payment_reminders.delete_one({"_id": ObjectId(reminder_id), "user_id": user_id})
        if result.deleted_count == 0:
            return jsonify({"success": False, "message": "Reminder not found"}), 404
        return jsonify({"success": True, "message": "Reminder deleted"})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 400


# =============== APP STARTUP ===============
# Note: This is for development use only. 
# In production, use: gunicorn -w 4 -b 0.0.0.0:$PORT wsgi:app

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    
    # Only use Flask development server for local development
    if app.config["DEBUG"]:
        app.run(host="127.0.0.1", port=port, debug=True)
    else:
        print("WARNING: Running Flask development server in production mode.")
        print("For production, use: gunicorn -w 4 -b 0.0.0.0:5000 wsgi:app")
        app.run(host="0.0.0.0", port=port, debug=False)