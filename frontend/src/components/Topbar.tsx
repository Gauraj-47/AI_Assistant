import { Bell, Menu, Search } from "lucide-react";

interface TopbarProps {
  title: string;
  search: string;
  onSearchChange: (value: string) => void;
  onMenuClick: () => void;
}

export function Topbar({ title, search, onSearchChange, onMenuClick }: TopbarProps) {
  const date = new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date());

  return (
    <header className="topbar">
      <div className="topbar-heading">
        <button className="icon-button menu-button" onClick={onMenuClick} aria-label="Open navigation">
          <Menu size={21} />
        </button>
        <div>
          <div className="breadcrumb">Sanjivani <span>/</span> {title}</div>
          <h1>{title}</h1>
        </div>
      </div>
      <div className="topbar-actions">
        <label className="search-field topbar-search">
          <Search size={17} />
          <input
            aria-label="Search farmers"
            placeholder="Search farmers or villages..."
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </label>
        <span className="topbar-date">{date}</span>
        <button className="icon-button notification-button" aria-label="Notifications">
          <Bell size={19} />
          <i />
        </button>
        <div className="profile-block">
          <div className="avatar">SF</div>
          <div className="profile-copy"><strong>Factory Admin</strong><span>Administrator</span></div>
        </div>
      </div>
    </header>
  );
}
