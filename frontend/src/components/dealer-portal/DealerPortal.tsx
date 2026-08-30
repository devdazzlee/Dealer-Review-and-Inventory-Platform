"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import {
  Car,
  Eye,
  EyeOff,
  ImagePlus,
  Loader2,
  Lock,
  LogOut,
  Megaphone,
  Menu,
  MessageSquareText,
  Pencil,
  Plus,
  Star,
  Store,
  Trash2,
  User,
  X,
} from "lucide-react";
import {
  clearDealerPortalToken,
  dealerPortalApi,
  getDealerPortalToken,
  setDealerPortalToken,
  type DealerPortalReview,
  type DealerUpdateDto,
  type DealerVehicleDto,
  type DealerVehicleInput,
} from "@/lib/api/dealer-portal-client";
import type { AdminDealer } from "@/lib/api/admin-client";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { StarRating } from "@/components/shared/StarRating";
import { cn } from "@/lib/utils";
import {
  changePasswordSchema,
  dealerUpdateFormSchema,
  getFieldErrors,
  loginSchema,
  profileSchema,
  vehicleFormSchema,
} from "@/lib/dealer-portal/validation";

type Tab = "overview" | "inventory" | "reviews" | "profile" | "updates";

const NAV: { key: Tab; label: string; icon: typeof Star }[] = [
  { key: "overview", label: "Overview", icon: User },
  { key: "inventory", label: "Inventory", icon: Car },
  { key: "reviews", label: "Reviews", icon: Star },
  { key: "profile", label: "Profile", icon: User },
  { key: "updates", label: "Updates", icon: Megaphone },
];

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------

function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const [loginEmail, setLoginEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // After the first failed attempt, keep re-validating live so a field's
  // error clears itself the moment it's actually fixed.
  useEffect(() => {
    if (!submitted) return;
    setFieldErrors(getFieldErrors(loginSchema, { loginEmail, password }) ?? {});
  }, [loginEmail, password, submitted]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    setError(null);
    const errors = getFieldErrors(loginSchema, { loginEmail, password });
    if (errors) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setLoading(true);
    try {
      const result = await dealerPortalApi.login(loginEmail, password);
      setDealerPortalToken(result.token);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <form
        onSubmit={submit}
        noValidate
        className="w-full max-w-sm space-y-5 rounded-lg border border-border bg-white p-6"
      >
        <div>
          <BrandLogo />
          <h1 className="mt-5 text-lg font-semibold tracking-tight text-foreground">
            Dealer sign in
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in with the login your AutoSalesReviews contact set up for you.
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-muted-foreground">
            Email
          </label>
          <Input
            type="email"
            value={loginEmail}
            onChange={(e) => setLoginEmail(e.target.value)}
            placeholder="you@yourdealership.com"
            autoFocus
            className={cn(
              "h-10",
              fieldErrors.loginEmail && "border-destructive focus-visible:ring-destructive"
            )}
          />
          <FieldError error={fieldErrors.loginEmail} />
        </div>

        <PasswordField
          label="Password"
          value={password}
          onChange={setPassword}
          placeholder="Password"
          error={fieldErrors.password}
        />

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Signing in…
            </>
          ) : (
            "Sign in"
          )}
        </Button>
      </form>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared bits
// ---------------------------------------------------------------------------

/** `value: null` means "still loading" — shows a skeleton in place of the
 * number instead of a "—" that looks like a real (empty) answer. */
function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Star;
  label: string;
  value: string | number | null;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border/70 bg-white p-4 shadow-card">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        {value === null ? (
          <Skeleton className="h-7 w-10" />
        ) : (
          <p className="text-2xl font-bold text-foreground">{value}</p>
        )}
        <p className="mt-1 truncate text-xs font-medium text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

/** Centered loading state — used for every tab's initial fetch instead of a
 * bare spinner pinned to the top-left corner of the content area. */
function LoadingBlock({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 text-muted-foreground">
      <Loader2 className="h-7 w-7 animate-spin text-primary" aria-hidden />
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}

/** Section header used at the top of each card — icon, title, optional
 * subtitle — so multi-card tabs (Profile, Inventory forms) read as
 * distinct, deliberate sections instead of boxes stacked with no rhythm. */
function CardHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: typeof Star;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="font-semibold text-foreground">{title}</p>
        {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  );
}

/** Inline validation message shown under a field — the whole point is that a
 * dealer never has to guess why Save didn't do anything. */
function FieldError({ error }: { error?: string }) {
  if (!error) return null;
  return <p className="mt-1 text-xs text-destructive">{error}</p>;
}

/** Password input with a show/hide eye toggle and an inline validation
 * message, shared by the login form and the change-password form so both
 * behave and look identical. */
function PasswordField({
  label,
  value,
  onChange,
  placeholder,
  error,
  autoFocus,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
  autoFocus?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold">{label}</label>
      <div className="relative">
        <Input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className={cn("pr-10", error && "border-destructive focus-visible:ring-destructive")}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      <FieldError error={error} />
    </div>
  );
}

/** Shared destructive-action confirmation used everywhere something gets
 * deleted from the portal — a dealer never loses data to a stray click, and
 * the confirm button shows a spinner for as long as the request is in
 * flight instead of just closing and hoping it worked. */
function ConfirmDeleteDialog({
  open,
  onOpenChange,
  title,
  description,
  loading,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  loading: boolean;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={(next) => !loading && onOpenChange(next)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className={cn(buttonVariants({ variant: "destructive" }))}
            disabled={loading}
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Deleting…
              </>
            ) : (
              "Delete"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** Page X of Y + Previous/Next, matching the pagination pattern already used
 * across the admin panel's list tables. Renders nothing for a single page. */
function PaginationControls({
  page,
  totalPages,
  loading,
  onChange,
}: {
  page: number;
  totalPages: number;
  loading: boolean;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-center text-sm text-muted-foreground sm:text-left">
        Page {page} of {totalPages}
      </p>
      <div className="grid grid-cols-2 gap-2 sm:flex">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full sm:w-auto"
          disabled={loading || page <= 1}
          onClick={() => onChange(page - 1)}
        >
          Previous
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full sm:w-auto"
          disabled={loading || page >= totalPages}
          onClick={() => onChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Overview
// ---------------------------------------------------------------------------

function OverviewTab({
  dealer,
  onNavigate,
}: {
  dealer: AdminDealer;
  onNavigate: (tab: Tab) => void;
}) {
  const [vehicleCount, setVehicleCount] = useState<number | null>(null);
  const [pendingReplies, setPendingReplies] = useState<number | null>(null);
  const [updateCount, setUpdateCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    dealerPortalApi
      .vehicles()
      .then((v) => {
        if (!cancelled) setVehicleCount(v.activeTotal);
      })
      .catch(() => undefined);
    dealerPortalApi
      .reviews({ status: "approved", page: 1 })
      .then((r) => {
        if (!cancelled) setPendingReplies(r.reviews.filter((x) => !x.dealerReply).length);
      })
      .catch(() => undefined);
    dealerPortalApi
      .updates()
      .then((u) => {
        if (!cancelled) setUpdateCount(u.length);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground">
          Welcome back, {dealer.name}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Here&apos;s what&apos;s going on with your profile.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={Car} label="Live vehicles" value={vehicleCount} />
        <StatCard icon={Star} label="Combined rating" value={dealer.combinedRating?.toFixed(1) ?? "—"} />
        <StatCard icon={MessageSquareText} label="Reviews needing a reply" value={pendingReplies} />
        <StatCard icon={Megaphone} label="Updates posted" value={updateCount} />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => onNavigate("inventory")}
          className="rounded-lg border border-border/70 bg-white p-4 text-left shadow-card transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-card-hover"
        >
          <Car className="h-5 w-5 text-primary" />
          <p className="mt-2 font-semibold text-foreground">Manage inventory</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Add, edit, or remove vehicles.</p>
        </button>
        <button
          type="button"
          onClick={() => onNavigate("reviews")}
          className="rounded-lg border border-border/70 bg-white p-4 text-left shadow-card transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-card-hover"
        >
          <Star className="h-5 w-5 text-primary" />
          <p className="mt-2 font-semibold text-foreground">Reply to reviews</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Respond to what customers said.</p>
        </button>
        <button
          type="button"
          onClick={() => onNavigate("updates")}
          className="rounded-lg border border-border/70 bg-white p-4 text-left shadow-card transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-card-hover"
        >
          <Megaphone className="h-5 w-5 text-primary" />
          <p className="mt-2 font-semibold text-foreground">Post an update</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Let customers know what&apos;s new.</p>
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inventory
// ---------------------------------------------------------------------------

function emptyVehicleForm() {
  return {
    vin: "",
    year: String(new Date().getFullYear()),
    make: "",
    model: "",
    trim: "",
    mileage: "",
    bodyStyle: "",
    fuelType: "",
    transmission: "",
    exteriorColor: "",
    interiorColor: "",
    condition: "",
    price: "",
    description: "",
    features: "",
    photos: "",
  };
}

function formFromVehicle(v: DealerVehicleDto): ReturnType<typeof emptyVehicleForm> {
  return {
    vin: v.vin,
    year: String(v.year),
    make: v.make,
    model: v.model,
    trim: v.trim ?? "",
    mileage: v.mileage != null ? String(v.mileage) : "",
    bodyStyle: v.bodyStyle ?? "",
    fuelType: v.fuelType ?? "",
    transmission: v.transmission ?? "",
    exteriorColor: v.exteriorColor ?? "",
    interiorColor: v.interiorColor ?? "",
    condition: v.condition ?? "",
    price: v.price != null ? String(v.price) : "",
    description: v.description ?? "",
    features: v.features.join(", "),
    photos: v.photos.join("\n"),
  };
}

function vehiclePayload(
  form: ReturnType<typeof emptyVehicleForm>
): DealerVehicleInput {
  return {
    vin: form.vin.trim(),
    year: Number(form.year),
    make: form.make.trim(),
    model: form.model.trim(),
    trim: form.trim.trim() || null,
    mileage: form.mileage ? Number(form.mileage) : null,
    bodyStyle: form.bodyStyle.trim() || null,
    fuelType: form.fuelType.trim() || null,
    transmission: form.transmission.trim() || null,
    exteriorColor: form.exteriorColor.trim() || null,
    interiorColor: form.interiorColor.trim() || null,
    condition: form.condition.trim() || null,
    price: form.price ? Number(form.price) : null,
    description: form.description.trim() || null,
    features: form.features,
    photos: form.photos,
  };
}

function VehicleFormCard({
  vehicle,
  onClose,
  onSaved,
}: {
  vehicle: DealerVehicleDto | null;
  onClose: () => void;
  onSaved: (vehicle: DealerVehicleDto) => void;
}) {
  const isCreate = vehicle === null;
  const [form, setForm] = useState(() =>
    vehicle ? formFromVehicle(vehicle) : emptyVehicleForm()
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Once a save attempt has surfaced errors, keep re-checking on every
  // keystroke so a field's message disappears the moment it's actually
  // fixed instead of sticking around until the next click of Save.
  useEffect(() => {
    if (!submitted) return;
    setFieldErrors(getFieldErrors(vehicleFormSchema, form) ?? {});
  }, [form, submitted]);

  async function handlePhotoFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        const { url } = await dealerPortalApi.uploadImage(file, "vehicle");
        uploaded.push(url);
      }
      setForm((f) => ({
        ...f,
        photos: [f.photos, ...uploaded].filter(Boolean).join("\n"),
      }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to upload photo");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function save() {
    setSubmitted(true);
    setError(null);
    const errors = getFieldErrors(vehicleFormSchema, form);
    if (errors) {
      // Field-level messages under each input already say what's wrong —
      // no separate banner needed, and it would just repeat itself.
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setSaving(true);
    try {
      const payload = vehiclePayload(form);
      const saved = isCreate
        ? await dealerPortalApi.createVehicle(payload)
        : await dealerPortalApi.updateVehicle(vehicle.id, payload);
      onSaved(saved);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save vehicle");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && !saving && onClose()}>
      <DialogContent
        showClose={!saving}
        className="flex max-h-[92vh] max-w-3xl flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl"
      >
        <DialogHeader className="shrink-0 border-b border-border/70 px-5 py-4 pr-12">
          <DialogTitle>
            {isCreate ? "Add a vehicle" : `Edit ${vehicle.year} ${vehicle.make} ${vehicle.model}`}
          </DialogTitle>
          <DialogDescription>
            {isCreate
              ? "Add a vehicle to your live inventory."
              : "Update this vehicle's details."}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <PortalField label="VIN" value={form.vin} onChange={(v) => setForm({ ...form, vin: v })} error={fieldErrors.vin} />
            <PortalField label="Year" type="number" value={form.year} onChange={(v) => setForm({ ...form, year: v })} error={fieldErrors.year} />
            <PortalField label="Make" value={form.make} onChange={(v) => setForm({ ...form, make: v })} error={fieldErrors.make} />
            <PortalField label="Model" value={form.model} onChange={(v) => setForm({ ...form, model: v })} error={fieldErrors.model} />
            <PortalField label="Trim" value={form.trim} onChange={(v) => setForm({ ...form, trim: v })} />
            <PortalField label="Mileage" type="number" value={form.mileage} onChange={(v) => setForm({ ...form, mileage: v })} error={fieldErrors.mileage} />
            <PortalField label="Price ($)" type="number" value={form.price} onChange={(v) => setForm({ ...form, price: v })} error={fieldErrors.price} />
            <PortalField label="Condition" value={form.condition} onChange={(v) => setForm({ ...form, condition: v })} placeholder="New, Used, Certified…" />
            <PortalField label="Body style" value={form.bodyStyle} onChange={(v) => setForm({ ...form, bodyStyle: v })} placeholder="Sedan, SUV, Truck…" />
            <PortalField label="Fuel type" value={form.fuelType} onChange={(v) => setForm({ ...form, fuelType: v })} />
            <PortalField label="Transmission" value={form.transmission} onChange={(v) => setForm({ ...form, transmission: v })} />
            <PortalField label="Exterior color" value={form.exteriorColor} onChange={(v) => setForm({ ...form, exteriorColor: v })} />
            <PortalField label="Interior color" value={form.interiorColor} onChange={(v) => setForm({ ...form, interiorColor: v })} />
            <PortalField
              label="Features"
              value={form.features}
              onChange={(v) => setForm({ ...form, features: v })}
              placeholder="Comma separated, e.g. Backup camera, Heated seats"
              className="sm:col-span-2"
            />
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold">Description</label>
              <textarea
                className={cn(
                  "min-h-[80px] w-full rounded-md border border-input px-3 py-2 text-sm",
                  fieldErrors.description && "border-destructive focus-visible:ring-destructive"
                )}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                maxLength={5000}
              />
              <FieldError error={fieldErrors.description} />
            </div>
            <div className="sm:col-span-2">
              <div className="mb-1 flex items-center justify-between">
                <label className="block text-xs font-semibold">Photos</label>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="inline-flex items-center gap-1.5 rounded-md border border-input px-2.5 py-1 text-xs font-medium text-foreground hover:bg-secondary disabled:opacity-60"
                >
                  {uploading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <ImagePlus className="h-3.5 w-3.5" />
                  )}
                  {uploading ? "Uploading…" : "Upload photos"}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => void handlePhotoFiles(e.target.files)}
                />
              </div>
              <textarea
                className={cn(
                  "min-h-[70px] w-full rounded-md border border-input px-3 py-2 text-sm",
                  fieldErrors.photos && "border-destructive focus-visible:ring-destructive"
                )}
                placeholder={"One image URL per line — or use Upload photos above"}
                value={form.photos}
                onChange={(e) => setForm({ ...form, photos: e.target.value })}
              />
              <FieldError error={fieldErrors.photos} />
              {form.photos.trim() && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {form.photos
                    .split("\n")
                    .map((u) => u.trim())
                    .filter(Boolean)
                    .map((url, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={`${url}-${i}`}
                        src={url}
                        alt=""
                        className="h-16 w-16 rounded-md border border-input object-cover"
                      />
                    ))}
                </div>
              )}
            </div>
          </div>

          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter className="shrink-0 border-t border-border/70 px-5 py-4">
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            disabled={saving}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="w-full sm:w-auto"
            disabled={saving}
            onClick={() => void save()}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : isCreate ? (
              "Add vehicle"
            ) : (
              "Save changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PortalField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  className,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  className?: string;
  error?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-1 block text-xs font-semibold">{label}</label>
      <Input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={cn(error && "border-destructive focus-visible:ring-destructive")}
      />
      <FieldError error={error} />
    </div>
  );
}

/** Placeholder cards shaped like the real inventory grid, shown while the
 * vehicle list is loading instead of a spinner pinned in empty space. */
function InventorySkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-lg border border-border/70 bg-white p-4 shadow-card">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="mt-2 h-5 w-1/3" />
          <Skeleton className="mt-3 h-3 w-1/2" />
          <Skeleton className="mt-2 h-3 w-2/3" />
          <div className="mt-3 flex gap-2">
            <Skeleton className="h-9 w-16" />
            <Skeleton className="h-9 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

function InventoryTab() {
  const [vehicles, setVehicles] = useState<DealerVehicleDto[]>([]);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(24);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<DealerVehicleDto | null | "new">(null);
  const [deleteTarget, setDeleteTarget] = useState<DealerVehicleDto | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async (targetPage: number) => {
    setLoading(true);
    setError(null);
    try {
      const result = await dealerPortalApi.vehicles({ page: targetPage });
      setVehicles(result.vehicles);
      setTotal(result.total);
      setPageSize(result.pageSize);
      setPage(result.page);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load inventory");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(1);
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await dealerPortalApi.deleteVehicle(deleteTarget.id);
      setDeleteTarget(null);
      // Deleting the last item on a page beyond the first steps back a page
      // instead of leaving the dealer staring at an empty page.
      const nextPage = vehicles.length === 1 && page > 1 ? page - 1 : page;
      await load(nextPage);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete vehicle");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Vehicles you add or edit here are yours to manage — they&apos;re never touched by the automatic inventory sync.
        </p>
        {editing === null && (
          <Button type="button" size="sm" onClick={() => setEditing("new")}>
            <Plus className="h-4 w-4" />
            Add vehicle
          </Button>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {editing !== null && (
        <VehicleFormCard
          vehicle={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            const wasCreate = editing === "new";
            setEditing(null);
            // A new vehicle sorts to the top — jump to page 1 so it's visible.
            void load(wasCreate ? 1 : page);
          }}
        />
      )}

      {loading ? (
        <InventorySkeleton />
      ) : vehicles.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No vehicles yet. Add your first one to get started.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((v) => (
            <div key={v.id} className="rounded-lg border border-border/70 bg-white p-4 shadow-card transition-shadow hover:shadow-card-hover">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-foreground">
                    {v.year} {v.make} {v.model}
                  </p>
                  {v.trim && <p className="truncate text-xs text-muted-foreground">{v.trim}</p>}
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold uppercase",
                    v.isActive
                      ? "bg-success/10 text-success"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {v.isActive ? "Active" : "Sold"}
                </span>
              </div>
              <p className="mt-2 text-lg font-bold text-primary">
                {v.price != null ? `$${v.price.toLocaleString()}` : "Price on request"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {[v.mileage != null ? `${v.mileage.toLocaleString()} mi` : null, v.condition, v.exteriorColor]
                  .filter(Boolean)
                  .join(" · ") || "—"}
              </p>
              <p className="mt-1 truncate text-xs text-muted-foreground">VIN {v.vin}</p>
              <div className="mt-3 flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setEditing(v)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setDeleteTarget(v)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <PaginationControls
        page={page}
        totalPages={totalPages}
        loading={loading}
        onChange={(p) => void load(p)}
      />

      <ConfirmDeleteDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete this vehicle?"
        description={
          deleteTarget
            ? `This removes ${deleteTarget.year} ${deleteTarget.make} ${deleteTarget.model} (VIN ${deleteTarget.vin}) from your inventory. This can't be undone.`
            : ""
        }
        loading={deleting}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------

/** Mirrors backend/src/utils/author-display.ts so the avatar in the portal
 * matches what customers see on the public review card. */
function reviewInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

function ReviewsTab() {
  const [reviews, setReviews] = useState<DealerPortalReview[]>([]);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async (targetPage: number) => {
    setLoading(true);
    setError(null);
    try {
      const result = await dealerPortalApi.reviews({ status: "approved", page: targetPage });
      setReviews(result.reviews);
      setTotal(result.total);
      setPageSize(result.pageSize);
      setPage(result.page);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(1);
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  async function saveReply(id: string) {
    setSavingId(id);
    try {
      const result = await dealerPortalApi.replyToReview(id, drafts[id]?.trim() || null);
      setReviews((prev) => prev.map((r) => (r.id === id ? result.review : r)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save reply");
    } finally {
      setSavingId(null);
    }
  }

  if (loading && reviews.length === 0) {
    return <LoadingBlock label="Loading reviews…" />;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Approved reviews on your profile. Replies show publicly under the review.
      </p>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {reviews.length === 0 && (
        <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No approved reviews yet.
        </p>
      )}
      {reviews.map((review) => (
        <article
          key={review.id}
          className="overflow-hidden rounded-lg border border-border/70 bg-white p-5 shadow-card"
        >
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
              {reviewInitials(review.authorName)}
            </span>
            <div className="min-w-0 flex-1 overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="truncate font-bold text-primary">{review.authorName}</p>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {format(new Date(review.createdAt), "MMM d, yyyy")}
                </span>
              </div>
              <div className="mt-1">
                <StarRating rating={review.overallRating} size="sm" />
              </div>
              <h4 className="mt-2.5 break-all font-bold text-foreground">{review.title}</h4>
              <p className="mt-1.5 whitespace-pre-wrap break-all text-sm leading-relaxed text-foreground/90">
                {review.comment}
              </p>

              <div className="mt-4 rounded-lg border border-border/70 bg-secondary/40 p-3.5">
                <p className="text-xs font-bold uppercase tracking-wide text-primary">
                  Your reply
                </p>
                <textarea
                  className="mt-1.5 min-h-[70px] w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
                  placeholder="Reply to this review…"
                  value={drafts[review.id] ?? review.dealerReply ?? ""}
                  maxLength={2000}
                  onChange={(e) => setDrafts((d) => ({ ...d, [review.id]: e.target.value }))}
                />
                <Button
                  type="button"
                  size="sm"
                  className="mt-2"
                  disabled={savingId === review.id}
                  onClick={() => void saveReply(review.id)}
                >
                  {savingId === review.id ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Saving…
                    </>
                  ) : review.dealerReply ? (
                    "Update reply"
                  ) : (
                    "Post reply"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </article>
      ))}

      <PaginationControls
        page={page}
        totalPages={totalPages}
        loading={loading}
        onChange={(p) => void load(p)}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

function ProfileTab({
  dealer,
  onSaved,
}: {
  dealer: AdminDealer;
  onSaved: (dealer: AdminDealer) => void;
}) {
  const [name, setName] = useState(dealer.name);
  const [phone, setPhone] = useState(dealer.phone ?? "");
  const [email, setEmail] = useState(dealer.email ?? "");
  const [website, setWebsite] = useState(dealer.website ?? "");
  const [description, setDescription] = useState(dealer.description ?? "");
  const [logo, setLogo] = useState(dealer.logo ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!submitted) return;
    setFieldErrors(getFieldErrors(profileSchema, { name, phone, email, website, description, logo }) ?? {});
  }, [name, phone, email, website, description, logo, submitted]);

  async function handleLogoFile(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    setMessage(null);
    try {
      const { url } = await dealerPortalApi.uploadImage(file, "logo");
      setLogo(url);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Failed to upload logo");
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = "";
    }
  }

  async function save() {
    setSubmitted(true);
    setMessage(null);
    setIsError(false);
    const errors = getFieldErrors(profileSchema, { name, phone, email, website, description, logo });
    if (errors) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setSaving(true);
    try {
      const updated = await dealerPortalApi.updateProfile({
        name: name.trim(),
        phone: phone || null,
        email: email || null,
        website: website || null,
        description: description || null,
        logo: logo || null,
      });
      onSaved(updated);
      setMessage("Saved.");
    } catch (e) {
      setIsError(true);
      setMessage(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="h-fit space-y-4 rounded-lg border border-border/70 bg-white p-5 sm:p-6 shadow-card">
      <CardHeader
        icon={Store}
        title="Business info"
        subtitle="Shown to customers on your public profile."
      />
      <div>
        <label className="mb-1 block text-xs font-semibold">Logo</label>
        <div className="flex items-center gap-3">
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logo}
              alt="Dealer logo"
              className="h-14 w-14 rounded-md border border-input object-contain bg-secondary/40"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-md border border-dashed border-input text-muted-foreground">
              <Store className="h-6 w-6" />
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              onClick={() => logoInputRef.current?.click()}
              disabled={uploadingLogo}
              className="inline-flex items-center gap-1.5 rounded-md border border-input px-2.5 py-1 text-xs font-medium text-foreground hover:bg-secondary disabled:opacity-60"
            >
              {uploadingLogo ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ImagePlus className="h-3.5 w-3.5" />
              )}
              {uploadingLogo ? "Uploading…" : logo ? "Replace logo" : "Upload logo"}
            </button>
            {logo && (
              <button
                type="button"
                onClick={() => setLogo("")}
                className="text-left text-xs text-muted-foreground hover:text-destructive"
              >
                Remove logo
              </button>
            )}
          </div>
          <input
            ref={logoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => void handleLogoFile(e.target.files)}
          />
        </div>
        <FieldError error={fieldErrors.logo} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold">Business name</label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={cn(fieldErrors.name && "border-destructive focus-visible:ring-destructive")}
        />
        <FieldError error={fieldErrors.name} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold">Phone</label>
        <Input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className={cn(fieldErrors.phone && "border-destructive focus-visible:ring-destructive")}
        />
        <FieldError error={fieldErrors.phone} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold">Public contact email</label>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={cn(fieldErrors.email && "border-destructive focus-visible:ring-destructive")}
        />
        <FieldError error={fieldErrors.email} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold">Website</label>
        <Input
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          placeholder="https://yourdealership.com"
          className={cn(fieldErrors.website && "border-destructive focus-visible:ring-destructive")}
        />
        <FieldError error={fieldErrors.website} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold">Description</label>
        <textarea
          className={cn(
            "min-h-[100px] w-full rounded-md border border-input px-3 py-2 text-sm",
            fieldErrors.description && "border-destructive focus-visible:ring-destructive"
          )}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={2000}
        />
        <FieldError error={fieldErrors.description} />
      </div>
      {message && (
        <p className={cn("text-sm", isError ? "text-destructive" : "text-muted-foreground")}>
          {message}
        </p>
      )}
      <Button type="button" disabled={saving} onClick={() => void save()}>
        {saving ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving…
          </>
        ) : (
          "Save changes"
        )}
      </Button>
    </div>
  );
}

function ChangePasswordCard() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (!submitted) return;
    setFieldErrors(
      getFieldErrors(changePasswordSchema, { currentPassword, newPassword, confirmPassword }) ?? {}
    );
  }, [currentPassword, newPassword, confirmPassword, submitted]);

  async function save() {
    setSubmitted(true);
    setMessage(null);
    setIsError(false);
    const errors = getFieldErrors(changePasswordSchema, {
      currentPassword,
      newPassword,
      confirmPassword,
    });
    if (errors) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setSaving(true);
    try {
      await dealerPortalApi.changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      setSubmitted(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMessage("Password updated.");
    } catch (e) {
      setIsError(true);
      setMessage(e instanceof Error ? e.message : "Failed to update password");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="h-fit space-y-4 rounded-lg border border-border/70 bg-white p-5 sm:p-6 shadow-card">
      <CardHeader
        icon={Lock}
        title="Change password"
        subtitle="Requires your current password to confirm it's you."
      />
      <PasswordField
        label="Current password"
        value={currentPassword}
        onChange={setCurrentPassword}
        error={fieldErrors.currentPassword}
      />
      <PasswordField
        label="New password"
        value={newPassword}
        onChange={setNewPassword}
        placeholder="8+ characters"
        error={fieldErrors.newPassword}
      />
      <PasswordField
        label="Confirm new password"
        value={confirmPassword}
        onChange={setConfirmPassword}
        error={fieldErrors.confirmPassword}
      />
      {message && (
        <p className={cn("text-sm", isError ? "text-destructive" : "text-muted-foreground")}>
          {message}
        </p>
      )}
      <Button type="button" disabled={saving} onClick={() => void save()}>
        {saving ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Updating…
          </>
        ) : (
          "Update password"
        )}
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Updates
// ---------------------------------------------------------------------------

/** Placeholder cards shaped like the real updates feed, shown while the
 * list is loading instead of a spinner pinned in empty space. */
function UpdatesSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-lg border border-border/70 bg-white p-4 shadow-card">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="mt-2 h-3 w-full" />
          <Skeleton className="mt-1.5 h-3 w-2/3" />
          <Skeleton className="mt-2 h-3 w-24" />
        </div>
      ))}
    </div>
  );
}

function UpdatesTab() {
  const [updates, setUpdates] = useState<DealerUpdateDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DealerUpdateDto | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!submitted) return;
    setFieldErrors(getFieldErrors(dealerUpdateFormSchema, { title, body }) ?? {});
  }, [title, body, submitted]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setUpdates(await dealerPortalApi.updates());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load updates");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function startEdit(u: DealerUpdateDto) {
    setEditingId(u.id);
    setTitle(u.title);
    setBody(u.body);
    setFieldErrors({});
    setSubmitted(false);
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setTitle("");
    setBody("");
    setFieldErrors({});
    setSubmitted(false);
  }

  async function save() {
    setSubmitted(true);
    setError(null);
    const errors = getFieldErrors(dealerUpdateFormSchema, { title, body });
    if (errors) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setSaving(true);
    try {
      if (editingId) {
        const updated = await dealerPortalApi.editUpdate(editingId, title, body);
        setUpdates((prev) => prev.map((u) => (u.id === editingId ? updated : u)));
      } else {
        const created = await dealerPortalApi.postUpdate(title, body);
        setUpdates((prev) => [created, ...prev]);
      }
      cancelEdit();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save update");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await dealerPortalApi.deleteUpdate(deleteTarget.id);
      setUpdates((prev) => prev.filter((u) => u.id !== deleteTarget.id));
      if (editingId === deleteTarget.id) cancelEdit();
      setDeleteTarget(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete update");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border/70 bg-white p-4 sm:p-5 shadow-card">
        <p className="mb-2 text-sm font-semibold text-foreground">
          {editingId ? "Edit update" : "Post an update"}
        </p>
        <p className="mb-3 text-xs text-muted-foreground">
          Shown on your public profile — new inventory, hours changes, promotions, anything customers should know.
        </p>
        <Input
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          className={cn(fieldErrors.title && "border-destructive focus-visible:ring-destructive")}
        />
        <FieldError error={fieldErrors.title} />
        <textarea
          className={cn(
            "mt-2 min-h-[80px] w-full rounded-md border border-input px-3 py-2 text-sm",
            fieldErrors.body && "border-destructive focus-visible:ring-destructive"
          )}
          placeholder="What's the update?"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={5000}
        />
        <FieldError error={fieldErrors.body} />
        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
        <div className="mt-2 flex gap-2">
          <Button type="button" size="sm" disabled={saving} onClick={() => void save()}>
            {saving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {editingId ? "Saving…" : "Posting…"}
              </>
            ) : editingId ? (
              "Save changes"
            ) : (
              "Post update"
            )}
          </Button>
          {editingId && (
            <Button type="button" size="sm" variant="outline" disabled={saving} onClick={cancelEdit}>
              Cancel
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <UpdatesSkeleton />
      ) : (
        <div className="space-y-3">
          {updates.map((u) => (
            <div key={u.id} className="rounded-lg border border-border/70 bg-white p-4 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-foreground">{u.title}</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-foreground/90">
                    {u.body}
                  </p>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {format(new Date(u.createdAt), "MMM d, yyyy")}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    aria-label="Edit update"
                    onClick={() => startEdit(u)}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Delete update"
                    onClick={() => setDeleteTarget(u)}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDeleteDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete this update?"
        description={
          deleteTarget ? `This removes "${deleteTarget.title}" from your public profile. This can't be undone.` : ""
        }
        loading={deleting}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shell
// ---------------------------------------------------------------------------

function NavList({
  tab,
  onSelect,
}: {
  tab: Tab;
  onSelect: (t: Tab) => void;
}) {
  return (
    <nav className="flex flex-1 flex-col gap-1 p-3">
      {NAV.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          type="button"
          onClick={() => onSelect(key)}
          className={cn(
            "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors",
            tab === key
              ? "bg-secondary text-primary"
              : "text-muted-foreground hover:bg-slate-100 hover:text-foreground"
          )}
        >
          <Icon className="h-4 w-4" />
          {label}
        </button>
      ))}
    </nav>
  );
}

export function DealerPortal() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [dealer, setDealer] = useState<AdminDealer | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    setAuthed(Boolean(getDealerPortalToken()));
  }, []);

  useEffect(() => {
    if (!authed) return;
    dealerPortalApi
      .me()
      .then(setDealer)
      .catch(() => {
        clearDealerPortalToken();
        setAuthed(false);
      });
  }, [authed]);

  useEffect(() => {
    document.body.style.overflow = mobileNavOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileNavOpen]);

  const activeLabel = useMemo(
    () => NAV.find((n) => n.key === tab)?.label ?? "Overview",
    [tab]
  );

  if (authed === null) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
      </div>
    );
  }

  if (!authed) {
    return <LoginForm onSuccess={() => setAuthed(true)} />;
  }

  function signOut() {
    void dealerPortalApi.logout().catch(() => undefined);
    clearDealerPortalToken();
    setAuthed(false);
    setDealer(null);
  }

  function selectTab(t: Tab) {
    setTab(t);
    setMobileNavOpen(false);
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-white md:sticky md:top-0 md:flex md:h-screen">
        <div className="border-b border-border px-4 py-5">
          <BrandLogo />
          {dealer && (
            <p className="mt-2 truncate text-sm font-semibold text-muted-foreground">
              {dealer.name}
            </p>
          )}
        </div>
        <NavList tab={tab} onSelect={selectTab} />
        <div className="border-t border-border p-3">
          <Button
            type="button"
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-foreground"
            onClick={signOut}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </aside>

      {/* Mobile drawer */}
      <div
        className={cn(
          "fixed inset-0 z-50 transition-opacity duration-300 ease-out md:hidden",
          mobileNavOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        )}
        aria-hidden={!mobileNavOpen}
      >
        <div className="absolute inset-0 bg-black/40" onClick={() => setMobileNavOpen(false)} />
        <div
          className={cn(
            "absolute inset-y-0 left-0 flex w-72 max-w-[80%] flex-col bg-white shadow-2xl transition-transform duration-300 ease-out",
            mobileNavOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-5">
            <BrandLogo className="min-w-0" />
            <button
              type="button"
              onClick={() => setMobileNavOpen(false)}
              aria-label="Close menu"
              className="shrink-0 rounded-md p-2 text-muted-foreground hover:bg-slate-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <NavList tab={tab} onSelect={selectTab} />
          <div className="border-t border-border p-3">
            <Button
              type="button"
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:text-foreground"
              onClick={signOut}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <header className="border-b border-border bg-white px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-slate-100 hover:text-foreground md:hidden"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold tracking-tight text-foreground">
                {activeLabel}
              </h1>
              {dealer && (
                <p className="hidden truncate text-sm text-muted-foreground sm:block">
                  {dealer.name}
                </p>
              )}
            </div>
          </div>
        </header>

        <div className="px-4 py-6 sm:px-6">
          {!dealer ? (
            <LoadingBlock label="Loading your dashboard…" />
          ) : (
            <>
              {tab === "overview" && <OverviewTab dealer={dealer} onNavigate={setTab} />}
              {tab === "inventory" && <InventoryTab />}
              {tab === "reviews" && <ReviewsTab />}
              {tab === "profile" && (
                <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
                  <ProfileTab dealer={dealer} onSaved={setDealer} />
                  <ChangePasswordCard />
                </div>
              )}
              {tab === "updates" && <UpdatesTab />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
