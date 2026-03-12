import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Plus, Copy, QrCode, Trash2, ChevronDown, ChevronUp, BarChart3 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface StatusBreakdown {
  belum_lengkap: number;
  siap_input: number;
  terverifikasi: number;
  nib_selesai: number;
  pengajuan: number;
  sertifikat_selesai: number;
  [key: string]: number;
}

interface LinkRow {
  id: string;
  group_id: string;
  token: string;
  slug: string | null;
  is_active: boolean;
  created_at: string;
  user_id: string;
  group_name?: string;
  entry_count: number;
  status_breakdown: StatusBreakdown;
}

interface GroupOption {
  id: string;
  name: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  belum_lengkap: { label: "Belum Lengkap", color: "bg-destructive" },
  siap_input: { label: "Siap Input", color: "bg-amber-500" },
  terverifikasi: { label: "Terverifikasi", color: "bg-blue-500" },
  nib_selesai: { label: "NIB Selesai", color: "bg-indigo-500" },
  pengajuan: { label: "Pengajuan", color: "bg-purple-500" },
  sertifikat_selesai: { label: "Sertifikat Selesai", color: "bg-primary" },
};

function StatusBreakdownPanel({ breakdown, total }: { breakdown: StatusBreakdown; total: number }) {
  if (total === 0) return <p className="text-xs text-muted-foreground">Belum ada data masuk</p>;

  const sertifikatCount = breakdown.sertifikat_selesai || 0;
  const completionPercent = Math.round((sertifikatCount / total) * 100);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Sertifikat selesai</span>
        <span className="font-medium">{sertifikatCount}/{total} ({completionPercent}%)</span>
      </div>
      <Progress value={completionPercent} className="h-1.5" />
      <div className="flex flex-wrap gap-1.5 mt-1">
        {Object.entries(STATUS_LABELS).map(([key, { label }]) => {
          const count = breakdown[key] || 0;
          if (count === 0) return null;
          return (
            <Badge key={key} variant="outline" className="text-[10px] gap-1 py-0">
              {label}: {count}
            </Badge>
          );
        })}
      </div>
    </div>
  );
}

export default function ShareLinks() {
  const { user } = useAuth();
  const [links, setLinks] = useState<LinkRow[]>([]);
  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [creating, setCreating] = useState(false);
  const [expandedLink, setExpandedLink] = useState<string | null>(null);

  const fetchLinks = async () => {
    if (!user) return;
    const { data } = await supabase.from("shared_links").select("*").eq("user_id", user.id);
    if (data) {
      const groupIds = [...new Set(data.map((l: any) => l.group_id))];
      const linkIds = data.map((l: any) => l.id);
      const [{ data: groupData }, { data: entryData }] = await Promise.all([
        supabase.from("groups").select("id, name").in("id", groupIds),
        supabase.from("data_entries").select("source_link_id, status").in("source_link_id", linkIds),
      ]);
      const gMap = new Map(groupData?.map((g: any) => [g.id, g.name]));

      // Build count and breakdown per link
      const countMap = new Map<string, number>();
      const breakdownMap = new Map<string, StatusBreakdown>();
      (entryData ?? []).forEach((e: any) => {
        const lid = e.source_link_id;
        countMap.set(lid, (countMap.get(lid) || 0) + 1);
        if (!breakdownMap.has(lid)) {
          breakdownMap.set(lid, { belum_lengkap: 0, siap_input: 0, terverifikasi: 0, nib_selesai: 0, pengajuan: 0, sertifikat_selesai: 0 });
        }
        const bd = breakdownMap.get(lid)!;
        bd[e.status] = (bd[e.status] || 0) + 1;
      });

      setLinks(data.map((l: any) => ({
        ...l,
        group_name: gMap.get(l.group_id),
        entry_count: countMap.get(l.id) || 0,
        status_breakdown: breakdownMap.get(l.id) || { belum_lengkap: 0, siap_input: 0, terverifikasi: 0, nib_selesai: 0, pengajuan: 0, sertifikat_selesai: 0 },
      })));
    }
  };

  const fetchGroups = async () => {
    const { data } = await supabase.from("groups").select("id, name");
    setGroups(data ?? []);
  };

  useEffect(() => {
    fetchLinks();
    fetchGroups();
  }, [user]);

  const handleCreate = async () => {
    if (!user || !selectedGroup) return;
    setCreating(true);
    const { error } = await supabase.from("shared_links").insert({
      user_id: user.id,
      group_id: selectedGroup,
    } as any);
    setCreating(false);
    if (error) {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Link dibuat" });
      setSelectedGroup("");
      fetchLinks();
    }
  };

  const toggleActive = async (link: LinkRow) => {
    await supabase.from("shared_links").update({ is_active: !link.is_active }).eq("id", link.id);
    fetchLinks();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("shared_links").delete().eq("id", id);
    fetchLinks();
  };

  const getShareUrl = (link: LinkRow) => {
    if (link.slug) {
      return `${window.location.origin}/f/${link.slug}`;
    }
    return `${window.location.origin}/public-form/${link.token}`;
  };

  const copyLink = (link: LinkRow) => {
    navigator.clipboard.writeText(getShareUrl(link));
    toast({ title: "Link disalin!" });
  };

  // Summary stats
  const totalEntries = links.reduce((sum, l) => sum + l.entry_count, 0);
  const totalSertifikat = links.reduce((sum, l) => sum + (l.status_breakdown.sertifikat_selesai || 0), 0);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Share Link</h1>

      {/* Summary cards */}
      {links.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card>
            <CardContent className="pt-4 pb-3 px-4">
              <p className="text-xs text-muted-foreground">Total Link</p>
              <p className="text-2xl font-bold">{links.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 px-4">
              <p className="text-xs text-muted-foreground">Total Data Masuk</p>
              <p className="text-2xl font-bold">{totalEntries}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 px-4">
              <p className="text-xs text-muted-foreground">Sertifikat Selesai</p>
              <p className="text-2xl font-bold text-primary">{totalSertifikat}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Buat Link Baru</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Select value={selectedGroup} onValueChange={setSelectedGroup}>
              <SelectTrigger className="flex-1"><SelectValue placeholder="Pilih group..." /></SelectTrigger>
              <SelectContent>
                {groups.map((g) => (
                  <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleCreate} disabled={!selectedGroup || creating}>
              <Plus className="mr-2 h-4 w-4" /> Buat
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Group</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Data Masuk</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Dibuat</TableHead>
                <TableHead className="w-32">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {links.map((l) => (
                <>
                  <TableRow key={l.id}>
                    <TableCell className="font-medium">{l.group_name}</TableCell>
                    <TableCell>
                      <code className="rounded bg-muted px-2 py-0.5 text-xs font-mono">
                        /f/{l.slug || "..."}
                      </code>
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => setExpandedLink(expandedLink === l.id ? null : l.id)}
                        className="flex items-center gap-1 hover:text-primary transition-colors"
                      >
                        <Badge variant="outline" className="gap-1">
                          <BarChart3 className="h-3 w-3" />
                          {l.entry_count}
                        </Badge>
                        {l.entry_count > 0 && (
                          expandedLink === l.id
                            ? <ChevronUp className="h-3 w-3" />
                            : <ChevronDown className="h-3 w-3" />
                        )}
                      </button>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={l.is_active ? "default" : "secondary"}
                        className="cursor-pointer"
                        onClick={() => toggleActive(l)}
                      >
                        {l.is_active ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(l.created_at).toLocaleDateString("id-ID")}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => copyLink(l)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => window.open(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(getShareUrl(l))}`, "_blank")}>
                          <QrCode className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(l.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  {expandedLink === l.id && l.entry_count > 0 && (
                    <TableRow key={`${l.id}-stats`}>
                      <TableCell colSpan={6} className="bg-muted/30 py-3">
                        <StatusBreakdownPanel breakdown={l.status_breakdown} total={l.entry_count} />
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))}
              {links.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Belum ada link
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
