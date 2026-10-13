import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Search, SlidersHorizontal, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Farmer } from "../types";

const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const tons = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 1 });
type SortKey = "farmer_name" | "sugarcane_tons" | "amount_paid" | "payment_pending";

interface FarmerTableProps {
  farmers: Farmer[];
  search: string;
  paymentFilter?: boolean;
}

export function FarmerTable({ farmers, search, paymentFilter = false }: FarmerTableProps) {
  const [query, setQuery] = useState("");
  const [village, setVillage] = useState("All villages");
  const [sort, setSort] = useState<SortKey>("sugarcane_tons");
  const [descending, setDescending] = useState(true);
  const [page, setPage] = useState(1);
  const [selectedFarmer, setSelectedFarmer] = useState<Farmer | null>(null);
  const [payment, setPayment] = useState("Any balance");
  const pageSize = 8;
  const villages = useMemo(() => ["All villages", ...new Set(farmers.map((farmer) => farmer.village))], [farmers]);
  const rows = useMemo(() => {
    return farmers
      .filter((farmer) => matchesFarmer(farmer, search) && matchesFarmer(farmer, query))
      .filter((farmer) => village === "All villages" || farmer.village === village)
      .filter((farmer) => !paymentFilter || (
        payment === "Outstanding only" ? farmer.payment_pending > 0 :
          payment === "Above ₹40,000" ? farmer.payment_pending > 40000 : true
      ))
      .sort((a, b) => {
        const left = a[sort];
        const right = b[sort];
        const result = typeof left === "string" && typeof right === "string"
          ? left.localeCompare(right)
          : Number(left) - Number(right);
        return descending ? -result : result;
      });
  }, [farmers, search, query, village, sort, descending, payment, paymentFilter]);
  useEffect(() => setPage(1), [search, query, village, payment]);
  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const pageRows = rows.slice((page - 1) * pageSize, page * pageSize);

  function changeSort(key: SortKey) {
    if (sort === key) setDescending((value) => !value);
    else {
      setSort(key);
      setDescending(true);
    }
    setPage(1);
  }

  function SortHeading({ label, field }: { label: string; field: SortKey }) {
    const Icon = sort === field ? (descending ? ArrowDown : ArrowUp) : null;
    return <button className="sort-heading" onClick={() => changeSort(field)}>{label}{Icon && <Icon size={12} />}</button>;
  }

  return (
    <section className="panel farmer-table-panel">
      <div className="panel-heading table-panel-heading">
        <div><h2>{paymentFilter ? "Outstanding balances" : "Recent farmer records"}</h2><p>{rows.length.toLocaleString("en-IN")} {rows.length === 1 ? "farmer" : "farmers"} in view</p></div>
        <SlidersHorizontal className="table-heading-icon" size={18} />
      </div>
      <div className="table-toolbar">
        <label className="search-field table-search"><Search size={16} /><input aria-label="Filter by name or village" placeholder="Name or village..." value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} /></label>
        <select aria-label="Filter by village" value={village} onChange={(event) => { setVillage(event.target.value); setPage(1); }}>
          {villages.map((item) => <option key={item}>{item}</option>)}
        </select>
        {paymentFilter && (
          <select aria-label="Filter payment balance" value={payment} onChange={(event) => { setPayment(event.target.value); setPage(1); }}>
            {["Any balance", "Outstanding only", "Above ₹40,000"].map((item) => <option key={item}>{item}</option>)}
          </select>
        )}
      </div>
      <div className="table-scroll">
        <table>
          <thead><tr>
            <th><SortHeading label="Farmer" field="farmer_name" /></th>
            <th>Village</th>
            <th className="align-right"><SortHeading label="Supplied" field="sugarcane_tons" /></th>
            <th className="align-right"><SortHeading label="Amount paid" field="amount_paid" /></th>
            <th className="align-right"><SortHeading label="Pending" field="payment_pending" /></th>
            <th>Status</th>
            <th><span className="sr-only">Actions</span></th>
          </tr></thead>
          <tbody>
            {pageRows.map((farmer, index) => (
              <tr key={`${farmer.farmer_name}-${farmer.village}-${index}`}>
                <td><div className="farmer-cell"><span className="farmer-avatar"><UserRound size={15} /></span><strong>{farmer.farmer_name}</strong></div></td>
                <td className="muted-cell">{farmer.village}</td>
                <td className="align-right numeric-cell">{tons.format(farmer.sugarcane_tons)} <span className="table-unit">t</span></td>
                <td className="align-right numeric-cell">{currency.format(farmer.amount_paid)}</td>
                <td className={`align-right numeric-cell ${farmer.payment_pending > 0 ? "pending-value" : ""}`}>{currency.format(farmer.payment_pending)}</td>
                <td><span className={`status-pill ${farmer.payment_pending > 0 ? "status-pill--pending" : "status-pill--paid"}`}><i />{farmer.payment_pending > 0 ? "Pending" : "Settled"}</span></td>
                <td><button className="row-action" aria-label={`View ${farmer.farmer_name} details`} title="Farmer details" onClick={() => setSelectedFarmer(farmer)}><ChevronRight size={17} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {pageRows.length === 0 && <div className="empty-state"><div className="empty-icon"><Search size={19} /></div><strong>No farmer records found</strong><span>Try a different name, village, or filter.</span></div>}
      </div>
      <div className="table-footer">
        <span>Showing {rows.length ? (page - 1) * pageSize + 1 : 0}–{Math.min(page * pageSize, rows.length)} of {rows.length}</span>
        <div className="pagination">
          <button aria-label="Previous page" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}><ChevronLeft size={16} /></button>
          <span>{page} / {pages}</span>
          <button aria-label="Next page" disabled={page >= pages} onClick={() => setPage((value) => value + 1)}><ChevronRight size={16} /></button>
        </div>
      </div>
      {selectedFarmer && (
        <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedFarmer(null); }}>
          <section className="farmer-dialog" role="dialog" aria-modal="true" aria-labelledby="farmer-dialog-title">
            <div className="farmer-dialog-heading">
              <div><span className="farmer-avatar farmer-avatar--large"><UserRound size={18} /></span><div><span className="settings-label">FARMER RECORD</span><h2 id="farmer-dialog-title">{selectedFarmer.farmer_name}</h2></div></div>
              <button className="dialog-close" aria-label="Close farmer details" onClick={() => setSelectedFarmer(null)}>×</button>
            </div>
            <div className="farmer-dialog-village">{selectedFarmer.village}</div>
            <div className="farmer-dialog-stats">
              <div><span>Sugarcane supplied</span><strong>{tons.format(selectedFarmer.sugarcane_tons)} tons</strong></div>
              <div><span>Amount paid</span><strong>{currency.format(selectedFarmer.amount_paid)}</strong></div>
              <div><span>Pending payment</span><strong className={selectedFarmer.payment_pending > 0 ? "pending-value" : ""}>{currency.format(selectedFarmer.payment_pending)}</strong></div>
            </div>
            <span className={`status-pill ${selectedFarmer.payment_pending > 0 ? "status-pill--pending" : "status-pill--paid"}`}><i />{selectedFarmer.payment_pending > 0 ? "Payment pending" : "Fully settled"}</span>
          </section>
        </div>
      )}
    </section>
  );
}

function matchesFarmer(farmer: Farmer, query: string): boolean {
  const text = query.trim().toLocaleLowerCase();
  return !text || farmer.farmer_name.toLocaleLowerCase().includes(text) || farmer.village.toLocaleLowerCase().includes(text);
}
