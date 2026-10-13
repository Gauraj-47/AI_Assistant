import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BadgeIndianRupee,
  CircleAlert,
  CircleDollarSign,
  Leaf,
  RefreshCw,
  UsersRound,
  Wheat,
} from "lucide-react";
import { lazy, Suspense, useEffect, useState } from "react";
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useOutletContext,
} from "react-router-dom";
import { AIChatPanel } from "./components/AIChatPanel";
import { FarmerTable } from "./components/FarmerTable";
import { Sidebar } from "./components/Sidebar";
import { StatCard } from "./components/StatCard";
import { Topbar } from "./components/Topbar";
import { getDashboardStats, getFarmers } from "./services/api";
import type { AppData, DashboardStats, Farmer } from "./types";

const AnalyticsCharts = lazy(() =>
  import("./components/AnalyticsCharts").then((module) => ({
    default: module.AnalyticsCharts,
  })),
);
const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});
const quantity = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 1 });

const pageTitles: Record<string, string> = {
  "/": "Dashboard overview",
  "/farmers": "Farmer records",
  "/assistant": "AI assistant",
  "/payments": "Payment tracking",
  "/reports": "Reports & analytics",
  "/settings": "Settings",
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<DashboardLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="farmers" element={<FarmersPage />} />
          <Route path="assistant" element={<AssistantPage />} />
          <Route path="payments" element={<PaymentsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

function DashboardLayout() {
  const location = useLocation();
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const [nextFarmers, nextStats] = await Promise.all([getFarmers(), getDashboardStats()]);
      setFarmers(nextFarmers);
      setStats(nextStats);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to load farmer records.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  const context: AppData = { farmers, stats, loading, error, refresh, search };
  const title = pageTitles[location.pathname] || "Dashboard";

  return (
    <div className={`app-shell ${collapsed ? "app-shell--collapsed" : ""}`}>
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onToggle={() => setCollapsed((value) => !value)}
        onClose={() => setMobileOpen(false)}
      />
      <main className="main-area">
        <Topbar title={title} search={search} onSearchChange={setSearch} onMenuClick={() => setMobileOpen(true)} />
        <div className="page-content">
          {error && (
            <div className="api-alert" role="alert">
              <CircleAlert size={18} />
              <div><strong>Live data unavailable</strong><span>{error}</span></div>
              <button onClick={() => void refresh()}><RefreshCw size={15} /> Retry</button>
            </div>
          )}
          <Outlet context={context} />
        </div>
      </main>
    </div>
  );
}

function useAppData(): AppData {
  return useOutletContext<AppData>();
}

function DashboardPage() {
  const { farmers, stats, loading, refresh, search } = useAppData();
  return (
    <>
      <section className="welcome-row">
        <div>
          <div className="eyebrow"><span className="eyebrow-line" /> LIVE FARMER INTELLIGENCE</div>
          <h2>Good day, <em>Factory Admin.</em></h2>
          <p>Here’s what’s happening across your farmer network today.</p>
        </div>
        <button className="secondary-button" onClick={() => void refresh()} disabled={loading}><RefreshCw size={15} className={loading ? "spin" : ""} /> Refresh data</button>
      </section>
      <section className="stat-grid" aria-label="Dashboard statistics">
        {loading && !stats ? <StatSkeleton /> : <>
          <StatCard label="Registered farmers" value={stats?.totalFarmers.toLocaleString("en-IN") ?? "0"} note="Across your network" icon={UsersRound} tone="green" />
          <StatCard label="Sugarcane supplied" value={`${quantity.format(stats?.totalTons ?? 0)} t`} note="Total quantity received" icon={Wheat} tone="lime" />
          <StatCard label="Amount paid" value={currency.format(stats?.totalPaid ?? 0)} note="Disbursed to farmers" icon={BadgeIndianRupee} tone="cream" />
          <StatCard label="Pending payments" value={currency.format(stats?.totalPending ?? 0)} note="Outstanding balance" icon={CircleDollarSign} tone="amber" />
        </>}
      </section>
      <Suspense fallback={<LoadingPanel label="Preparing analytics..." />}>
        <AnalyticsCharts farmers={farmers} stats={stats} />
      </Suspense>
      <div className="section-row">
        <FarmerTable farmers={farmers} search={search} />
        <section className="season-summary panel">
          <div className="summary-topline"><span><Activity size={16} /> SEASON PULSE</span><span className="live-dot" /> LIVE</div>
          <h2>Growing together,<br /><em>harvest after harvest.</em></h2>
          <p>Every delivery strengthens our farmer community. Keep the momentum going this season.</p>
          <div className="summary-metrics">
            <div><span>Network villages</span><strong>{stats?.villageSupply.length ?? 0}</strong></div>
            <div><span>Farmers on record</span><strong>{stats?.totalFarmers ?? 0}</strong></div>
          </div>
          <div className="summary-decoration"><Leaf size={84} strokeWidth={0.8} /></div>
        </section>
      </div>
      <AIChatPanel compact />
    </>
  );
}

function FarmersPage() {
  const { farmers, search, loading } = useAppData();
  return (
    <>
      <PageIntro eyebrow="FARMER NETWORK" title="Every grower, one view." text="Explore farmer deliveries and payment records across all villages." />
      {loading && farmers.length === 0 ? <LoadingPanel label="Loading farmer records..." /> : <FarmerTable farmers={farmers} search={search} />}
    </>
  );
}

function AssistantPage() {
  return (
    <>
      <PageIntro eyebrow="YOUR FARMER DATA, IN CONVERSATION" title="A little insight goes a long way." text="Ask a question in plain language and get answers from your live farmer records." />
      <AIChatPanel />
    </>
  );
}

function PaymentsPage() {
  const { farmers, stats, search, loading } = useAppData();
  const owingCount = farmers.filter((farmer) => farmer.payment_pending > 0).length;
  return (
    <>
      <PageIntro eyebrow="PAYMENT TRACKING" title="Clear view. Confident decisions." text="Review paid and outstanding balances. Payment changes are not available from this dashboard." />
      <div className="payment-summary-grid">
        <div className="payment-summary-card payment-summary-card--paid"><span className="payment-summary-icon"><ArrowUpRight size={17} /></span><span>Total disbursed</span><strong>{currency.format(stats?.totalPaid ?? 0)}</strong><small>Recorded amount paid</small></div>
        <div className="payment-summary-card payment-summary-card--due"><span className="payment-summary-icon"><ArrowDownRight size={17} /></span><span>Outstanding</span><strong>{currency.format(stats?.totalPending ?? 0)}</strong><small>Across {owingCount.toLocaleString("en-IN")} farmers</small></div>
        <div className="payment-summary-card payment-summary-card--neutral"><span className="payment-summary-icon"><UsersRound size={17} /></span><span>Farmers with dues</span><strong>{owingCount.toLocaleString("en-IN")}</strong><small>Records with pending amount</small></div>
      </div>
      {loading && farmers.length === 0 ? <LoadingPanel label="Loading payment records..." /> : <FarmerTable farmers={farmers} search={search} paymentFilter />}
    </>
  );
}

function ReportsPage() {
  const { farmers, stats, loading } = useAppData();
  return (
    <>
      <PageIntro eyebrow="REPORTING & ANALYTICS" title="The season, in perspective." text="Live supply and payment trends calculated from your farmer records." />
      <div className="report-banner">
        <div className="report-banner-icon"><Leaf size={20} /></div>
        <div><strong>Live data report</strong><span>Analytics update whenever your farmer records change.</span></div>
        <span className="report-live"><i /> CONNECTED DATA</span>
      </div>
      {loading && !stats ? <LoadingPanel label="Preparing analytics..." /> : (
        <Suspense fallback={<LoadingPanel label="Preparing analytics..." />}>
          <AnalyticsCharts farmers={farmers} stats={stats} />
        </Suspense>
      )}
      <section className="panel report-villages">
        <div className="panel-heading"><div><h2>Village supply summary</h2><p>Aggregate sugarcane supplied per village</p></div><span className="chart-unit">TONS</span></div>
        {stats?.villageSupply.length ? (
          <div className="report-village-grid">
            {stats.villageSupply.map((item, index) => <div className="report-village-card" key={item.village}><span>{String(index + 1).padStart(2, "0")}</span><strong>{item.village}</strong><b>{quantity.format(item.tons)} t</b></div>)}
          </div>
        ) : <div className="chart-empty">No village records available yet.</div>}
      </section>
    </>
  );
}

function SettingsPage() {
  return (
    <>
      <PageIntro eyebrow="WORKSPACE PREFERENCES" title="Your workspace, at a glance." text="System information and data connection status for the Sanjivani dashboard." />
      <section className="settings-grid">
        <div className="panel settings-card">
          <div className="settings-icon"><Leaf size={20} /></div><span className="settings-label">FACTORY</span><h2>Sanjivani Sugar Factory</h2><p>AI-powered farmer management and seasonal analytics.</p>
          <div className="settings-row"><span>Season</span><strong>Current cycle</strong></div>
          <div className="settings-row"><span>Currency</span><strong>Indian Rupee (INR)</strong></div>
          <div className="settings-row"><span>Quantity unit</span><strong>Metric tons</strong></div>
        </div>
        <div className="panel settings-card">
          <div className="settings-icon settings-icon--soft"><Activity size={20} /></div><span className="settings-label">CONNECTED SERVICES</span><h2>Private by design</h2><p>Credentials stay on the backend. The browser talks only to your local API.</p>
          <div className="settings-row"><span>Farmer data</span><strong className="connection-status"><i /> MongoDB via MCP</strong></div>
          <div className="settings-row"><span>AI assistant</span><strong className="connection-status"><i /> OpenAI via backend</strong></div>
          <div className="settings-row"><span>Payment actions</span><strong>Read-only</strong></div>
        </div>
      </section>
      <div className="settings-note"><CircleAlert size={16} /><span>Connection values are configured in the backend environment. This screen does not read or expose secret configuration.</span></div>
    </>
  );
}

function PageIntro({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return <section className="page-intro"><div className="eyebrow"><span className="eyebrow-line" />{eyebrow}</div><h2>{title}</h2><p>{text}</p></section>;
}

function LoadingPanel({ label }: { label: string }) {
  return <div className="loading-panel"><span className="spinner spinner--dark" />{label}</div>;
}

function StatSkeleton() {
  return <>{[1, 2, 3, 4].map((item) => <div className="stat-card stat-skeleton" key={item}><i /><b /><span /></div>)}</>;
}
