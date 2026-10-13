export interface Farmer {
  farmer_name: string;
  village: string;
  sugarcane_tons: number;
  amount_paid: number;
  payment_pending: number;
}

export interface VillageSupply {
  village: string;
  tons: number;
}

export interface DashboardStats {
  totalFarmers: number;
  totalTons: number;
  totalPaid: number;
  totalPending: number;
  villageSupply: VillageSupply[];
}

export interface AppData {
  farmers: Farmer[];
  stats: DashboardStats | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  search: string;
}
