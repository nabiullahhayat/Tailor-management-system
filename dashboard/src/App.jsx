const stats = [
  { label: 'Total Orders', value: '128', change: '+12%', tone: 'primary' },
  { label: 'Revenue', value: '₹2.4L', change: '+8%', tone: 'success' },
  { label: 'Customers', value: '86', change: '+5%', tone: 'secondary' },
  { label: 'Pending', value: '14', change: '-3%', tone: 'danger' },
];

const recentOrders = [
  { id: 'ORD-1042', customer: 'Ahmad Khan', type: 'Shalwar Kameez', amount: '₹4,500', status: 'Ready' },
  { id: 'ORD-1041', customer: 'Fatima Ali', type: 'Waistcoat', amount: '₹3,200', status: 'Finding' },
  { id: 'ORD-1040', customer: 'Hassan Shah', type: 'Suit', amount: '₹8,900', status: 'Delivered' },
  { id: 'ORD-1039', customer: 'Sara Noor', type: 'Kurti', amount: '₹2,100', status: 'Ready' },
];

const navItems = ['Overview', 'Orders', 'Customers', 'Sales', 'Finance', 'Stock', 'Settings'];

function StatCard({ label, value, change, tone }) {
  const toneMap = {
    primary: 'from-primary to-primary-dark',
    success: 'from-success to-emerald-700',
    secondary: 'from-secondary to-cyan-700',
    danger: 'from-danger to-red-700',
  };

  return (
    <div className="rounded-2xl border border-black/5 bg-surface p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">{label}</p>
      <div className="mt-3 flex items-end justify-between">
        <p className="text-3xl font-extrabold tracking-tight text-ink">{value}</p>
        <span className={`rounded-full bg-gradient-to-r ${toneMap[tone]} px-2.5 py-1 text-xs font-bold text-white`}>
          {change}
        </span>
      </div>
    </div>
  );
}

function StatusPill({ status }) {
  const styles = {
    Ready: 'bg-primary-soft text-primary',
    Finding: 'bg-amber-100 text-amber-700',
    Delivered: 'bg-emerald-100 text-success',
  };

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${styles[status] || 'bg-slate-100 text-slate-600'}`}>
      {status}
    </span>
  );
}

export default function App() {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col bg-navy text-white lg:flex">
        <div className="border-b border-white/10 px-6 py-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">Khayati</p>
          <h1 className="mt-1 text-xl font-extrabold tracking-tight">Dashboard</h1>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item, i) => (
            <button
              key={item}
              type="button"
              className={`w-full rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${
                i === 0 ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-white/70 hover:bg-white/5 hover:text-white'
              }`}
            >
              {item}
            </button>
          ))}
        </nav>
        <div className="border-t border-white/10 p-4">
          <div className="rounded-xl bg-white/5 px-4 py-3">
            <p className="text-xs text-white/50">Connected app</p>
            <p className="mt-1 text-sm font-semibold">phone/</p>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1">
        <header className="border-b border-black/5 bg-surface px-6 py-5 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-ink-muted">Welcome back</p>
              <h2 className="text-2xl font-extrabold tracking-tight text-ink">Business Overview</h2>
            </div>
            <button
              type="button"
              className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/25 transition hover:bg-primary-dark"
            >
              + New Order
            </button>
          </div>
        </header>

        <div className="space-y-8 p-6 lg:p-8">
          {/* Stats */}
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <StatCard key={stat.label} {...stat} />
            ))}
          </section>

          {/* Chart placeholder + quick actions */}
          <section className="grid gap-6 xl:grid-cols-3">
            <div className="xl:col-span-2 rounded-2xl border border-black/5 bg-surface p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-lg font-bold text-ink">Revenue Trend</h3>
                <span className="rounded-lg bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">Last 30 days</span>
              </div>
              <div className="flex h-56 items-end gap-3">
                {[40, 65, 45, 80, 55, 90, 70, 95, 60, 85, 75, 100].map((h, i) => (
                  <div key={i} className="flex flex-1 flex-col items-center gap-2">
                    <div
                      className="w-full rounded-t-lg bg-gradient-to-t from-primary to-primary/40"
                      style={{ height: `${h}%` }}
                    />
                    <span className="text-[10px] text-ink-muted">{i + 1}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-black/5 bg-gradient-to-br from-navy to-navy-light p-6 text-white shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-white/50">Quick Actions</p>
              <div className="mt-5 space-y-3">
                {['Add Customer', 'Record Sale', 'Manage Stock', 'View Finance'].map((action) => (
                  <button
                    key={action}
                    type="button"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm font-semibold transition hover:bg-white/10"
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Recent orders table */}
          <section className="rounded-2xl border border-black/5 bg-surface shadow-sm">
            <div className="flex items-center justify-between border-b border-black/5 px-6 py-4">
              <h3 className="text-lg font-bold text-ink">Recent Orders</h3>
              <button type="button" className="text-sm font-semibold text-primary hover:text-primary-dark">
                View all
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-black/5 text-xs uppercase tracking-wider text-ink-muted">
                    <th className="px-6 py-3 font-semibold">Order</th>
                    <th className="px-6 py-3 font-semibold">Customer</th>
                    <th className="px-6 py-3 font-semibold">Type</th>
                    <th className="px-6 py-3 font-semibold">Amount</th>
                    <th className="px-6 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="border-b border-black/5 last:border-0 hover:bg-background/60">
                      <td className="px-6 py-4 font-semibold text-primary">{order.id}</td>
                      <td className="px-6 py-4 font-medium text-ink">{order.customer}</td>
                      <td className="px-6 py-4 text-ink-muted">{order.type}</td>
                      <td className="px-6 py-4 font-semibold text-ink">{order.amount}</td>
                      <td className="px-6 py-4">
                        <StatusPill status={order.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
