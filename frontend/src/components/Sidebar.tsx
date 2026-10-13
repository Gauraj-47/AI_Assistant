import {
  BarChart3,
  Bot,
  ChevronLeft,
  CircleDollarSign,
  LayoutDashboard,
  Leaf,
  Settings,
  UsersRound,
  X,
} from "lucide-react";
import { NavLink } from "react-router-dom";

interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

const navigation = [
  { label: "Dashboard", to: "/", icon: LayoutDashboard },
  { label: "Farmer records", to: "/farmers", icon: UsersRound },
  { label: "AI assistant", to: "/assistant", icon: Bot },
  { label: "Payment tracking", to: "/payments", icon: CircleDollarSign },
  { label: "Reports & analytics", to: "/reports", icon: BarChart3 },
  { label: "Settings", to: "/settings", icon: Settings },
];

export function Sidebar({ collapsed, mobileOpen, onToggle, onClose }: SidebarProps) {
  return (
    <>
      {mobileOpen && <button className="sidebar-scrim" onClick={onClose} aria-label="Close navigation" />}
      <aside
        className={`sidebar ${collapsed ? "sidebar--collapsed" : ""} ${mobileOpen ? "sidebar--open" : ""}`}
      >
        <div className="brand">
          <div className="brand-mark"><Leaf size={22} strokeWidth={2.2} /></div>
          {!collapsed && (
            <div className="brand-copy">
              <strong>Sanjivani</strong>
              <span>SUGAR FACTORY</span>
            </div>
          )}
          <button className="icon-button sidebar-close" onClick={onClose} aria-label="Close navigation">
            <X size={18} />
          </button>
        </div>

        <div className="sidebar-section-label">{!collapsed && "WORKSPACE"}</div>
        <nav className="side-nav" aria-label="Main navigation">
          {navigation.map(({ label, to, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              onClick={onClose}
              title={collapsed ? label : undefined}
              className={({ isActive }) => `side-link ${isActive ? "side-link--active" : ""}`}
            >
              <Icon size={19} strokeWidth={1.8} />
              {!collapsed && <span>{label}</span>}
              {label === "AI assistant" && !collapsed && <span className="nav-new">AI</span>}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="season-card">
            <div className="season-icon"><Leaf size={17} /></div>
            {!collapsed && (
              <div>
                <strong>Current season</strong>
                <span>Crushing is in progress</span>
              </div>
            )}
            <span className="season-dot" />
          </div>
          <button className="collapse-button" onClick={onToggle} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
            <ChevronLeft size={17} className={collapsed ? "chevron-flip" : ""} />
            {!collapsed && <span>Collapse menu</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
