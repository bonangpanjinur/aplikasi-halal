import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Receipt, CreditCard, Users, Clock, Wallet } from "lucide-react";

const BILLING_TYPE_LABELS: Record<string, string> = {
  per_sertifikat: "Per Sertifikat",
  per_bulan: "Per Bulan",
  per_group: "Per Group",
};

const formatRp = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

export default function Tagihan() {
  const { user } = useAuth();
  const [billingRecords, setBillingRecords] = useState<any[]>([]);
  const [roleCommissions, setRoleCommissions] = useState<{ role: string; pending: number; paid: number; total: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setLoading(true);

      // 1. Platform billing for this owner
      const { data: billing } = await supabase
        .from("platform_billing")
        .select("*")
        .eq("owner_user_id", user.id)
        .order("created_at", { ascending: false });
      setBillingRecords(billing ?? []);

      // 2. Commissions for users in owner's groups
      const { data: groups } = await supabase
        .from("groups")
        .select("id")
        .eq("created_by", user.id);
      const groupIds = (groups ?? []).map((g) => g.id);

      if (groupIds.length > 0) {
        const { data: commissions } = await supabase
          .from("commissions")
          .select("user_id, amount, status")
          .in("group_id", groupIds);

        if (commissions && commissions.length > 0) {
          const userIds = [...new Set(commissions.map((c) => c.user_id))];
          const { data: roles } = await supabase
            .from("user_roles")
            .select("user_id, role")
            .in("user_id", userIds);
          const roleMap: Record<string, string> = {};
          (roles ?? []).forEach((r: any) => { roleMap[r.user_id] = r.role; });

          const byRole: Record<string, { pending: number; paid: number; total: number }> = {};
          commissions.forEach((c) => {
            const r = roleMap[c.user_id] || "unknown";
            if (!byRole[r]) byRole[r] = { pending: 0, paid: 0, total: 0 };
            byRole[r].total += c.amount;
            if (c.status === "pending") byRole[r].pending += c.amount;
            else if (c.status === "paid") byRole[r].paid += c.amount;
          });

          setRoleCommissions(
            Object.entries(byRole).map(([role, data]) => ({ role, ...data }))
          );
        }
      }

      setLoading(false);
    };
    fetchData();
  }, [user]);

  const totalPlatformBilling = billingRecords.reduce((s, b) => s + (b.amount || 0), 0);
  const totalRoleCommissions = roleCommissions.reduce((s, r) => s + r.total, 0);
  const totalPendingCommissions = roleCommissions.reduce((s, r) => s + r.pending, 0);

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-muted-foreground">Memuat...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Tagihan</h1>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-blue-500/10 p-2">
              <CreditCard className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Tagihan Platform</p>
              <p className="text-lg font-bold">{formatRp(totalPlatformBilling)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-orange-500/10 p-2">
              <Wallet className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Komisi Role</p>
              <p className="text-lg font-bold">{formatRp(totalRoleCommissions)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-yellow-500/10 p-2">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Komisi Belum Cair</p>
              <p className="text-lg font-bold">{formatRp(totalPendingCommissions)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="platform">
        <TabsList>
          <TabsTrigger value="platform" className="gap-2">
            <Receipt className="h-4 w-4" /> Tagihan ke Aplikasi
          </TabsTrigger>
          <TabsTrigger value="roles" className="gap-2">
            <Users className="h-4 w-4" /> Tagihan ke Role
          </TabsTrigger>
        </TabsList>

        <TabsContent value="platform" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tagihan Platform</CardTitle>
              <CardDescription>Biaya yang diatur oleh Super Admin untuk penggunaan aplikasi</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {billingRecords.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Belum ada tagihan platform</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Jenis Billing</TableHead>
                      <TableHead>Tarif</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Trial</TableHead>
                      <TableHead>Tanggal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {billingRecords.map((b: any) => {
                      const trialEnd = b.trial_start
                        ? new Date(new Date(b.trial_start).getTime() + (b.trial_days ?? 7) * 86400000)
                        : null;
                      const trialRemaining = trialEnd
                        ? Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / 86400000))
                        : null;
                      return (
                        <TableRow key={b.id}>
                          <TableCell className="font-medium">
                            {BILLING_TYPE_LABELS[b.billing_type] || b.billing_type}
                          </TableCell>
                          <TableCell className="font-mono">{formatRp(b.amount)}</TableCell>
                          <TableCell>
                            <Badge variant={b.status === "active" ? "default" : "secondary"}>
                              {b.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {trialRemaining !== null ? (
                              <Badge variant={trialRemaining > 0 ? "outline" : "destructive"}>
                                {trialRemaining > 0 ? `${trialRemaining} hari tersisa` : "Expired"}
                              </Badge>
                            ) : "-"}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(b.created_at).toLocaleDateString("id-ID")}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Komisi per Role</CardTitle>
              <CardDescription>Ringkasan komisi yang harus dibayarkan ke user berdasarkan role</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {roleCommissions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Belum ada data komisi</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Role</TableHead>
                      <TableHead>Total Komisi</TableHead>
                      <TableHead>Pending</TableHead>
                      <TableHead>Sudah Dibayar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roleCommissions.map((r) => (
                      <TableRow key={r.role}>
                        <TableCell className="font-medium capitalize">{r.role.replace("_", " ")}</TableCell>
                        <TableCell className="font-mono">{formatRp(r.total)}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{formatRp(r.pending)}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="default">{formatRp(r.paid)}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
