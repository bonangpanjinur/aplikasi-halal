import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, FolderOpen, FileText, Link2, TrendingUp, Eye, DollarSign, Wallet, Receipt, CreditCard, ArrowUpRight, ArrowDownRight, Clock, CalendarIcon } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useFieldAccess } from "@/hooks/useFieldAccess";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell,
  ResponsiveContainer, LabelList, CartesianGrid,
} from "recharts";
import type { Tables } from "@/integrations/supabase/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

type DataEntry = Tables<"data_entries">;

const STATUS_LABELS: Record<string, string> = {
  belum_lengkap: "Belum Lengkap",
  siap_input: "Siap Input",
  lengkap: "Lengkap",
  ktp_terdaftar_nib: "KTP Terdaftar NIB",
  terverifikasi: "Terverifikasi",
  nib_selesai: "NIB Selesai",
  ktp_terdaftar_sertifikat: "KTP Terdaftar Sertifikat",
  pengajuan: "Pengajuan",
  sertifikat_selesai: "Sertifikat Selesai",
  revisi: "Revisi",
};

const STATUS_COLORS: Record<string, string> = {
  belum_lengkap: "hsl(0 84% 60%)",
  siap_input: "hsl(45 93% 47%)",
  lengkap: "hsl(120 60% 50%)",
  ktp_terdaftar_nib: "hsl(30 90% 50%)",
  terverifikasi: "hsl(142 71% 45%)",
  nib_selesai: "hsl(200 80% 50%)",
  ktp_terdaftar_sertifikat: "hsl(15 85% 50%)",
  pengajuan: "hsl(270 60% 55%)",
  sertifikat_selesai: "hsl(160 84% 39%)",
  revisi: "hsl(340 75% 55%)",
};

const STATUS_BG: Record<string, string> = {
  belum_lengkap: "bg-red-100 dark:bg-red-950",
  siap_input: "bg-yellow-100 dark:bg-yellow-950",
  lengkap: "bg-lime-100 dark:bg-lime-950",
  ktp_terdaftar_nib: "bg-orange-100 dark:bg-orange-950",
  terverifikasi: "bg-green-100 dark:bg-green-950",
  nib_selesai: "bg-blue-100 dark:bg-blue-950",
  ktp_terdaftar_sertifikat: "bg-orange-100 dark:bg-orange-950",
  pengajuan: "bg-purple-100 dark:bg-purple-950",
  sertifikat_selesai: "bg-emerald-100 dark:bg-emerald-950",
  revisi: "bg-pink-100 dark:bg-pink-950",
};

const STATUS_TEXT: Record<string, string> = {
  belum_lengkap: "text-red-700 dark:text-red-400",
  siap_input: "text-yellow-700 dark:text-yellow-400",
  lengkap: "text-lime-700 dark:text-lime-400",
  terverifikasi: "text-green-700 dark:text-green-400",
  nib_selesai: "text-blue-700 dark:text-blue-400",
  pengajuan: "text-purple-700 dark:text-purple-400",
  sertifikat_selesai: "text-emerald-700 dark:text-emerald-400",
  revisi: "text-pink-700 dark:text-pink-400",
};

const STATUS_BADGE_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  belum_lengkap: "destructive",
  siap_input: "secondary",
  lengkap: "secondary",
  terverifikasi: "default",
  nib_selesai: "secondary",
  pengajuan: "outline",
  sertifikat_selesai: "default",
};

const pieChartConfig: ChartConfig = {
  belum_lengkap: { label: "Belum Lengkap", color: STATUS_COLORS.belum_lengkap },
  siap_input: { label: "Siap Input", color: STATUS_COLORS.siap_input },
  lengkap: { label: "Lengkap", color: STATUS_COLORS.lengkap },
  terverifikasi: { label: "Terverifikasi", color: STATUS_COLORS.terverifikasi },
  nib_selesai: { label: "NIB Selesai", color: STATUS_COLORS.nib_selesai },
  pengajuan: { label: "Pengajuan", color: STATUS_COLORS.pengajuan },
  sertifikat_selesai: { label: "Sertifikat Selesai", color: STATUS_COLORS.sertifikat_selesai },
  revisi: { label: "Revisi", color: STATUS_COLORS.revisi },
};

const statusBarConfig: ChartConfig = pieChartConfig;

const barChartConfig: ChartConfig = {
  count: { label: "Jumlah Entri", color: "hsl(var(--primary))" },
};

type GroupStat = { name: string; count: number };
type StatusStat = { status: string; label: string; count: number; fill: string };

const FIELD_LABELS: Record<string, string> = {
  nama: "Nama",
  alamat: "Alamat",
  nomor_hp: "No. HP",
  email: "Email",
  kata_sandi: "Kata Sandi",
  email_halal: "Email Halal",
  sandi_halal: "Sandi Halal",
  email_nib: "Email NIB",
  sandi_nib: "Sandi NIB",
  ktp: "KTP",
  nib: "NIB",
  foto_produk: "Foto Produk",
  foto_verifikasi: "Foto Verifikasi",
  sertifikat: "Sertifikat",
};

const FIELD_TO_COLUMN: Record<string, string> = {
  nama: "nama",
  alamat: "alamat",
  nomor_hp: "nomor_hp",
  email: "email",
  kata_sandi: "kata_sandi",
  email_halal: "email_halal",
  sandi_halal: "sandi_halal",
  email_nib: "email_nib",
  sandi_nib: "sandi_nib",
  ktp: "ktp_url",
  nib: "nib_url",
  foto_produk: "foto_produk_url",
  foto_verifikasi: "foto_verifikasi_url",
  sertifikat: "sertifikat_url",
};

export default function Dashboard() {
  const { role, user } = useAuth();
  const { fields, canView } = useFieldAccess();
  const [stats, setStats] = useState({ groups: 0, entries: 0, users: 0, links: 0 });
  const [statusData, setStatusData] = useState<StatusStat[]>([]);
  const [groupData, setGroupData] = useState<GroupStat[]>([]);
  const [recentEntries, setRecentEntries] = useState<DataEntry[]>([]);

  // Admin performance state (super_admin)
  const [adminPerformance, setAdminPerformance] = useState<{ name: string; email: string; role: string; count: number; sertifikat: number }[]>([]);
  const [perfMonth, setPerfMonth] = useState<number>(new Date().getMonth()); // 0-11
  const [perfYear, setPerfYear] = useState<number>(new Date().getFullYear());
  const [perfFilterAll, setPerfFilterAll] = useState(true); // true = semua periode

  // Financial state (super_admin)
  const [financeStats, setFinanceStats] = useState({
    totalBilling: 0,
    activeBilling: 0,
    totalCommissions: 0,
    pendingCommissions: 0,
    paidCommissions: 0,
    totalDisbursements: 0,
    pendingDisbursements: 0,
    approvedDisbursements: 0,
  });
  const [billingData, setBillingData] = useState<any[]>([]);
  const [commissionByRole, setCommissionByRole] = useState<{ role: string; amount: number }[]>([]);

  const visibleFields = fields.filter((f) => f.can_view);

  useEffect(() => {
    const fetchStats = async () => {
      const isFullAccess = role === "super_admin" || role === "owner";
      let entriesQuery = supabase.from("data_entries").select("id", { count: "exact", head: true });
      if (!isFullAccess && user) entriesQuery = entriesQuery.eq("created_by", user.id);

      const [groupsRes, entriesRes] = await Promise.all([
        supabase.from("groups").select("id", { count: "exact", head: true }),
        entriesQuery,
      ]);

      let usersCount = 0;
      let linksCount = 0;

      if (role === "super_admin" || role === "owner") {
        const { count } = await supabase.from("profiles").select("id", { count: "exact", head: true });
        usersCount = count ?? 0;
      }

      const { count: linkCount } = await supabase
        .from("shared_links")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user?.id ?? "");
      linksCount = linkCount ?? 0;

      setStats({
        groups: groupsRes.count ?? 0,
        entries: entriesRes.count ?? 0,
        users: usersCount,
        links: linksCount,
      });
    };

    const fetchChartData = async () => {
      const isFullAccess = role === "super_admin" || role === "owner";
      let statusQuery = supabase.from("data_entries").select("status");
      if (!isFullAccess && user) statusQuery = statusQuery.eq("created_by", user.id);
      const { data: entries } = await statusQuery;
      if (entries) {
        const counts: Record<string, number> = {};
        entries.forEach((e) => { counts[e.status] = (counts[e.status] || 0) + 1; });
        setStatusData(
          Object.entries(counts).map(([status, count]) => ({
            status,
            label: STATUS_LABELS[status] || status,
            count,
            fill: STATUS_COLORS[status] || "hsl(var(--primary))",
          }))
        );
      }

      let groupQuery = supabase.from("data_entries").select("group_id, groups(name)");
      if (!isFullAccess && user) groupQuery = groupQuery.eq("created_by", user.id);
      const { data: entryGroups } = await groupQuery;
      if (entryGroups) {
        const groupCounts: Record<string, { name: string; count: number }> = {};
        entryGroups.forEach((e: any) => {
          const gid = e.group_id;
          if (!groupCounts[gid]) groupCounts[gid] = { name: e.groups?.name || "Unknown", count: 0 };
          groupCounts[gid].count++;
        });
        setGroupData(Object.values(groupCounts).sort((a, b) => b.count - a.count).slice(0, 10));
      }
    };

    const fetchRecentEntries = async () => {
      const isFullAccess = role === "super_admin" || role === "owner";
      let recentQuery = supabase
        .from("data_entries")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);
      if (!isFullAccess && user) recentQuery = recentQuery.eq("created_by", user.id);
      const { data } = await recentQuery;
      setRecentEntries(data ?? []);
    };

    const fetchAdminPerformance = async () => {
      if (role !== "super_admin") return;
      let query = supabase.from("data_entries").select("created_by, status, created_at");
      if (!perfFilterAll) {
        const startDate = new Date(perfYear, perfMonth, 1).toISOString();
        const endDate = new Date(perfYear, perfMonth + 1, 1).toISOString();
        query = query.gte("created_at", startDate).lt("created_at", endDate);
      }
      const { data: entries } = await query;
      if (!entries || entries.length === 0) { setAdminPerformance([]); return; }

      const byUser: Record<string, { count: number; sertifikat: number }> = {};
      entries.forEach((e: any) => {
        if (!e.created_by) return;
        if (!byUser[e.created_by]) byUser[e.created_by] = { count: 0, sertifikat: 0 };
        byUser[e.created_by].count++;
        if (e.status === "sertifikat_selesai") byUser[e.created_by].sertifikat++;
      });

      const userIds = Object.keys(byUser);
      if (userIds.length === 0) { setAdminPerformance([]); return; }

      const [profilesRes, rolesRes] = await Promise.all([
        supabase.from("profiles").select("id, full_name, email").in("id", userIds),
        supabase.from("user_roles").select("user_id, role").in("user_id", userIds),
      ]);

      const profileMap: Record<string, { name: string; email: string }> = {};
      (profilesRes.data ?? []).forEach((p: any) => {
        profileMap[p.id] = { name: p.full_name || "", email: p.email || "" };
      });
      const roleMap: Record<string, string> = {};
      (rolesRes.data ?? []).forEach((r: any) => { roleMap[r.user_id] = r.role; });

      const result = userIds.map((uid) => ({
        name: profileMap[uid]?.name || profileMap[uid]?.email || uid.slice(0, 8),
        email: profileMap[uid]?.email || "",
        role: roleMap[uid] || "unknown",
        count: byUser[uid].count,
        sertifikat: byUser[uid].sertifikat,
      })).sort((a, b) => b.count - a.count);

      setAdminPerformance(result);
    };

    const fetchFinancials = async () => {
      if (role !== "super_admin") return;

      // Billing data
      const { data: billings } = await supabase
        .from("platform_billing")
        .select("*, profiles:owner_user_id(full_name, email)")
        .order("created_at", { ascending: false });

      const bills = billings ?? [];
      const activeBills = bills.filter((b: any) => b.status === "active");
      const totalBillingAmount = bills.reduce((sum: number, b: any) => sum + (b.amount || 0), 0);

      setBillingData(bills.map((b: any) => ({
        owner: b.profiles?.full_name || b.profiles?.email || "Unknown",
        type: b.billing_type,
        amount: b.amount,
        status: b.status,
        trial_days: b.trial_days,
        trial_start: b.trial_start,
      })));

      // Commissions
      const { data: commissions } = await supabase.from("commissions").select("*");
      const comms = commissions ?? [];
      const totalComm = comms.reduce((s: number, c: any) => s + (c.amount || 0), 0);
      const pendingComm = comms.filter((c: any) => c.status === "pending").reduce((s: number, c: any) => s + (c.amount || 0), 0);
      const paidComm = comms.filter((c: any) => c.status === "paid").reduce((s: number, c: any) => s + (c.amount || 0), 0);

      // Commission by user role
      const commUserIds = [...new Set(comms.map((c: any) => c.user_id))];
      if (commUserIds.length > 0) {
        const { data: roles } = await supabase.from("user_roles").select("user_id, role").in("user_id", commUserIds);
        const roleMap: Record<string, string> = {};
        (roles ?? []).forEach((r: any) => { roleMap[r.user_id] = r.role; });
        const byRole: Record<string, number> = {};
        comms.forEach((c: any) => {
          const r = roleMap[c.user_id] || "unknown";
          byRole[r] = (byRole[r] || 0) + (c.amount || 0);
        });
        setCommissionByRole(Object.entries(byRole).map(([role, amount]) => ({ role, amount })));
      }

      // Disbursements
      const { data: disbursements } = await supabase.from("disbursements").select("*");
      const disb = disbursements ?? [];
      const totalDisb = disb.reduce((s: number, d: any) => s + (d.amount || 0), 0);
      const pendingDisb = disb.filter((d: any) => d.status === "pending").reduce((s: number, d: any) => s + (d.amount || 0), 0);
      const approvedDisb = disb.filter((d: any) => d.status === "approved").reduce((s: number, d: any) => s + (d.amount || 0), 0);

      setFinanceStats({
        totalBilling: totalBillingAmount,
        activeBilling: activeBills.length,
        totalCommissions: totalComm,
        pendingCommissions: pendingComm,
        paidCommissions: paidComm,
        totalDisbursements: totalDisb,
        pendingDisbursements: pendingDisb,
        approvedDisbursements: approvedDisb,
      });
    };

    fetchStats();
    fetchChartData();
    fetchRecentEntries();
    fetchFinancials();
    fetchAdminPerformance();
  }, [role, user, perfMonth, perfYear, perfFilterAll]);

  const cards = [
    { label: "Group Halal", value: stats.groups, icon: FolderOpen, show: true },
    { label: "Data Entri", value: stats.entries, icon: FileText, show: true },
    { label: "Total User", value: stats.users, icon: Users, show: role === "super_admin" || role === "owner" },
    { label: "Link Aktif", value: stats.links, icon: Link2, show: true },
  ];
  const formatRupiah = (n: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

  const BILLING_TYPE_LABELS: Record<string, string> = {
    per_sertifikat: "Per Sertifikat",
    per_bulan: "Per Bulan",
    per_group: "Per Group",
  };

  const commissionBarConfig: ChartConfig = {
    amount: { label: "Komisi", color: "hsl(var(--primary))" },
  };

  const totalEntries = statusData.reduce((s, d) => s + d.count, 0);

  const statusBarData = statusData.map((s) => ({
    label: s.label,
    count: s.count,
    status: s.status,
    persen: totalEntries > 0 ? Math.round((s.count / totalEntries) * 100) : 0,
  }));

  const getCellValue = (entry: DataEntry, fieldName: string) => {
    const col = FIELD_TO_COLUMN[fieldName];
    if (!col) return "-";
    const val = (entry as any)[col];
    if (!val) return "-";
    // For URL fields, show indicator
    if (col.endsWith("_url")) {
      return val ? "✓" : "-";
    }
    return val;
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">
        Dashboard {role && <span className="text-base font-normal text-muted-foreground capitalize">({role.replace("_", " ")})</span>}
      </h1>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {cards.filter(c => c.show).map((card) => (
          <Card key={card.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Financial Dashboard - Super Admin Only */}
      {role === "super_admin" && (
        <>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <DollarSign className="h-5 w-5" /> Laporan Keuangan & Pendapatan
          </h2>

          {/* Finance Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
            <Card className="border-l-4 border-l-emerald-500">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Billing</CardTitle>
                <Wallet className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatRupiah(financeStats.totalBilling)}</p>
                <p className="text-xs text-muted-foreground mt-1">{financeStats.activeBilling} owner aktif</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Komisi</CardTitle>
                <Receipt className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatRupiah(financeStats.totalCommissions)}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Pending: {formatRupiah(financeStats.pendingCommissions)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Komisi Dibayar</CardTitle>
                <ArrowUpRight className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatRupiah(financeStats.paidCommissions)}</p>
                <p className="text-xs text-muted-foreground mt-1">Sudah dibayarkan</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pencairan</CardTitle>
                <CreditCard className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatRupiah(financeStats.totalDisbursements)}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Pending: {formatRupiah(financeStats.pendingDisbursements)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Finance Charts Row */}
          <div className="grid gap-6 lg:grid-cols-2 mb-6">
            {/* Commission by Role Chart */}
            {commissionByRole.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Receipt className="h-4 w-4" /> Komisi per Role
                  </CardTitle>
                  <CardDescription>Total komisi yang dihasilkan berdasarkan role</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={commissionBarConfig} className="max-h-[260px]">
                    <BarChart data={commissionByRole} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid vertical={false} className="stroke-muted" />
                      <XAxis dataKey="role" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                      <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                      <ChartTooltip content={<ChartTooltipContent />} formatter={(value) => [formatRupiah(Number(value)), ""]} />
                      <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]}>
                        <LabelList dataKey="amount" position="top" style={{ fontSize: 11, fontWeight: 600, fill: "hsl(var(--foreground))" }} formatter={(v: number) => formatRupiah(v)} />
                      </Bar>
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            )}

            {/* Billing Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Wallet className="h-4 w-4" /> Billing Owner
                </CardTitle>
                <CardDescription>Status billing setiap owner</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {billingData.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">Belum ada data billing</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Owner</TableHead>
                          <TableHead>Tipe</TableHead>
                          <TableHead>Jumlah</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {billingData.slice(0, 10).map((b, i) => (
                          <TableRow key={i}>
                            <TableCell className="text-sm font-medium">{b.owner}</TableCell>
                            <TableCell className="text-sm">{BILLING_TYPE_LABELS[b.type] || b.type}</TableCell>
                            <TableCell className="text-sm">{formatRupiah(b.amount)}</TableCell>
                            <TableCell>
                              <Badge variant={b.status === "active" ? "default" : "secondary"}>
                                {b.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Admin Performance Ranking */}
          {adminPerformance.length > 0 && (
            <div className="grid gap-6 lg:grid-cols-2 mb-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="h-4 w-4" /> Ranking Kinerja Admin
                  </CardTitle>
                  <CardDescription>Peringkat berdasarkan jumlah data yang diinput</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={{ count: { label: "Total Input", color: "hsl(var(--primary))" } }} className="max-h-[320px]">
                    <BarChart data={adminPerformance.slice(0, 10)} layout="vertical" margin={{ left: 10, right: 40 }}>
                      <CartesianGrid horizontal={false} className="stroke-muted" />
                      <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                      <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]}>
                        <LabelList dataKey="count" position="right" style={{ fontSize: 12, fontWeight: 600, fill: "hsl(var(--foreground))" }} />
                      </Bar>
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" /> Detail Kinerja Per User
                  </CardTitle>
                  <CardDescription>Total input & sertifikat selesai per user</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-10">#</TableHead>
                          <TableHead>Nama</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead className="text-right">Input</TableHead>
                          <TableHead className="text-right">Sertifikat</TableHead>
                          <TableHead className="text-right">Rate</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {adminPerformance.slice(0, 15).map((p, i) => (
                          <TableRow key={i}>
                            <TableCell className="font-bold text-muted-foreground">{i + 1}</TableCell>
                            <TableCell>
                              <div className="text-sm font-medium">{p.name || p.email}</div>
                              {p.name && <div className="text-xs text-muted-foreground">{p.email}</div>}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize text-xs">{p.role.replace("_", " ")}</Badge>
                            </TableCell>
                            <TableCell className="text-right font-semibold">{p.count}</TableCell>
                            <TableCell className="text-right font-semibold">{p.sertifikat}</TableCell>
                            <TableCell className="text-right text-xs text-muted-foreground">
                              {p.count > 0 ? Math.round((p.sertifikat / p.count) * 100) : 0}%
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}

      {/* Status Stats Cards */}
      {totalEntries > 0 && (
        <div className="grid gap-4 sm:grid-cols-3 mb-8">
          {statusData.map((s) => (
            <Card key={s.status} className={`border-0 ${STATUS_BG[s.status]}`}>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className={`text-xs font-medium mb-1 ${STATUS_TEXT[s.status]}`}>{s.label}</p>
                    <p className={`text-3xl font-bold ${STATUS_TEXT[s.status]}`}>{s.count}</p>
                    <p className={`text-xs mt-1 ${STATUS_TEXT[s.status]} opacity-70`}>
                      {totalEntries > 0 ? Math.round((s.count / totalEntries) * 100) : 0}% dari total
                    </p>
                  </div>
                  <div
                    className="h-10 w-10 rounded-full flex items-center justify-center opacity-30"
                    style={{ backgroundColor: s.fill }}
                  />
                </div>
                <div className="mt-3 h-1.5 w-full rounded-full bg-black/10 dark:bg-white/10">
                  <div
                    className="h-1.5 rounded-full transition-all duration-700"
                    style={{
                      width: `${totalEntries > 0 ? (s.count / totalEntries) * 100 : 0}%`,
                      backgroundColor: s.fill,
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Charts Row */}
      {totalEntries > 0 && (
        <div className="grid gap-6 lg:grid-cols-2 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Jumlah Entri per Status
              </CardTitle>
              <CardDescription>Total {totalEntries} entri terdaftar</CardDescription>
            </CardHeader>
            <CardContent>
              {totalEntries === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">Belum ada data</p>
              ) : (
                <ChartContainer config={statusBarConfig} className="max-h-[260px]">
                  <BarChart data={statusBarData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid vertical={false} className="stroke-muted" />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                    <ChartTooltip content={<ChartTooltipContent />} formatter={(value) => [`${value} entri`, ""]} />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {statusBarData.map((entry) => (
                        <Cell key={entry.status} fill={STATUS_COLORS[entry.status]} />
                      ))}
                      <LabelList dataKey="count" position="top" style={{ fontSize: 13, fontWeight: 600, fill: "hsl(var(--foreground))" }} />
                    </Bar>
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Distribusi Status Entri</CardTitle>
              <CardDescription>Proporsi setiap status dalam persentase</CardDescription>
            </CardHeader>
            <CardContent>
              {totalEntries === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">Belum ada data</p>
              ) : (
                <ChartContainer config={pieChartConfig} className="mx-auto aspect-square max-h-[250px]">
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent nameKey="label" />} />
                    <Pie data={statusData} dataKey="count" nameKey="label" cx="50%" cy="50%" innerRadius={55} outerRadius={95} strokeWidth={2}>
                      {statusData.map((entry) => (
                        <Cell key={entry.status} fill={entry.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
              )}
              {totalEntries > 0 && (
                <div className="flex flex-wrap justify-center gap-4 mt-2">
                  {statusData.map((s) => (
                    <div key={s.status} className="flex items-center gap-1.5 text-sm">
                      <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: s.fill }} />
                      <span className="text-muted-foreground">{s.label}</span>
                      <span className="font-semibold">{Math.round((s.count / totalEntries) * 100)}%</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Group Bar Chart */}
      {groupData.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Jumlah Entri per Group</CardTitle>
            <CardDescription>Top {groupData.length} group berdasarkan jumlah data</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={barChartConfig} className="max-h-[320px]">
              <BarChart data={groupData} layout="vertical" margin={{ left: 10, right: 30 }}>
                <CartesianGrid horizontal={false} className="stroke-muted" />
                <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" width={130} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]}>
                  <LabelList dataKey="count" position="right" style={{ fontSize: 12, fontWeight: 600, fill: "hsl(var(--foreground))" }} />
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {/* Recent Data Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Data Entri Terbaru
          </CardTitle>
          <CardDescription>10 data entri terakhir yang bisa Anda akses</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {recentEntries.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Belum ada data entri</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {visibleFields.map((f) => (
                      <TableHead key={f.field_name}>{FIELD_LABELS[f.field_name] || f.field_name}</TableHead>
                    ))}
                    <TableHead>Status</TableHead>
                    <TableHead>Tanggal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      {visibleFields.map((f) => (
                        <TableCell key={f.field_name} className="text-sm">
                          {getCellValue(entry, f.field_name)}
                        </TableCell>
                      ))}
                      <TableCell>
                        <Badge variant={STATUS_BADGE_VARIANT[entry.status] || "outline"}>
                          {STATUS_LABELS[entry.status] || entry.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(entry.created_at).toLocaleDateString("id-ID")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
