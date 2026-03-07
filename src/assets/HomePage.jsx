import { useState, useMemo, useEffect } from "react";
import "./financial-tracker.css";
import balanceImage from './images/wallet-icon.png'
import incomeImage from './images/income.png'
import expensesImage from './images/expenses.png'
import savingsImage from './images/piggy-bank.png'

const CATEGORIES = ["Food", "Transport", "Housing", "Entertainment", "Health", "Shopping", "Allowance", "Freelance", "Other"];
const INCOME_CATS = ["Allowance", "Freelance", "Other"];
const EXPENSE_CATS = CATEGORIES.filter(c => !INCOME_CATS.includes(c));
const LS_KEY = "ledger_transactions";

const formatCurrency = (n) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(n);

const formatDate = (d) =>
  new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const CAT_ICONS = {
  Food: "🍔", Transport: "🚗", Housing: "🏠", Entertainment: "🎬",
  Health: "💊", Shopping: "🛍️", Allowance: "💼", Freelance: "💻", Other: "📦",
};

const TAG_COLORS = {
  Food: "#f97316", Transport: "#3b82f6", Housing: "#8b5cf6",
  Entertainment: "#ec4899", Health: "#10b981", Shopping: "#f59e0b",
  Allowance: "#22c55e", Freelance: "#06b6d4", Other: "#6b7280",
};

const loadTransactions = () => {
  try {
    const saved = localStorage.getItem(LS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch { return []; }
};

const defaultForm = () => ({
  type: "expense", category: "Food", amount: "", note: "",
  date: new Date().toISOString().slice(0, 10),
});

export default function FinancialTracker() {
  const [transactions, setTransactions] = useState(loadTransactions);
  const [form, setForm] = useState(defaultForm());
  const [filter, setFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(transactions));
  }, [transactions]);

  const totalIncome = useMemo(() => transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0), [transactions]);
  const totalExpenses = useMemo(() => transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0), [transactions]);
  const balance = totalIncome - totalExpenses;

  const filtered = useMemo(() => {
    let txs = filter === "all" ? transactions : transactions.filter(t => t.type === filter);
    if (searchTerm) {
      txs = txs.filter(t => t.note.toLowerCase().includes(searchTerm.toLowerCase()) || t.category.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    return txs;
  }, [transactions, filter, searchTerm]);

  const categoryTotals = useMemo(() => {
    const map = {};
    transactions.filter(t => t.type === "expense").forEach(t => {
      map[t.category] = (map[t.category] || 0) + t.amount;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [transactions]);

  const savingsRate = totalIncome > 0 ? Math.round((balance / totalIncome) * 100) : null;
  const avgExpense = transactions.filter(t => t.type === "expense").length > 0
    ? totalExpenses / transactions.filter(t => t.type === "expense").length : null;

  const handleSubmit = () => {
    if (!form.amount || isNaN(form.amount) || Number(form.amount) <= 0) return;
    if (editId !== null) {
      setTransactions(prev => prev.map(t => t.id === editId ? { ...form, id: editId, amount: Number(form.amount) } : t));
      setEditId(null);
    } else {
      setTransactions(prev => [{ ...form, id: Date.now(), amount: Number(form.amount) }, ...prev]);
    }
    setForm(defaultForm());
    setShowForm(false);
  };

  const handleEdit = (t) => {
    setForm({ type: t.type, category: t.category, amount: String(t.amount), note: t.note, date: t.date });
    setEditId(t.id);
    setShowForm(true);
  };

  const handleDelete = (id) => setTransactions(prev => prev.filter(t => t.id !== id));

  const handleCancel = () => { setShowForm(false); setEditId(null); setForm(defaultForm()); };

  const handleTypeChange = (e) => {
    const type = e.target.value;
    setForm(f => ({ ...f, type, category: type === "income" ? "Allowance" : "Food" }));
  };

  const availableCategories = form.type === "income" ? INCOME_CATS : EXPENSE_CATS;

  return (
    <div className="app">
      {/* ── Sidebar Nav ── */}
      <aside className="sidenav">
        <div className="sidenav-logo">
          <span className="logo-icon">₿</span>
          <span className="logo-text">Tipid-tips</span>
        </div>
        <nav className="sidenav-links">
          <span className="nav-item active">📊 Dashboard</span>
          <span className="nav-item">📁 History</span>
          <span className="nav-item">⚙️ Settings</span>
        </nav>
        <div className="sidenav-footer">v1.0</div>
      </aside>

      {/* ── Main Content ── */}
      <main className="main">

        {/* Top bar */}
        <header className="topbar">
          <div className="topbar-left">
            <h1 className="page-title">Dashboard</h1>
            <p className="page-sub">Track your income & expenses</p>
          </div>
          <button className={`btn-add ${showForm ? 'btn-close' : ''}`} onClick={() => { setShowForm(s => !s); setEditId(null); }}>
            {showForm ? "✕ Close" : "+ Add Entry"}
          </button>
        </header>

        {/* Summary Cards */}
        <section className="summary-grid">
          <div className="scard scard--balance">
            <div className="scard-icon"><img className="balance-image" src={balanceImage} /></div>
            <div>
              <p className="scard-label">Allowance</p>
              <p className={`scard-value ${balance >= 0 ? "pos" : "neg"}`}>{formatCurrency(balance)}</p>
            </div>
          </div>
          <div className="scard scard--income">
            <div className="scard-icon"><img className="income-image" src={incomeImage} /></div>
            <div>
              <p className="scard-label">Total Income</p>
              <p className="scard-value green">{formatCurrency(totalIncome)}</p>
            </div>
          </div>
          <div className="scard scard--expense">
            <div className="scard-icon"><img className="expenses-image" src={expensesImage} alt="" /></div>
            <div>
              <p className="scard-label">Total Expenses</p>
              <p className="scard-value red">{formatCurrency(totalExpenses)}</p>
            </div>
          </div>
          <div className="scard scard--savings">
            <div className="scard-icon"><img className="savings-rate-image" src={savingsImage} alt="" /></div>
            <div>
              <p className="scard-label">Savings Rate</p>
              <p className={`scard-value ${savingsRate !== null && savingsRate >= 0 ? "pos" : "neg"}`}>
                {savingsRate !== null ? `${savingsRate}%` : "—"}
              </p>
            </div>
          </div>
        </section>

        {/* Add / Edit Form */}
        {showForm && (
          <section className="form-panel">
            <h3 className="form-title">{editId ? "✏️ Edit Entry" : "➕ New Entry"}</h3>
            <div className="form-grid">
              <div className="field">
                <label>Type</label>
                <select value={form.type} onChange={handleTypeChange}>
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>
              <div className="field">
                <label>Category</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {availableCategories.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Amount (₱)</label>
                <input type="number" placeholder="0.00" value={form.amount}
                  onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} min="0" step="0.01" />
              </div>
              <div className="field">
                <label>Date</label>
                <input type="date" value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div className="field field--full">
                <label>Note</label>
                <input type="text" placeholder="What was this for?" value={form.note}
                  onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
              </div>
            </div>
            <div className="form-actions">
              <button className="btn-primary" onClick={handleSubmit}>{editId ? "Save Changes" : "Add Entry"}</button>
              <button className="btn-ghost" onClick={handleCancel}>Cancel</button>
            </div>
          </section>
        )}

        {/* Bottom grid */}
        <section className="content-grid">

          {/* Transactions */}
          <div className="panel">
            <div className="panel-header">
              <h2 className="panel-title">Transactions</h2>
              <input type="text" placeholder="Search transactions..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="search-input" />
              <div className="filters">
                {["all", "income", "expense"].map(f => (
                  <button key={f} className={`filter-pill ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="tx-list">
              {filtered.length === 0
                ? <div className="tx-empty"><span>🧾</span><p>No transactions yet</p></div>
                : filtered.map(t => (
                  <div className="tx-row" key={t.id}>
                    <div className="tx-cat-icon" style={{ background: TAG_COLORS[t.category] + "22", color: TAG_COLORS[t.category] }}>
                      {CAT_ICONS[t.category]}
                    </div>
                    <div className="tx-info">
                      <p className="tx-note">{t.note || t.category}</p>
                      <div className="tx-meta">
                        <span className="tx-tag" style={{ background: TAG_COLORS[t.category] + "22", color: TAG_COLORS[t.category] }}>
                          {t.category}
                        </span>
                        <span className="tx-date">{formatDate(t.date)}</span>
                      </div>
                    </div>
                    <div className="tx-right">
                      <span className={`tx-amount ${t.type}`}>
                        {t.type === "income" ? "+" : "-"}{formatCurrency(t.amount)}
                      </span>
                      <button className="icon-btn edit" onClick={() => handleEdit(t)} title="Edit">✎</button>
                      <button className="icon-btn delete" onClick={() => handleDelete(t.id)} title="Delete">✕</button>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Right column */}
          <div className="right-col">

            {/* Spending Breakdown */}
            <div className="panel">
              <h2 className="panel-title">Spending Breakdown</h2>
              {categoryTotals.length === 0
                ? <p className="empty-text">No expenses recorded yet.</p>
                : categoryTotals.map(([cat, total]) => (
                  <div className="bar-row" key={cat}>
                    <div className="bar-row-top">
                      <span className="bar-cat">{CAT_ICONS[cat]} {cat}</span>
                      <span className="bar-amt">{formatCurrency(total)}</span>
                    </div>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: `${Math.min(100, (total / totalExpenses) * 100)}%`, background: TAG_COLORS[cat] }} />
                    </div>
                  </div>
                ))}
            </div>

            {/* Summary stats */}
            <div className="panel stats-panel">
              <h2 className="panel-title">Quick Stats</h2>
              <div className="stat-row">
                <span className="stat-label">Transactions</span>
                <span className="stat-val">{transactions.length}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Avg Expense</span>
                <span className="stat-val">{avgExpense ? formatCurrency(avgExpense) : "—"}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Top Income Cat</span>
                <span className="stat-val">
                  {transactions.filter(t => t.type === "income").length > 0
                    ? transactions.filter(t => t.type === "income").sort((a, b) => b.amount - a.amount)[0].category
                    : "—"}
                </span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Top Expense Cat</span>
                <span className="stat-val">
                  {categoryTotals.length > 0 ? categoryTotals[0][0] : "—"}
                </span>
              </div>
            </div>

          </div>
        </section>
      </main>
    </div>
  );
}