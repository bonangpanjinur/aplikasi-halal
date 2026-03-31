import { useState, useRef, useMemo, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useFieldAccess } from "@/hooks/useFieldAccess";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Camera, Upload, MapPin, ArrowLeft, X, Image as ImageIcon, Plus } from "lucide-react";
import ImageLightbox from "@/components/ImageLightbox";
import type { Tables } from "@/integrations/supabase/types";
import { z } from "zod";

type DataEntry = Tables<"data_entries">;

interface EntryPhoto {
  id: string;
  entry_id: string;
  photo_type: string;
  url: string;
}

interface Props {
  groupId: string;
  entry?: DataEntry | null;
  onCancel: () => void;
  onSaved: (trackingCode?: string) => void;
  isPublic?: boolean;
  sharedLinkUserId?: string;
  sourceLinkId?: string;
}

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const formSchema = z.object({
  nama: z.string().min(3, "Nama minimal 3 karakter"),
  alamat: z.string().min(5, "Alamat minimal 5 karakter"),
  nomor_hp: z.string().min(10, "Nomor HP minimal 10 digit"),
});

function ImagePreview({ file, existingUrl, onRemoveFile }: { file: File | null; existingUrl?: string | null; onRemoveFile: () => void }) {
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  const src = previewUrl || existingUrl;
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (!src) return null;

  return (
    <>
      <div className="relative inline-block">
        <img
          src={src}
          alt="Preview"
          className="h-24 w-24 rounded-lg border border-border object-cover cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => setLightboxOpen(true)}
          onLoad={() => { if (previewUrl) URL.revokeObjectURL(previewUrl); }}
        />
        <Button type="button" variant="destructive" size="icon" className="absolute -right-2 -top-2 h-5 w-5 rounded-full" onClick={onRemoveFile}>
          <X className="h-3 w-3" />
        </Button>
      </div>
      <ImageLightbox src={src} open={lightboxOpen} onClose={() => setLightboxOpen(false)} />
    </>
  );
}

function ExistingPhotoPreview({ url, onRemove }: { url: string; onRemove?: () => void }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  return (
    <>
      <div className="relative inline-block">
        <img
          src={url}
          alt="Foto"
          className="h-24 w-24 rounded-lg border border-border object-cover cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => setLightboxOpen(true)}
        />
        {onRemove && (
          <Button type="button" variant="destructive" size="icon" className="absolute -right-2 -top-2 h-5 w-5 rounded-full" onClick={onRemove}>
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
      <ImageLightbox src={url} open={lightboxOpen} onClose={() => setLightboxOpen(false)} />
    </>
  );
}

export default function DataEntryForm({ groupId, entry, onCancel, onSaved, isPublic, sharedLinkUserId, sourceLinkId }: Props) {
  const { role, user } = useAuth();
  const { canEdit: canEditField, loading: accessLoading } = useFieldAccess(isPublic ? "lapangan" : undefined);
  const isAdmin = role === "super_admin" || role === "admin";

  const [nama, setNama] = useState(entry?.nama ?? "");
  const [alamat, setAlamat] = useState(entry?.alamat ?? "");
  const [nomorHp, setNomorHp] = useState(entry?.nomor_hp ?? "");
  const [email, setEmail] = useState((entry as any)?.email ?? "");
  const [kataSandi, setKataSandi] = useState((entry as any)?.kata_sandi ?? "");
  const [emailHalal, setEmailHalal] = useState((entry as any)?.email_halal ?? "");
  const [sandiHalal, setSandiHalal] = useState((entry as any)?.sandi_halal ?? "");
  const [emailNib, setEmailNib] = useState((entry as any)?.email_nib ?? "");
  const [sandiNib, setSandiNib] = useState((entry as any)?.sandi_nib ?? "");
  const [saving, setSaving] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);


  const [ktpFile, setKtpFile] = useState<File | null>(null);
  const [nibFile, setNibFile] = useState<File | null>(null);
  const [sertifikatFile, setSertifikatFile] = useState<File | null>(null);

  // Multiple photos
  const [produkFiles, setProdukFiles] = useState<File[]>([]);
  const [verifikasiFiles, setVerifikasiFiles] = useState<File[]>([]);
  const [existingProdukPhotos, setExistingProdukPhotos] = useState<EntryPhoto[]>([]);
  const [existingVerifikasiPhotos, setExistingVerifikasiPhotos] = useState<EntryPhoto[]>([]);
  const [photosToDelete, setPhotosToDelete] = useState<string[]>([]);

  const ktpCameraRef = useRef<HTMLInputElement>(null);
  const ktpFileRef = useRef<HTMLInputElement>(null);
  const produkFileRef = useRef<HTMLInputElement>(null);
  const produkCameraRef = useRef<HTMLInputElement>(null);
  const verifikasiFileRef = useRef<HTMLInputElement>(null);
  const verifikasiCameraRef = useRef<HTMLInputElement>(null);
  const nibFileRef = useRef<HTMLInputElement>(null);
  const sertifikatFileRef = useRef<HTMLInputElement>(null);

  // Load existing photos when editing
  useEffect(() => {
    if (entry?.id) {
      supabase
        .from("entry_photos" as any)
        .select("*")
        .eq("entry_id", entry.id)
        .then(({ data }) => {
          const photos = (data as unknown as EntryPhoto[]) ?? [];
          setExistingProdukPhotos(photos.filter((p) => p.photo_type === "produk"));
          setExistingVerifikasiPhotos(photos.filter((p) => p.photo_type === "verifikasi"));
        });
    }
  }, [entry?.id]);

  const validateFile = (file: File): boolean => {
    if (file.size > MAX_FILE_SIZE) {
      toast({ title: "File terlalu besar", description: "Maksimal ukuran file adalah 2MB", variant: "destructive" });
      return false;
    }
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type) && !file.name.endsWith(".pdf")) {
      toast({ title: "Format file tidak didukung", description: "Gunakan JPG, PNG, atau PDF", variant: "destructive" });
      return false;
    }
    return true;
  };

  const uploadFile = async (file: File, bucket: string): Promise<string | null> => {
    const ext = file.name.split(".").pop();
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file);
    if (error) {
      toast({ title: "Upload gagal", description: error.message, variant: "destructive" });
      return null;
    }
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
    return urlData.publicUrl;
  };

  const getLocation = async () => {
    setGettingLocation(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true })
      );
      const { latitude, longitude } = pos.coords;
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`, {
        headers: {
          'User-Agent': 'HalalTrack-App/1.0 (contact@halaltrack.id)'
        }
      });
      const data = await res.json();
      setAlamat(data.display_name || `${latitude}, ${longitude}`);
    } catch {
      toast({ title: "Gagal mendapatkan lokasi", variant: "destructive" });
    }
    setGettingLocation(false);
  };

  const handleSave = async () => {
    // 1. Client-side validation
    const validation = formSchema.safeParse({ nama, alamat, nomor_hp: nomorHp });
    if (!validation.success) {
      toast({ 
        title: "Validasi Gagal", 
        description: validation.error.errors[0].message, 
        variant: "destructive" 
      });
      return;
    }

    setSaving(true);

    // 2. Duplicate check (only for new entries)
    if (!entry) {
      const { data: existing, error: checkError } = await supabase
        .from("data_entries")
        .select("id")
        .eq("nama", nama)
        .eq("nomor_hp", nomorHp)
        .maybeSingle();
      
      if (existing) {
        toast({ 
          title: "Duplikasi Data", 
          description: "Data dengan nama dan nomor HP ini sudah terdaftar.", 
          variant: "destructive" 
        });
        setSaving(false);
        return;
      }
    }

    let ktp_url = entry?.ktp_url ?? null;
    let nib_url = entry?.nib_url ?? null;
    let sertifikat_url = (entry as any)?.sertifikat_url ?? null;

    if (ktpFile) ktp_url = await uploadFile(ktpFile, "ktp-photos");
    if (nibFile) nib_url = await uploadFile(nibFile, "nib-documents");
    if (sertifikatFile) sertifikat_url = await uploadFile(sertifikatFile, "sertifikat-halal");

    const payload: Record<string, unknown> = {};
    if (canEditField("nama")) payload.nama = nama;
    if (canEditField("alamat")) payload.alamat = alamat;
    if (canEditField("nomor_hp")) payload.nomor_hp = nomorHp;
    if (canEditField("email")) payload.email = email;
    if (canEditField("kata_sandi")) payload.kata_sandi = kataSandi;
    if (canEditField("email_halal")) payload.email_halal = emailHalal;
    if (canEditField("sandi_halal")) payload.sandi_halal = sandiHalal;
    if (canEditField("email_nib")) payload.email_nib = emailNib;
    if (canEditField("sandi_nib")) payload.sandi_nib = sandiNib;
    if (canEditField("ktp") && ktp_url) payload.ktp_url = ktp_url;
    if (canEditField("nib") && nib_url) payload.nib_url = nib_url;
    if (canEditField("sertifikat") && sertifikat_url) payload.sertifikat_url = sertifikat_url;

    // For backward compat, also set foto_produk_url/foto_verifikasi_url to first photo
    let firstProdukUrl = existingProdukPhotos.filter(p => !photosToDelete.includes(p.id))[0]?.url ?? null;
    let firstVerifikasiUrl = existingVerifikasiPhotos.filter(p => !photosToDelete.includes(p.id))[0]?.url ?? null;


    let error;
    let resultData: any = null;
    let entryId = entry?.id;

    if (entry) {
      // Upload new produk/verifikasi photos
      if (canEditField("foto_produk")) {
        for (const file of produkFiles) {
          const url = await uploadFile(file, "product-photos");
          if (url) {
            await supabase.from("entry_photos" as any).insert({ entry_id: entry.id, photo_type: "produk", url });
            if (!firstProdukUrl) firstProdukUrl = url;
          }
        }
      }
      if (canEditField("foto_verifikasi")) {
        for (const file of verifikasiFiles) {
          const url = await uploadFile(file, "verification-photos");
          if (url) {
            await supabase.from("entry_photos" as any).insert({ entry_id: entry.id, photo_type: "verifikasi", url });
            if (!firstVerifikasiUrl) firstVerifikasiUrl = url;
          }
        }
      }

      // Delete removed photos
      if (photosToDelete.length > 0) {
        await supabase.from("entry_photos" as any).delete().in("id", photosToDelete);
      }

      if (canEditField("foto_produk")) payload.foto_produk_url = firstProdukUrl;
      if (canEditField("foto_verifikasi")) payload.foto_verifikasi_url = firstVerifikasiUrl;

      ({ error } = await supabase.from("data_entries").update(payload).eq("id", entry.id));
    } else {
      const res = await supabase.from("data_entries").insert({
        ...payload,
        group_id: groupId,
        created_by: isPublic ? sharedLinkUserId : user?.id,
        pic_user_id: isPublic ? sharedLinkUserId : user?.id,
        source_link_id: sourceLinkId || null,
      } as any).select("id, tracking_code" as any).single();
      error = res.error;
      resultData = res.data;
      entryId = resultData?.id;

      // Upload multiple photos for new entry
      if (entryId) {
        if (canEditField("foto_produk")) {
          for (const file of produkFiles) {
            const url = await uploadFile(file, "product-photos");
            if (url) {
              await supabase.from("entry_photos" as any).insert({ entry_id: entryId, photo_type: "produk", url });
              if (!firstProdukUrl) firstProdukUrl = url;
            }
          }
        }
        if (canEditField("foto_verifikasi")) {
          for (const file of verifikasiFiles) {
            const url = await uploadFile(file, "verification-photos");
            if (url) {
              await supabase.from("entry_photos" as any).insert({ entry_id: entryId, photo_type: "verifikasi", url });
              if (!firstVerifikasiUrl) firstVerifikasiUrl = url;
            }
          }
        }
        // Update first photo URLs
        if (firstProdukUrl || firstVerifikasiUrl) {
          await supabase.from("data_entries").update({
            foto_produk_url: firstProdukUrl,
            foto_verifikasi_url: firstVerifikasiUrl
          }).eq("id", entryId);
        }
      }
    }

    if (error) {
      toast({ title: "Gagal menyimpan", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Berhasil disimpan" });
      onSaved(resultData?.tracking_code);
    }
    setSaving(false);
  };

  const addProdukFile = (file: File | null) => {
    if (file && validateFile(file)) setProdukFiles([...produkFiles, file]);
  };
  const removeProdukFile = (index: number) => {
    setProdukFiles(produkFiles.filter((_, i) => i !== index));
  };
  const addVerifikasiFile = (file: File | null) => {
    if (file && validateFile(file)) setVerifikasiFiles([...verifikasiFiles, file]);
  };
  const removeVerifikasiFile = (index: number) => {
    setVerifikasiFiles(verifikasiFiles.filter((_, i) => i !== index));
  };
  const markPhotoForDeletion = (id: string) => {
    setPhotosToDelete([...photosToDelete, id]);
  };

  const clearFile = (setter: (f: File | null) => void, ref: React.RefObject<HTMLInputElement>) => {
    setter(null);
    if (ref.current) ref.current.value = "";
  };

  if (accessLoading) return <div className="p-8 text-center">Memuat hak akses...</div>;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{entry ? "Edit Data" : "Input Data Baru"}</CardTitle>
        {!isPublic && (
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {canEditField("nama") && (
          <div className="space-y-2">
            <Label htmlFor="nama">Nama Lengkap / Nama Usaha</Label>
            <Input id="nama" value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Masukkan nama" />
          </div>
        )}

        {canEditField("alamat") && (
          <div className="space-y-2">
            <Label htmlFor="alamat">Alamat Lengkap</Label>
            <div className="flex gap-2">
              <Input id="alamat" value={alamat} onChange={(e) => setAlamat(e.target.value)} placeholder="Masukkan alamat" />
              <Button type="button" variant="outline" size="icon" onClick={getLocation} disabled={gettingLocation}>
                <MapPin className={`h-4 w-4 ${gettingLocation ? "animate-pulse" : ""}`} />
              </Button>
            </div>
          </div>
        )}

        {canEditField("nomor_hp") && (
          <div className="space-y-2">
            <Label htmlFor="nomor_hp">Nomor HP / WhatsApp</Label>
            <Input id="nomor_hp" value={nomorHp} onChange={(e) => setNomorHp(e.target.value)} placeholder="Contoh: 08123456789" />
          </div>
        )}

        {canEditField("email") && (
          <div className="space-y-2">
            <Label htmlFor="email">Email (Opsional)</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@contoh.com" />
          </div>
        )}

        {isAdmin && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="kata_sandi">Kata Sandi Akun</Label>
              <Input id="kata_sandi" value={kataSandi} onChange={(e) => setKataSandi(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email_halal">Email SIHALAL</Label>
              <Input id="email_halal" value={emailHalal} onChange={(e) => setEmailHalal(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sandi_halal">Sandi SIHALAL</Label>
              <Input id="sandi_halal" value={sandiHalal} onChange={(e) => setSandiHalal(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email_nib">Email OSS/NIB</Label>
              <Input id="email_nib" value={emailNib} onChange={(e) => setEmailNib(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sandi_nib">Sandi OSS/NIB</Label>
              <Input id="sandi_nib" value={sandiNib} onChange={(e) => setSandiNib(e.target.value)} />
            </div>
          </div>
        )}

        {canEditField("ktp") && (
          <div className="space-y-2">
            <Label>Foto KTP</Label>
            <input ref={ktpFileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0] ?? null; if (f && validateFile(f)) setKtpFile(f); }} />
            <input ref={ktpCameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { const f = e.target.files?.[0] ?? null; if (f && validateFile(f)) setKtpFile(f); }} />
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => ktpFileRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4" /> Pilih File
              </Button>
              <Button type="button" variant="outline" onClick={() => ktpCameraRef.current?.click()}>
                <Camera className="h-4 w-4" />
              </Button>
            </div>
            <ImagePreview file={ktpFile} existingUrl={entry?.ktp_url} onRemoveFile={() => clearFile(setKtpFile, ktpFileRef)} />
          </div>
        )}

        {canEditField("nib") && (
          <div className="space-y-2">
            <Label>Dokumen NIB (PDF / Foto)</Label>
            <input ref={nibFileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0] ?? null; if (f && validateFile(f)) setNibFile(f); }} />
            <Button type="button" variant="outline" className="w-full" onClick={() => nibFileRef.current?.click()}>
              <Upload className="mr-2 h-4 w-4" /> Pilih File NIB
            </Button>
            {nibFile?.type?.startsWith("image/") ? (
              <ImagePreview file={nibFile} onRemoveFile={() => clearFile(setNibFile, nibFileRef)} />
            ) : nibFile ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ImageIcon className="h-4 w-4" />
                <span className="truncate">{nibFile.name}</span>
                <Button type="button" variant="ghost" size="icon" className="h-5 w-5" onClick={() => clearFile(setNibFile, nibFileRef)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : entry?.nib_url ? (
              <p className="text-xs text-muted-foreground">NIB sudah diupload ✓</p>
            ) : null}
          </div>
        )}

        {canEditField("foto_produk") && (
          <div className="space-y-2">
            <Label>Foto Produk (bisa lebih dari satu)</Label>
            <input ref={produkFileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { addProdukFile(e.target.files?.[0] ?? null); if (produkFileRef.current) produkFileRef.current.value = ""; }} />
            <input ref={produkCameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { addProdukFile(e.target.files?.[0] ?? null); if (produkCameraRef.current) produkCameraRef.current.value = ""; }} />
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => produkFileRef.current?.click()}>
                <Plus className="mr-2 h-4 w-4" /> Tambah Foto
              </Button>
              <Button type="button" variant="outline" onClick={() => produkCameraRef.current?.click()}>
                <Camera className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {existingProdukPhotos
                .filter((p) => !photosToDelete.includes(p.id))
                .map((photo) => (
                  <ExistingPhotoPreview key={photo.id} url={photo.url} onRemove={() => markPhotoForDeletion(photo.id)} />
                ))}
              {produkFiles.map((file, i) => (
                <ImagePreview key={`new-produk-${i}`} file={file} onRemoveFile={() => removeProdukFile(i)} />
              ))}
            </div>
          </div>
        )}

        {canEditField("foto_verifikasi") && (
          <div className="space-y-2">
            <Label>Foto Verifikasi Lapangan (bisa lebih dari satu)</Label>
            <input ref={verifikasiFileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { addVerifikasiFile(e.target.files?.[0] ?? null); if (verifikasiFileRef.current) verifikasiFileRef.current.value = ""; }} />
            <input ref={verifikasiCameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { addVerifikasiFile(e.target.files?.[0] ?? null); if (verifikasiCameraRef.current) verifikasiCameraRef.current.value = ""; }} />
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => verifikasiFileRef.current?.click()}>
                <Plus className="mr-2 h-4 w-4" /> Tambah Foto
              </Button>
              <Button type="button" variant="outline" onClick={() => verifikasiCameraRef.current?.click()}>
                <Camera className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {existingVerifikasiPhotos
                .filter((p) => !photosToDelete.includes(p.id))
                .map((photo) => (
                  <ExistingPhotoPreview key={photo.id} url={photo.url} onRemove={() => markPhotoForDeletion(photo.id)} />
                ))}
              {verifikasiFiles.map((file, i) => (
                <ImagePreview key={`new-verifikasi-${i}`} file={file} onRemoveFile={() => removeVerifikasiFile(i)} />
              ))}
            </div>
          </div>
        )}

        {canEditField("sertifikat") && (
          <div className="space-y-2">
            <Label>Sertifikat Halal (PDF / Foto)</Label>
            <input ref={sertifikatFileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0] ?? null; if (f && validateFile(f)) setSertifikatFile(f); }} />
            <Button type="button" variant="outline" className="w-full" onClick={() => sertifikatFileRef.current?.click()}>
              <Upload className="mr-2 h-4 w-4" /> Pilih File Sertifikat
            </Button>
            {sertifikatFile?.type?.startsWith("image/") ? (
              <ImagePreview file={sertifikatFile} onRemoveFile={() => clearFile(setSertifikatFile, sertifikatFileRef)} />
            ) : sertifikatFile ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ImageIcon className="h-4 w-4" />
                <span className="truncate">{sertifikatFile.name}</span>
                <Button type="button" variant="ghost" size="icon" className="h-5 w-5" onClick={() => clearFile(setSertifikatFile, sertifikatFileRef)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (entry as any)?.sertifikat_url ? (
              <p className="text-xs text-muted-foreground">Sertifikat sudah diupload ✓</p>
            ) : null}
          </div>
        )}

        <div className="flex gap-2 pt-4">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Menyimpan..." : "Simpan"}
          </Button>
          {!isPublic && (
            <Button variant="outline" onClick={onCancel}>Batal</Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
