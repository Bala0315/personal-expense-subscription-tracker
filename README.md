# 💰 Personal Expense & Subscription Tracker

A simple and user-friendly web application to manage daily expenses, track subscriptions, monitor monthly budgets, and analyze spending habits through interactive charts.

This project helps students and individuals manage their personal finances efficiently by keeping all financial records in one place.

## 🚀 Features

- **Dashboard:** View total expenses, subscription costs, monthly budget, and remaining balance.
- **Expense Management:** Add, view, edit, delete, and search daily expenses.
- **Category Management:** Organize expenses into Food, Travel, Shopping, Bills, Education, Healthcare, Entertainment, and Others.
- **Subscription Tracking:** Manage recurring subscriptions and monitor upcoming payment dates.
- **Monthly Budget:** Set monthly spending limits and track budget usage.
- **Visual Analytics:** View spending patterns through interactive Pie, Bar, Doughnut, and Line charts.
- **CSV Export:** Export expense records and financial summaries to CSV files for Excel.
- **Responsive Design:** Access the application on desktops, tablets, and mobile devices.

## 🛠️ Technologies Used

| Technology | Purpose |
|---|---|
| HTML5 | Webpage structure |
| CSS3 | Styling and design |
| JavaScript | Frontend functionality |
| Bootstrap 5 | Responsive interface |
| Chart.js | Data visualization |
| Python | Backend programming |
| Flask | Web framework |
| SQLite | Database management |
| CSV Module | Export financial records |

## 📂 Project Structure

```text
personal_expense_tracker/
│
├── app.py
├── database.db
├── requirements.txt
│
├── templates/
│   ├── base.html
│   ├── dashboard.html
│   ├── expenses.html
│   ├── add_expense.html
│   ├── subscriptions.html
│   ├── budget.html
│   └── reports.html
│
└── static/
    ├── css/
    │   └── style.css
    │
    └── js/
        └── script.js
```

## ⚙️ Installation and Setup

Follow these steps to run the project on your local computer.

### Step 1: Clone the Repository

```bash
git clone https://github.com/your-username/personal-expense-subscription-tracker.git
```

### Step 2: Open the Project Folder

```bash
cd personal-expense-subscription-tracker
```

### Step 3: Create a Virtual Environment

```bash
python -m venv venv
```

Activate the virtual environment.

**Windows:**
```bash
venv\Scripts\activate
```

**Linux / macOS:**
```bash
source venv/bin/activate
```

### Step 4: Install Required Packages

```bash
pip install -r requirements.txt
```

### Step 5: Run the Application

```bash
python app.py
```

### Step 6: Open in Browser

```text
http://127.0.0.1:5000/
```

The application will run locally in your web browser.

## 🗄️ Database Structure

The application uses SQLite to store financial information.

### Expenses Table

- ID
- Title
- Amount
- Category
- Date
- Payment Method
- Description

### Subscriptions Table

- ID
- Subscription Name
- Amount
- Category
- Billing Cycle
- Start Date
- Next Payment Date
- Status

### Budgets Table

- ID
- Month
- Year
- Budget Limit

## 📊 Data Visualization

The application uses Chart.js to present financial information visually.

- Pie Chart – Category-wise expenses.
- Bar Chart – Monthly expense comparison.
- Doughnut Chart – Budget utilization.
- Line Chart – Spending trends.

## 📤 CSV Export

Users can export their financial records into CSV format.

CSV files can be opened using:
- Microsoft Excel
- Google Sheets
- Other spreadsheet applications

## 🎯 Project Objectives

1. To help users maintain daily expense records.
2. To manage monthly budgets effectively.
3. To track recurring subscriptions.
4. To understand spending habits using charts.
5. To provide easy financial report generation through CSV export.

## 🔮 Future Enhancements

- User login and registration.
- Password-protected accounts.
- Dark mode.
- Email reminders for subscription renewals.
- Advanced monthly and yearly reports.
- Expense comparison and financial insights.

## 🎓 Project Information

**Project Name:** Personal Expense & Subscription Tracker

**Project Type:** Web Application

**Domain:** Web Development / Personal Finance Management

**Backend:** Python Flask

**Database:** SQLite

**Frontend:** HTML, CSS, JavaScript

## 👨‍💻 Author

Developed as a BSc Computer Science project to demonstrate web development, database management, CRUD operations, data visualization, and financial tracking.

---

⭐ If you find this project useful, please consider giving this repository a star!

**Made with ❤️ using Python, Flask, SQLite, and JavaScript.**
