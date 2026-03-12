import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Clock, CheckCircle2, ShieldCheck, FileCheck, Send, Award,
  AlertTriangle, Search, Bell, Check, Download, MessageCircle,
  ChevronDown, ChevronUp, History
} from "lucide-react";
import { Link } from "react-router-dom";

const STATUS_STEPS = [
  { key: "belum_lengkap", label: "Data Terisi", description: "Data UMKM telah diinput ke sistem", icon: Clock },
  { key: "siap_input", label: "Siap Input", description: "Data lengkap dan siap diproses", icon: CheckCircle2 },
  { key: "terverifikasi", label: "Terverifikasi", description: "Data telah diverifikasi oleh admin", icon: ShieldCheck },
  { key: "nib_selesai", label: "NIB Selesai", description: "NIB telah diupload dan diverifikasi", icon: FileCheck },
  { key: "pengajuan", label: "Pengajuan", description: "Dokumen sertifikasi sedang diajukan", icon: Send },
  { key: "sertifikat_selesai", label: "Sertifikat Selesai", description: "Sertifikat halal telah terbit", icon: Award },
];

const STATUS_ORDER: Record<string, number> = {};
STATUS_STEPS.forEach((s, i) => { STATUS_ORDER[s.key] = i; });

const WARNING_STATUSES: Record<string, string> = {
  ktp_terdaftar_nib: "KTP Terdaftar NIB",
  ktp_terdaftar_sertifikat: "KTP Terdaftar Sertifikat",
};

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof Clock }> = {
  belum_lengkap: { label: "Belum Lengkap", variant: "destructive", icon: Clock },
  siap_input: { label: "Siap Input", variant: "secondary", icon: CheckCircle2 },
  lengkap: { label: "Lengkap", variant: "secondary", icon: CheckCircle2 },
  ktp_terdaftar_nib: { label: "KTP Terdaftar NIB", variant: "destructive", icon: AlertTriangle },
  terverifikasi: { label: "Terverifikasi", variant: "default", icon: ShieldCheck },
  nib_selesai: { label: "NIB Selesai", variant: "secondary", icon: FileCheck },
  ktp_terdaftar_sertifikat: { label: "KTP Terdaftar Sertifikat", variant: "destructive", icon: AlertTriangle },
  pengajuan: { label: "Pengajuan", variant: "outline", icon: Send },
  sertifikat_selesai: { label: "Sertifikat Selesai", variant: "default", icon: Award },
};

interface UmkmEntry {
  id: string;
  nama: string | null;
  status: string;
  tracking_code: string | null;
  nib_url: string | null;
  sertifikat_url: string | null;
  created_at: string;
  created_by: string | null;
}

interface OfficerProfile {
  id: string;
  full_name: string | null;
  phone: string | null;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface AuditLog {
  id: string;
  entry_id: string;
  old_status: string | null;
  new_status: string;
  changed_at: string;
  changed_by: string | null;
}

function VerticalTimeline({ status, auditLogs }: { status: string; auditLogs: AuditLog[] }) {
  const isWarning = status in WARNING_STATUSES;
  const currentIndex = isWarning ? -1 : (STATUS_ORDER[status] ?? -1);
  const progressPercent = Math.round(((currentIndex + 1) / STATUS_STEPS.length) * 100);

  const [showHistory, setShowHistory] = useState(false);

  return (
    <div className="mt-4">
      {isWarning && (
        <div className="flex items-center gap-2 mb-3 rounded-lg bg-destructive/10 border border-destructive/20 p-2.5">
          <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
          <span className="text-sm text-destructive font-medium">{WARNING_STATUSES[status]}</span>
        </div>
      )}

      {/* Progress bar summary */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-700 ease-out rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <span className="text-xs text-muted-foreground font-medium shrink-0">{progressPercent}%</span>
      </div>

      {/* Vertical steps */}
      <div className="space-y-0">
        {STATUS_STEPS.map((step, idx) => {
          const isComplete = idx <= currentIndex;
          const isCurrent = idx === currentIndex;
          const StepIcon = step.icon;
          return (
            <div key={step.key} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-500 ${
                    isComplete
                      ? "border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                      : isCurrent
                      ? "border-primary/50 bg-primary/10 text-primary"
                      : "border-muted-foreground/20 bg-muted text-muted-foreground/40"
                  }`}
                >
                  {isComplete ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <StepIcon className="h-3.5 w-3.5" />
                  )}
                </div>
                {idx < STATUS_STEPS.length - 1 && (
                  <div
                    className={`w-0.5 flex-1 min-h-[28px] transition-colors duration-500 ${
                      isComplete ? "bg-primary" : "bg-muted-foreground/15"
                    }`}
                  />
                )}
              </div>
              <div className={`pb-5 pt-0.5 ${idx === STATUS_STEPS.length - 1 ? "pb-0" : ""}`}>
                <p className={`font-medium text-sm leading-tight ${
                  isComplete ? "text-foreground" : isCurrent ? "text-foreground/80" : "text-muted-foreground"
                }`}>
                  {step.label}
                  {isCurrent && (
                    <Badge variant="outline" className="ml-2 text-[10px] px-1.5 py-0">Saat ini</Badge>
                  )}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                {isComplete && (
                  <p className="text-[11px] text-primary mt-0.5 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Selesai
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Audit log history */}
      {auditLogs.length > 0 && (
        <div className="mt-4 border-t pt-3">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors w-full"
          >
            <History className="h-3.5 w-3.5" />
            <span className="font-medium">Riwayat Perubahan ({auditLogs.length})</span>
            {showHistory ? <ChevronUp className="h-3 w-3 ml-auto" /> : <ChevronDown className="h-3 w-3 ml-auto" />}
          </button>
          {showHistory && (
            <div className="mt-2 space-y-1.5 max-h-40 overflow-y-auto">
              {auditLogs.map((log) => {
                const oldLabel = STATUS_CONFIG[log.old_status ?? ""]?.label || log.old_status || "—";
                const newLabel = STATUS_CONFIG[log.new_status]?.label || log.new_status;
                return (
                  <div key={log.id} className="text-xs flex items-start gap-2 py-1 px-2 rounded bg-muted/50">
                    <span className="text-muted-foreground shrink-0">
                      {new Date(log.changed_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                    </span>
                    <span>
                      {oldLabel} → <span className="font-medium">{newLabel}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function UmkmDashboard() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<UmkmEntry[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [officers, setOfficers] = useState<Record<string, OfficerProfile>>({});
  const [auditLogs, setAuditLogs] = useState<Record<string, AuditLog[]>>({});
  const [loading, setLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const [entriesRes, notifRes] = await Promise.all([
        supabase
          .from("data_entries")
          .select("id, nama, status, tracking_code, nib_url, sertifikat_url, created_at, created_by")
          .eq("umkm_user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("notifications")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(20),
      ]);
      const entriesData = (entriesRes.data ?? []) as UmkmEntry[];
      setEntries(entriesData);
      setNotifications((notifRes.data as unknown as Notification[]) ?? []);

      const entryIds = entriesData.map(e => e.id);
      const officerIds = [...new Set(entriesData.map(e => e.created_by).filter(Boolean))] as string[];

      const promises: Promise<any>[] = [];

      if (officerIds.length > 0) {
        promises.push(
          supabase.from("profiles").select("id, full_name, phone").in("id", officerIds)
        );
      }

      if (entryIds.length > 0) {
        promises.push(
          supabase.from("audit_logs").select("id, entry_id, old_status, new_status, changed_at, changed_by")
            .in("entry_id", entryIds)
            .order("changed_at", { ascending: false })
        );
      }

      const results = await Promise.all(promises);
      let resultIdx = 0;

      if (officerIds.length > 0) {
        const profiles = results[resultIdx]?.data ?? [];
        const map: Record<string, OfficerProfile> = {};
        profiles.forEach((p: any) => { map[p.id] = p; });
        setOfficers(map);
        resultIdx++;
      }

      if (entryIds.length > 0) {
        const logs = (results[resultIdx]?.data ?? []) as AuditLog[];
        const logMap: Record<string, AuditLog[]> = {};
        logs.forEach((l) => {
          if (!logMap[l.entry_id]) logMap[l.entry_id] = [];
          logMap[l.entry_id].push(l);
        });
        setAuditLogs(logMap);
      }

      setLoading(false);
    };
    fetchData();

    const channel = supabase
      .channel("umkm-notif-dashboard")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, (payload) => {
        setNotifications((prev) => [payload.new as unknown as Notification, ...prev]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const markAsRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true } as any).eq("id", id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  };

  const markAllAsRead = async () => {
    if (!user) return;
    await supabase.from("notifications").update({ is_read: true } as any).eq("user_id", user.id).eq("is_read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const getStatusConfig = (status: string) => STATUS_CONFIG[status] || { label: status, variant: "outline" as const, icon: Clock };

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-muted-foreground">Memuat data...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Status UMKM Saya</h1>
        <Button
          variant={showNotifications ? "default" : "outline"}
          size="sm"
          className="gap-2 relative"
          onClick={() => setShowNotifications(!showNotifications)}
        >
          <Bell className="h-4 w-4" />
          Notifikasi
          {unreadCount > 0 && (
            <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </div>

      {showNotifications && (
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Notifikasi</CardTitle>
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs gap-1">
                  <Check className="h-3 w-3" /> Tandai semua dibaca
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {notifications.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Belum ada notifikasi</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`flex items-start gap-3 rounded-lg p-3 text-sm cursor-pointer transition-colors ${
                      n.is_read ? "bg-muted/30" : "bg-primary/5 border border-primary/20"
                    }`}
                    onClick={() => !n.is_read && markAsRead(n.id)}
                  >
                    <Bell className={`h-4 w-4 mt-0.5 shrink-0 ${n.is_read ? "text-muted-foreground" : "text-primary"}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`${n.is_read ? "text-muted-foreground" : "font-medium"}`}>{n.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(n.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    {!n.is_read && <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {entries.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">Belum ada data terdaftar untuk akun Anda.</p>
            <p className="text-sm text-muted-foreground">Hubungi petugas lapangan untuk mendaftarkan data UMKM Anda.</p>
            <div className="mt-6">
              <Link to="/tracking">
                <Button variant="outline" className="gap-2">
                  <Search className="h-4 w-4" />
                  Cek Status dengan Kode Tracking
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => {
            const cfg = getStatusConfig(entry.status);
            const StatusIcon = cfg.icon;
            return (
              <Card key={entry.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{entry.nama || "Tanpa Nama"}</CardTitle>
                    <Badge variant={cfg.variant} className="gap-1">
                      <StatusIcon className="h-3 w-3" />
                      {cfg.label}
                    </Badge>
                  </div>
                  {entry.tracking_code && (
                    <CardDescription className="font-mono text-xs">{entry.tracking_code}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  {/* Vertical Progress Timeline */}
                  <VerticalTimeline
                    status={entry.status}
                    auditLogs={auditLogs[entry.id] ?? []}
                  />

                  <div className="grid grid-cols-2 gap-4 text-sm mt-4">
                    <div>
                      <span className="text-muted-foreground">NIB:</span>{" "}
                      {entry.nib_url ? (
                        <a href={entry.nib_url} target="_blank" rel="noopener noreferrer" className="text-primary underline">Lihat NIB</a>
                      ) : (
                        <span className="text-muted-foreground">Belum ada</span>
                      )}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Sertifikat:</span>{" "}
                      {entry.sertifikat_url ? (
                        <a href={entry.sertifikat_url} target="_blank" rel="noopener noreferrer" className="text-primary underline">Lihat Sertifikat</a>
                      ) : (
                        <span className="text-muted-foreground">Belum ada</span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-3">
                    {entry.nib_url && (
                      <Button variant="outline" size="sm" className="gap-1.5" asChild>
                        <a href={entry.nib_url} download target="_blank" rel="noopener noreferrer">
                          <Download className="h-3.5 w-3.5" />
                          Download NIB
                        </a>
                      </Button>
                    )}
                    {entry.sertifikat_url && (
                      <Button variant="outline" size="sm" className="gap-1.5" asChild>
                        <a href={entry.sertifikat_url} download target="_blank" rel="noopener noreferrer">
                          <Download className="h-3.5 w-3.5" />
                          Download Sertifikat
                        </a>
                      </Button>
                    )}
                    {entry.created_by && officers[entry.created_by]?.phone && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
                        asChild
                      >
                        <a
                          href={`https://wa.me/${officers[entry.created_by].phone!.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Halo, saya ${entry.nama || "UMKM"} ingin menanyakan status data saya (${entry.tracking_code || entry.id.slice(0, 8)}).`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                          Hubungi Petugas
                        </a>
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-muted-foreground">
                      Terdaftar: {new Date(entry.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                    {entry.created_by && officers[entry.created_by] && (
                      <p className="text-xs text-muted-foreground">
                        Petugas: {officers[entry.created_by].full_name || "—"}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
