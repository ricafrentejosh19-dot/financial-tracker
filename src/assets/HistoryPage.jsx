import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import "./financial-tracker.css";
import "./HistoryPage.css";
import { supabase } from "./supabaseClient"

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

export function HistoryPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date-desc");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        // no is_deleted filter — show ALL records including soft-deleted
        .order('date', { ascending: false });
      if (!cancelled) {
        if (error) console.error(error);
        else setTransactions(data);
        setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    let txs = filter === "all" ? transactions : transactions.filter(t => t.type === filter);
    if (searchTerm) {
      txs = txs.filter(t =>
        (t.note || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    const sorted = [...txs];
    if (sortBy === "date-desc") sorted.sort((a, b) => new Date(b.date) - new Date(a.date));
    else if (sortBy === "date-asc") sorted.sort((a, b) => new Date(a.date) - new Date(b.date));
    else if (sortBy === "amount-desc") sorted.sort((a, b) => b.amount - a.amount);
    else if (sortBy === "amount-asc") sorted.sort((a, b) => a.amount - b.amount);
    else if (sortBy === "category") sorted.sort((a, b) => a.category.localeCompare(b.category));
    return sorted;
  }, [transactions, filter, sortBy, searchTerm]);

  const totalAmount = useMemo(() =>
    filtered.reduce((sum, t) => sum + (t.type === "income" ? t.amount : -t.amount), 0),
  [filtered]);

  const summaryStats = useMemo(() => ({
    income: filtered.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0),
    expenses: filtered.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0),
    count: filtered.length,
  }), [filtered]);

  return (
    <div className="app">
      <aside className="sidenav">
        <div className="sidenav-logo">
          <span className="logo-icon">₱</span>
          <span className="logo-text">Tipid-tips</span>
        </div>
        <nav className="sidenav-links">
          <Link to="/" className="nav-item">📊 Dashboard</Link>
          <span className="nav-item active">📁 History</span>
          <span className="nav-item">⚙️ Settings</span>
        </nav>
        <div className="sidenav-footer">v1.0</div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="topbar-left">
            <h1 className="page-title">Transaction History</h1>
            <p className="page-sub">View and manage all your transactions</p>
          </div>
        </header>

        <section className="content-grid history-content-grid">
          <div className="panel history-panel">
            <div className="panel-header">
              <h2 className="panel-title">All Transactions</h2>
            </div>

            <div className="history-controls">
              <input
                type="text"
                placeholder="Search by note or category..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="search-input history-search-input"
              />
              <div className="filters">
                {["all", "income", "expense"].map(f => (
                  <button key={f} className={`filter-pill ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="history-sort-select">
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="amount-desc">Highest Amount</option>
                <option value="amount-asc">Lowest Amount</option>
                <option value="category">By Category</option>
              </select>
            </div>

            <div className="history-table-wrapper">
              {loading ? (
                <div className="history-empty">
                  <span className="history-empty-icon">⏳</span>
                  <p>Loading transactions...</p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="history-empty">
                  <span className="history-empty-icon">🧾</span>
                  <p>No transactions found</p>
                </div>
              ) : (
                <table className="history-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Category</th>
                      <th>Note</th>
                      <th>Amount</th>
                      <th>Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(t => (
                      <tr key={t.id} style={{ opacity: t.is_deleted ? 0.45 : 1 }}>
                        <td>{formatDate(t.date)}</td>
                        <td>
                          <span className="history-category-cell">
                            <span>{CAT_ICONS[t.category]}</span>
                            <span>{t.category}</span>
                          </span>
                        </td>
                        <td className="history-note-cell">{t.note || "—"}</td>
                        <td className={`history-amount-cell ${t.type}`}>
                          {t.type === "income" ? "+" : "−"}{formatCurrency(t.amount)}
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <span className="history-type-tag" style={{ background: TAG_COLORS[t.category] + "22", color: TAG_COLORS[t.category] }}>
                            {t.is_deleted ? "Deleted" : t.type === "income" ? "Income" : "Expense"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {filtered.length > 0 && (
              <div className="history-summary-footer">
                <div className="history-summary-stat">
                  <p className="history-summary-label">Total Income</p>
                  <p className="history-summary-value history-summary-income">{formatCurrency(summaryStats.income)}</p>
                </div>
                <div className="history-summary-stat">
                  <p className="history-summary-label">Total Expenses</p>
                  <p className="history-summary-value history-summary-expense">{formatCurrency(summaryStats.expenses)}</p>
                </div>
                <div className="history-summary-stat">
                  <p className="history-summary-label">Net</p>
                  <p className={`history-summary-value ${totalAmount >= 0 ? "history-summary-income" : "history-summary-expense"}`}>
                    {formatCurrency(totalAmount)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}