import csv
import io
import os
import secrets
import sqlite3
from datetime import date, datetime
from flask import (
    Flask,
    Response,
    flash,
    jsonify,
    redirect,
    render_template,
    request,
    url_for,
)

app = Flask(__name__)
app.secret_key = os.environ.get("FLASK_SECRET_KEY") or secrets.token_hex(32)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "database.db")

CATEGORIES = [
    "Food",
    "Travel",
    "Shopping",
    "Bills",
    "Education",
    "Entertainment",
    "Healthcare",
    "Others",
]

PAYMENT_METHODS = [
    "UPI",
    "Debit Card",
    "Credit Card",
    "Cash",
    "Net Banking",
]

BILLING_CYCLES = ["Monthly", "Quarterly", "Yearly"]
SUBSCRIPTION_STATUSES = ["Active", "Cancelled"]


def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Create SQLite tables and seed sample demonstration data if empty."""
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS expenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            amount REAL NOT NULL CHECK(amount > 0),
            category TEXT NOT NULL,
            date TEXT NOT NULL,
            payment_method TEXT NOT NULL,
            description TEXT DEFAULT ''
        )
        """
    )

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS subscriptions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            amount REAL NOT NULL CHECK(amount > 0),
            category TEXT NOT NULL,
            billing_cycle TEXT NOT NULL,
            start_date TEXT NOT NULL,
            next_payment_date TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'Active'
        )
        """
    )

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS budgets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            month INTEGER NOT NULL CHECK(month BETWEEN 1 AND 12),
            year INTEGER NOT NULL CHECK(year BETWEEN 2000 AND 2100),
            budget_limit REAL NOT NULL CHECK(budget_limit > 0),
            UNIQUE(month, year)
        )
        """
    )

    today = date.today()
    cur_year, cur_month = today.year, today.month

    def ym_day(month_offset: int, day: int) -> str:
        m = cur_month + month_offset
        y = cur_year
        while m <= 0:
            m += 12
            y -= 1
        while m > 12:
            m -= 12
            y += 1
        safe_day = min(day, 28)
        return f"{y:04d}-{m:02d}-{safe_day:02d}"

    # Seed sample expenses only when table is empty
    expense_count = cur.execute("SELECT COUNT(*) FROM expenses").fetchone()[0]
    if expense_count == 0:
        sample_expenses = [
            ("Fresh Market Groceries", 3450.00, "Food", ym_day(0, 2), "UPI", "Weekly produce and pantry essentials"),
            ("Metro Transit Pass", 1200.00, "Travel", ym_day(0, 3), "UPI", "Monthly city commuter pass"),
            ("Electricity & Water Utility", 2850.00, "Bills", ym_day(0, 5), "Net Banking", "Apartment electricity and water bill"),
            ("Campus Textbook Bundle", 1850.00, "Education", ym_day(0, 7), "Credit Card", "Database systems and algorithms references"),
            ("Coffee & Lunch with Friends", 980.00, "Food", ym_day(0, 9), "UPI", "Weekend cafe lunch"),
            ("Running Shoes", 3299.00, "Shopping", ym_day(0, 11), "Credit Card", "Daily jogging sneakers"),
            ("Pharmacy Prescription", 640.00, "Healthcare", ym_day(0, 13), "Debit Card", "Vitamins and cold relief"),
            ("Weekend Cinema Tickets", 860.00, "Entertainment", ym_day(0, 15), "UPI", "Evening movie tickets and snacks"),
            ("Airport Cab Fare", 1150.00, "Travel", ym_day(0, 17), "Credit Card", "Drop-off ride to station"),
            ("High-Speed Broadband", 999.00, "Bills", ym_day(0, 19), "Net Banking", "Home fiber internet plan"),
            ("Grocery Restock", 3120.00, "Food", ym_day(-1, 6), "Debit Card", "Monthly grocery staples"),
            ("Train Tickets", 1650.00, "Travel", ym_day(-1, 14), "UPI", "Intercity weekend return fare"),
            ("Online Course Certification", 2499.00, "Education", ym_day(-1, 19), "Credit Card", "Python web engineering course"),
            ("Utility Bill", 2740.00, "Bills", ym_day(-1, 22), "Net Banking", "Monthly electricity usage"),
            ("Winter Jacket", 3800.00, "Shopping", ym_day(-2, 8), "Credit Card", "Seasonal apparel purchase"),
            ("Dental Checkup", 1500.00, "Healthcare", ym_day(-2, 16), "Debit Card", "Routine cleaning visit"),
            ("Supermarket Run", 3250.00, "Food", ym_day(-2, 21), "UPI", "Household food and snacks"),
            ("Concert Tickets", 2200.00, "Entertainment", ym_day(-3, 12), "Credit Card", "Local live music evening"),
            ("Utility & Mobile Plan", 2680.00, "Bills", ym_day(-3, 20), "Net Banking", "Combined monthly bills"),
            ("Family Dinner", 2450.00, "Food", ym_day(-4, 15), "Debit Card", "Weekend dinner outing"),
        ]
        cur.executemany(
            """
            INSERT INTO expenses (title, amount, category, date, payment_method, description)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            sample_expenses,
        )

    # Seed sample subscriptions only when table is empty
    sub_count = cur.execute("SELECT COUNT(*) FROM subscriptions").fetchone()[0]
    if sub_count == 0:
        sample_subscriptions = [
            ("Netflix Standard", 499.00, "Entertainment", "Monthly", ym_day(-5, 10), ym_day(0, 26), "Active"),
            ("Spotify Student", 59.00, "Entertainment", "Monthly", ym_day(-6, 4), ym_day(0, 24), "Active"),
            ("Amazon Prime", 1499.00, "Shopping", "Yearly", ym_day(-3, 15), ym_day(9, 15), "Active"),
            ("Cloud Storage 200GB", 630.00, "Bills", "Quarterly", ym_day(-2, 1), ym_day(1, 1), "Active"),
            ("Coursera Plus", 2199.00, "Education", "Monthly", ym_day(-4, 18), ym_day(0, 28), "Active"),
            ("Fitness App Pro", 499.00, "Healthcare", "Monthly", ym_day(-7, 12), ym_day(-1, 12), "Cancelled"),
        ]
        cur.executemany(
            """
            INSERT INTO subscriptions (name, amount, category, billing_cycle, start_date, next_payment_date, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            sample_subscriptions,
        )

    # Seed default budget for current month
    budget_exists = cur.execute(
        "SELECT COUNT(*) FROM budgets WHERE month = ? AND year = ?",
        (cur_month, cur_year),
    ).fetchone()[0]
    if budget_exists == 0:
        cur.execute(
            "INSERT INTO budgets (month, year, budget_limit) VALUES (?, ?, ?)",
            (cur_month, cur_year, 25000.00),
        )

    conn.commit()
    conn.close()


def normalize_monthly_cost(amount: float, billing_cycle: str) -> float:
    """Convert any billing cycle into its equivalent monthly cost without duplicating transactions."""
    if billing_cycle == "Quarterly":
        return amount / 3.0
    if billing_cycle == "Yearly":
        return amount / 12.0
    return amount


def is_valid_iso_date(value: str) -> bool:
    try:
        datetime.strptime(value, "%Y-%m-%d")
        return True
    except (ValueError, TypeError):
        return False


def sanitize_csv_cell(value) -> str:
    """Protect exported CSV cells from spreadsheet formula interpretation in Excel."""
    text = "" if value is None else str(value)
    if text and text[0] in ("=", "+", "-", "@", "\t", "\r"):
        return "'" + text
    return text


def get_financial_snapshot(month: int, year: int):
    """Compute monthly totals, active subscription costs, budget status, and chart datasets."""
    conn = get_db_connection()
    ym_prefix = f"{year:04d}-{month:02d}"

    # Monthly expense sum & count via SQL aggregation
    exp_row = conn.execute(
        """
        SELECT COALESCE(SUM(amount), 0) AS total, COUNT(*) AS tx_count
        FROM expenses
        WHERE strftime('%Y-%m', date) = ?
        """,
        (ym_prefix,),
    ).fetchone()
    monthly_expenses = round(float(exp_row["total"]), 2)
    tx_count = int(exp_row["tx_count"])

    # Active subscriptions normalized to monthly equivalent
    active_subs = conn.execute(
        """
        SELECT * FROM subscriptions
        WHERE status = 'Active'
        ORDER BY next_payment_date ASC
        """
    ).fetchall()
    monthly_subscription_cost = round(
        sum(normalize_monthly_cost(float(s["amount"]), s["billing_cycle"]) for s in active_subs),
        2,
    )

    total_monthly_spending = round(monthly_expenses + monthly_subscription_cost, 2)

    # Monthly budget limit
    budget_row = conn.execute(
        "SELECT budget_limit FROM budgets WHERE month = ? AND year = ?",
        (month, year),
    ).fetchone()
    budget_limit = round(float(budget_row["budget_limit"]), 2) if budget_row else 0.0
    remaining_budget = round(budget_limit - total_monthly_spending, 2)
    usage_pct = round((total_monthly_spending / budget_limit) * 100, 1) if budget_limit > 0 else 0.0

    # Category breakdown for Pie Chart
    cat_rows = conn.execute(
        """
        SELECT category, ROUND(SUM(amount), 2) AS total
        FROM expenses
        WHERE strftime('%Y-%m', date) = ?
        GROUP BY category
        ORDER BY total DESC
        """,
        (ym_prefix,),
    ).fetchall()

    # Monthly expenses trend for Bar Chart (last 6 months)
    monthly_rows = conn.execute(
        """
        SELECT strftime('%Y-%m', date) AS ym, ROUND(SUM(amount), 2) AS total
        FROM expenses
        GROUP BY ym
        ORDER BY ym DESC
        LIMIT 6
        """
    ).fetchall()
    monthly_rows = list(reversed(monthly_rows))

    # Daily spending trend for Line Chart (selected month)
    daily_rows = conn.execute(
        """
        SELECT date, ROUND(SUM(amount), 2) AS total
        FROM expenses
        WHERE strftime('%Y-%m', date) = ?
        GROUP BY date
        ORDER BY date ASC
        """,
        (ym_prefix,),
    ).fetchall()

    recent_expenses = conn.execute(
        """
        SELECT * FROM expenses
        ORDER BY date DESC, id DESC
        LIMIT 6
        """
    ).fetchall()

    conn.close()

    return {
        "month": month,
        "year": year,
        "monthly_expenses": monthly_expenses,
        "monthly_subscription_cost": monthly_subscription_cost,
        "total_monthly_spending": total_monthly_spending,
        "budget_limit": budget_limit,
        "remaining_budget": remaining_budget,
        "usage_pct": usage_pct,
        "tx_count": tx_count,
        "active_subs": active_subs,
        "recent_expenses": recent_expenses,
        "category_labels": [r["category"] for r in cat_rows],
        "category_values": [float(r["total"]) for r in cat_rows],
        "monthly_labels": [r["ym"] for r in monthly_rows],
        "monthly_values": [float(r["total"]) for r in monthly_rows],
        "daily_labels": [r["date"] for r in daily_rows],
        "daily_values": [float(r["total"]) for r in daily_rows],
    }


@app.route("/")
def dashboard():
    today = date.today()
    month = request.args.get("month", default=today.month, type=int)
    year = request.args.get("year", default=today.year, type=int)
    month = max(1, min(12, month))
    snapshot = get_financial_snapshot(month, year)
    return render_template("dashboard.html", snapshot=snapshot, active_page="dashboard")


@app.route("/expenses")
def expenses():
    search = request.args.get("search", "").strip()
    category = request.args.get("category", "").strip()
    start_date = request.args.get("start_date", "").strip()
    end_date = request.args.get("end_date", "").strip()

    query = "SELECT * FROM expenses WHERE 1=1"
    params = []

    if search:
        query += " AND (title LIKE ? OR description LIKE ? OR payment_method LIKE ?)"
        like_term = f"%{search}%"
        params.extend([like_term, like_term, like_term])
    if category and category in CATEGORIES:
        query += " AND category = ?"
        params.append(category)
    if start_date and is_valid_iso_date(start_date):
        query += " AND date >= ?"
        params.append(start_date)
    if end_date and is_valid_iso_date(end_date):
        query += " AND date <= ?"
        params.append(end_date)

    query += " ORDER BY date DESC, id DESC"

    conn = get_db_connection()
    rows = conn.execute(query, params).fetchall()
    filtered_total = round(sum(float(r["amount"]) for r in rows), 2)
    conn.close()

    return render_template(
        "expenses.html",
        expenses=rows,
        filtered_total=filtered_total,
        categories=CATEGORIES,
        payment_methods=PAYMENT_METHODS,
        filters={
            "search": search,
            "category": category,
            "start_date": start_date,
            "end_date": end_date,
        },
        active_page="expenses",
    )


@app.route("/expenses/add", methods=["GET", "POST"])
def add_expense():
    if request.method == "POST":
        title = request.form.get("title", "").strip()
        amount_raw = request.form.get("amount", "").strip()
        category = request.form.get("category", "").strip()
        exp_date = request.form.get("date", "").strip()
        payment_method = request.form.get("payment_method", "").strip()
        description = request.form.get("description", "").strip()

        try:
            amount = round(float(amount_raw), 2)
        except ValueError:
            amount = -1

        if not title or len(title) > 120:
            flash("Please provide a valid expense title (max 120 characters).", "danger")
        elif amount <= 0:
            flash("Amount must be greater than zero.", "danger")
        elif category not in CATEGORIES:
            flash("Please select a valid category.", "danger")
        elif not is_valid_iso_date(exp_date):
            flash("Please provide a valid date (YYYY-MM-DD).", "danger")
        elif payment_method not in PAYMENT_METHODS:
            flash("Please select a valid payment method.", "danger")
        else:
            conn = get_db_connection()
            conn.execute(
                """
                INSERT INTO expenses (title, amount, category, date, payment_method, description)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (title, amount, category, exp_date, payment_method, description[:300]),
            )
            conn.commit()
            conn.close()
            flash("Expense added successfully.", "success")
            return redirect(url_for("expenses"))

    return render_template(
        "add_expense.html",
        expense=None,
        categories=CATEGORIES,
        payment_methods=PAYMENT_METHODS,
        today=date.today().isoformat(),
        active_page="expenses",
    )


@app.route("/expenses/edit/<int:expense_id>", methods=["GET", "POST"])
def edit_expense(expense_id):
    conn = get_db_connection()
    expense = conn.execute("SELECT * FROM expenses WHERE id = ?", (expense_id,)).fetchone()
    if expense is None:
        conn.close()
        flash("Expense record not found.", "danger")
        return redirect(url_for("expenses"))

    if request.method == "POST":
        title = request.form.get("title", "").strip()
        amount_raw = request.form.get("amount", "").strip()
        category = request.form.get("category", "").strip()
        exp_date = request.form.get("date", "").strip()
        payment_method = request.form.get("payment_method", "").strip()
        description = request.form.get("description", "").strip()

        try:
            amount = round(float(amount_raw), 2)
        except ValueError:
            amount = -1

        if not title or amount <= 0 or category not in CATEGORIES or not is_valid_iso_date(exp_date) or payment_method not in PAYMENT_METHODS:
            flash("Please check all required expense fields and ensure amount is positive.", "danger")
        else:
            conn.execute(
                """
                UPDATE expenses
                SET title = ?, amount = ?, category = ?, date = ?, payment_method = ?, description = ?
                WHERE id = ?
                """,
                (title, amount, category, exp_date, payment_method, description[:300], expense_id),
            )
            conn.commit()
            conn.close()
            flash("Expense updated successfully.", "success")
            return redirect(url_for("expenses"))

    conn.close()
    return render_template(
        "add_expense.html",
        expense=expense,
        categories=CATEGORIES,
        payment_methods=PAYMENT_METHODS,
        today=date.today().isoformat(),
        active_page="expenses",
    )


@app.route("/expenses/delete/<int:expense_id>", methods=["POST"])
def delete_expense(expense_id):
    conn = get_db_connection()
    conn.execute("DELETE FROM expenses WHERE id = ?", (expense_id,))
    conn.commit()
    conn.close()
    flash("Expense deleted.", "success")
    return redirect(url_for("expenses"))


@app.route("/subscriptions", methods=["GET", "POST"])
def subscriptions():
    conn = get_db_connection()
    if request.method == "POST":
        sub_id = request.form.get("sub_id", "").strip()
        name = request.form.get("name", "").strip()
        amount_raw = request.form.get("amount", "").strip()
        category = request.form.get("category", "").strip()
        billing_cycle = request.form.get("billing_cycle", "").strip()
        start_date = request.form.get("start_date", "").strip()
        next_payment_date = request.form.get("next_payment_date", "").strip()
        status = request.form.get("status", "Active").strip()

        try:
            amount = round(float(amount_raw), 2)
        except ValueError:
            amount = -1

        if (
            not name
            or amount <= 0
            or category not in CATEGORIES
            or billing_cycle not in BILLING_CYCLES
            or not is_valid_iso_date(start_date)
            or not is_valid_iso_date(next_payment_date)
            or status not in SUBSCRIPTION_STATUSES
        ):
            flash("Please complete all subscription fields with valid values.", "danger")
        else:
            if sub_id.isdigit():
                conn.execute(
                    """
                    UPDATE subscriptions
                    SET name = ?, amount = ?, category = ?, billing_cycle = ?,
                        start_date = ?, next_payment_date = ?, status = ?
                    WHERE id = ?
                    """,
                    (name, amount, category, billing_cycle, start_date, next_payment_date, status, int(sub_id)),
                )
                flash("Subscription updated.", "success")
            else:
                conn.execute(
                    """
                    INSERT INTO subscriptions (name, amount, category, billing_cycle, start_date, next_payment_date, status)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    """,
                    (name, amount, category, billing_cycle, start_date, next_payment_date, status),
                )
                flash("Subscription added.", "success")
            conn.commit()
            conn.close()
            return redirect(url_for("subscriptions"))

    subs = conn.execute(
        "SELECT * FROM subscriptions ORDER BY status ASC, next_payment_date ASC"
    ).fetchall()
    conn.close()

    enriched = []
    monthly_total = 0.0
    annual_total = 0.0
    for s in subs:
        m_cost = normalize_monthly_cost(float(s["amount"]), s["billing_cycle"])
        if s["status"] == "Active":
            monthly_total += m_cost
            annual_total += m_cost * 12.0
        enriched.append({**dict(s), "monthly_equivalent": round(m_cost, 2)})

    return render_template(
        "subscriptions.html",
        subscriptions=enriched,
        monthly_total=round(monthly_total, 2),
        annual_total=round(annual_total, 2),
        categories=CATEGORIES,
        billing_cycles=BILLING_CYCLES,
        statuses=SUBSCRIPTION_STATUSES,
        today=date.today().isoformat(),
        active_page="subscriptions",
    )


@app.route("/subscriptions/delete/<int:sub_id>", methods=["POST"])
def delete_subscription(sub_id):
    conn = get_db_connection()
    conn.execute("DELETE FROM subscriptions WHERE id = ?", (sub_id,))
    conn.commit()
    conn.close()
    flash("Subscription deleted.", "success")
    return redirect(url_for("subscriptions"))


@app.route("/budget", methods=["GET", "POST"])
def budget():
    today = date.today()
    month = request.args.get("month", default=today.month, type=int)
    year = request.args.get("year", default=today.year, type=int)

    if request.method == "POST":
        month = request.form.get("month", default=today.month, type=int)
        year = request.form.get("year", default=today.year, type=int)
        limit_raw = request.form.get("budget_limit", "").strip()
        try:
            limit_val = round(float(limit_raw), 2)
        except ValueError:
            limit_val = -1

        if month < 1 or month > 12 or year < 2000 or year > 2100 or limit_val <= 0:
            flash("Enter a valid month, year, and positive budget limit.", "danger")
        else:
            conn = get_db_connection()
            conn.execute(
                """
                INSERT INTO budgets (month, year, budget_limit)
                VALUES (?, ?, ?)
                ON CONFLICT(month, year) DO UPDATE SET budget_limit = excluded.budget_limit
                """,
                (month, year, limit_val),
            )
            conn.commit()
            conn.close()
            flash("Monthly budget updated successfully.", "success")
            return redirect(url_for("budget", month=month, year=year))

    snapshot = get_financial_snapshot(month, year)
    return render_template("budget.html", snapshot=snapshot, active_page="budget")


@app.route("/reports")
def reports():
    today = date.today()
    month = request.args.get("month", default=today.month, type=int)
    year = request.args.get("year", default=today.year, type=int)
    snapshot = get_financial_snapshot(month, year)
    return render_template("reports.html", snapshot=snapshot, active_page="reports")


@app.route("/api/chart-data")
def api_chart_data():
    today = date.today()
    month = request.args.get("month", default=today.month, type=int)
    year = request.args.get("year", default=today.year, type=int)
    snap = get_financial_snapshot(month, year)
    return jsonify(
        {
            "category_labels": snap["category_labels"],
            "category_values": snap["category_values"],
            "monthly_labels": snap["monthly_labels"],
            "monthly_values": snap["monthly_values"],
            "daily_labels": snap["daily_labels"],
            "daily_values": snap["daily_values"],
            "budget_limit": snap["budget_limit"],
            "total_monthly_spending": snap["total_monthly_spending"],
            "remaining_budget": snap["remaining_budget"],
        }
    )


@app.route("/export/csv")
def export_csv():
    export_type = request.args.get("type", "expenses")
    today = date.today()
    month = request.args.get("month", default=today.month, type=int)
    year = request.args.get("year", default=today.year, type=int)
    ym_prefix = f"{year:04d}-{month:02d}"

    output = io.StringIO()
    output.write("\ufeff")  # UTF-8 BOM for clean Microsoft Excel opening
    writer = csv.writer(output)
    conn = get_db_connection()

    if export_type == "subscriptions":
        filename = f"subscriptions_{ym_prefix}.csv"
        writer.writerow(
            ["Name", "Category", "Amount (INR)", "Billing Cycle", "Monthly Equivalent (INR)", "Start Date", "Next Payment Date", "Status"]
        )
        rows = conn.execute("SELECT * FROM subscriptions ORDER BY next_payment_date ASC").fetchall()
        for r in rows:
            m_eq = round(normalize_monthly_cost(float(r["amount"]), r["billing_cycle"]), 2)
            writer.writerow(
                [
                    sanitize_csv_cell(r["name"]),
                    sanitize_csv_cell(r["category"]),
                    f"{float(r['amount']):.2f}",
                    sanitize_csv_cell(r["billing_cycle"]),
                    f"{m_eq:.2f}",
                    sanitize_csv_cell(r["start_date"]),
                    sanitize_csv_cell(r["next_payment_date"]),
                    sanitize_csv_cell(r["status"]),
                ]
            )
    elif export_type == "summary":
        filename = f"spending_summary_{ym_prefix}.csv"
        snap = get_financial_snapshot(month, year)
        writer.writerow(["Metric", "Value (INR)"])
        writer.writerow(["Period", ym_prefix])
        writer.writerow(["Monthly Budget Limit", f"{snap['budget_limit']:.2f}"])
        writer.writerow(["Total Monthly Expenses", f"{snap['monthly_expenses']:.2f}"])
        writer.writerow(["Monthly Subscription Cost", f"{snap['monthly_subscription_cost']:.2f}"])
        writer.writerow(["Total Monthly Spending", f"{snap['total_monthly_spending']:.2f}"])
        writer.writerow(["Remaining Budget", f"{snap['remaining_budget']:.2f}"])
        writer.writerow(["Budget Usage (%)", f"{snap['usage_pct']:.1f}%"])
        writer.writerow([])
        writer.writerow(["Category", "Monthly Total (INR)"])
        for cat, val in zip(snap["category_labels"], snap["category_values"]):
            writer.writerow([sanitize_csv_cell(cat), f"{val:.2f}"])
    else:
        filename = f"expenses_{ym_prefix}.csv"
        writer.writerow(["Date", "Title", "Category", "Amount (INR)", "Payment Method", "Description"])
        rows = conn.execute(
            """
            SELECT date, title, category, amount, payment_method, description
            FROM expenses
            WHERE strftime('%Y-%m', date) = ?
            ORDER BY date DESC, id DESC
            """,
            (ym_prefix,),
        ).fetchall()
        for r in rows:
            writer.writerow(
                [
                    sanitize_csv_cell(r["date"]),
                    sanitize_csv_cell(r["title"]),
                    sanitize_csv_cell(r["category"]),
                    f"{float(r['amount']):.2f}",
                    sanitize_csv_cell(r["payment_method"]),
                    sanitize_csv_cell(r["description"]),
                ]
            )

    conn.close()
    return Response(
        output.getvalue(),
        mimetype="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


if __name__ == "__main__":
    init_db()
    app.run(debug=True, port=5000)
