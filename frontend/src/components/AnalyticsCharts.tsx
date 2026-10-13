import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DashboardStats, Farmer } from "../types";

const money = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});
const number = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 1 });

interface ChartsProps {
  farmers: Farmer[];
  stats: DashboardStats | null;
}

export function AnalyticsCharts({ farmers, stats }: ChartsProps) {
  const supply = [...farmers]
    .sort((a, b) => b.sugarcane_tons - a.sugarcane_tons)
    .slice(0, 7)
    .map((farmer) => ({ name: shortName(farmer.farmer_name), tons: farmer.sugarcane_tons }));
  const pending = [...farmers]
    .sort((a, b) => b.payment_pending - a.payment_pending)
    .slice(0, 6)
    .map((farmer) => ({ name: shortName(farmer.farmer_name), pending: farmer.payment_pending }));
  const paymentMix = [
    { name: "Paid", value: stats?.totalPaid ?? 0 },
    { name: "Pending", value: stats?.totalPending ?? 0 },
  ];

  return (
    <div className="analytics-grid">
      <section className="panel chart-panel chart-panel--wide">
        <div className="panel-heading">
          <div><h2>Sugarcane supply</h2><p>Top farmers by delivered quantity</p></div>
          <span className="chart-unit">TONS</span>
        </div>
        {supply.length ? (
          <div className="chart-wrap chart-wrap--supply">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={supply} margin={{ top: 8, right: 12, left: -20, bottom: 0 }} barSize={27}>
                <CartesianGrid vertical={false} stroke="#edf0e9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#8a928a", fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#8a928a", fontSize: 11 }} />
                <Tooltip formatter={(value) => [`${number.format(Number(value))} tons`, "Supplied"]} cursor={{ fill: "#f4f7f2" }} />
                <Bar dataKey="tons" fill="#4f8d61" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : <ChartEmpty />}
      </section>

      <section className="panel chart-panel">
        <div className="panel-heading">
          <div><h2>Payment overview</h2><p>Paid vs outstanding</p></div>
          <span className="chart-menu">•••</span>
        </div>
        {paymentMix.some((entry) => entry.value > 0) ? (
          <div className="payment-chart">
            <div className="chart-wrap chart-wrap--donut">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={paymentMix} dataKey="value" innerRadius={57} outerRadius={78} paddingAngle={4} stroke="none">
                    {paymentMix.map((entry, index) => <Cell key={entry.name} fill={index === 0 ? "#3d8054" : "#e6bd67"} />)}
                  </Pie>
                  <Tooltip formatter={(value) => [money.format(Number(value)), ""]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="donut-center"><strong>{money.format((stats?.totalPaid ?? 0) + (stats?.totalPending ?? 0))}</strong><span>Total value</span></div>
            </div>
            <div className="payment-legend">
              {paymentMix.map((entry, index) => (
                <div key={entry.name}>
                  <span><i style={{ background: index === 0 ? "#3d8054" : "#e6bd67" }} />{entry.name}</span>
                  <strong>{money.format(entry.value)}</strong>
                </div>
              ))}
            </div>
          </div>
        ) : <ChartEmpty />}
      </section>

      <section className="panel chart-panel chart-panel--wide">
        <div className="panel-heading">
          <div><h2>Outstanding payments</h2><p>Farmers with the highest pending balance</p></div>
          <span className="chart-unit">INR</span>
        </div>
        {pending.length ? (
          <div className="chart-wrap chart-wrap--pending">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pending} margin={{ top: 8, right: 12, left: 8, bottom: 0 }} barSize={27}>
                <CartesianGrid vertical={false} stroke="#edf0e9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#8a928a", fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#8a928a", fontSize: 11 }} tickFormatter={(value) => `₹${Number(value) >= 1000 ? `${Math.round(Number(value) / 1000)}k` : value}`} />
                <Tooltip formatter={(value) => [money.format(Number(value)), "Pending"]} cursor={{ fill: "#fbf7ee" }} />
                <Bar dataKey="pending" fill="#d5a546" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : <ChartEmpty />}
      </section>

      <section className="panel village-panel">
        <div className="panel-heading"><div><h2>Supply by village</h2><p>Production distribution</p></div></div>
        {stats?.villageSupply.length ? (
          <div className="village-list">
            {stats.villageSupply.slice(0, 5).map((item, index) => {
              const percent = stats.totalTons ? (item.tons / stats.totalTons) * 100 : 0;
              return (
                <div className="village-item" key={item.village}>
                  <div className="village-item-title"><span className="village-rank">{String(index + 1).padStart(2, "0")}</span><strong>{item.village}</strong><span>{number.format(item.tons)} t</span></div>
                  <div className="progress-track"><span style={{ width: `${percent}%` }} /></div>
                </div>
              );
            })}
          </div>
        ) : <ChartEmpty />}
      </section>
    </div>
  );
}

function shortName(name: string): string {
  return name.length > 13 ? `${name.slice(0, 12)}…` : name;
}

function ChartEmpty() {
  return <div className="chart-empty">Farmer data will appear here when connected.</div>;
}
