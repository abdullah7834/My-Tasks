"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface RoleItem {
  id: string;
  name: string;
}

interface ProfileFormProps {
  profile: {
    full_name?: string | null;
    phone?: string | null;
    timezone?: string | null;
    avatar_url?: string | null;
    selectedRoleId?: string | null;
  };
  roles: RoleItem[];
}

const timezones = [
  "UTC",
  "America/New_York",
  "Europe/London",
  "Asia/Kolkata",
  "Australia/Sydney",
];

export default function ProfileForm({ profile, roles }: ProfileFormProps) {
  const router = useRouter();
  const [fullName, setFullName] = useState(profile.full_name ?? "");
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [timezone, setTimezone] = useState(profile.timezone ?? "UTC");
  const [roleId, setRoleId] = useState(profile.selectedRoleId ?? "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const previewUrl = useMemo(() => {
    if (avatarFile) {
      return URL.createObjectURL(avatarFile);
    }
    return profile.avatar_url || null;
  }, [avatarFile, profile.avatar_url]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setAvatarFile(file);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);

    try {
      const formData = new FormData();
      formData.append("full_name", fullName);
      formData.append("phone", phone);
      formData.append("timezone", timezone);
      if (roleId) {
        formData.append("role_id", roleId);
      }
      if (avatarFile) {
        formData.append("avatar", avatarFile);
      }

      const response = await fetch("/api/profile", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (!response.ok) {
        toast.error(result.error || "Unable to save your profile.");
        return;
      }

      toast.success("Profile saved successfully.");
      router.refresh();
    } catch (error) {
      toast.error("Failed to save profile. Try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-border bg-card p-6 shadow-sm shadow-black/5">
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <div className="space-y-3">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Your profile</h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Update your profile details, choose a timezone, and store an avatar for your dashboard.
          </p>
        </div>

        <div className="grid gap-4">
          <div className="flex items-center gap-4 rounded-3xl border border-border bg-background p-4">
            <div className="relative h-24 w-24 overflow-hidden rounded-full bg-slate-950/70">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Avatar preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="grid h-full w-full place-items-center text-sm text-muted-foreground">
                  Avatar
                </div>
              )}
            </div>
            <label className="cursor-pointer rounded-2xl border border-border bg-slate-950/80 px-4 py-2 text-sm text-slate-100 transition hover:bg-slate-900">
              Choose avatar
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleFileChange}
              />
            </label>
          </div>

          <div className="grid gap-2 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Profile photo</p>
            <p>PNG, JPG, or GIF up to 5MB. The image will be stored in your avatar bucket.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm text-muted-foreground">
          <span className="block text-sm font-medium text-foreground">Full name</span>
          <input
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            placeholder="Jane Doe"
            className="w-full rounded-3xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-foreground"
          />
        </label>

        <label className="space-y-2 text-sm text-muted-foreground">
          <span className="block text-sm font-medium text-foreground">Phone</span>
          <input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="+1 555 123 4567"
            className="w-full rounded-3xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-foreground"
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm text-muted-foreground">
          <span className="block text-sm font-medium text-foreground">Timezone</span>
          <input
            list="timezone-options"
            value={timezone}
            onChange={(event) => setTimezone(event.target.value)}
            placeholder="UTC"
            className="w-full rounded-3xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-foreground"
          />
          <datalist id="timezone-options">
            {timezones.map((tz) => (
              <option key={tz} value={tz} />
            ))}
          </datalist>
        </label>

        <label className="space-y-2 text-sm text-muted-foreground">
          <span className="block text-sm font-medium text-foreground">Primary role</span>
          <select
            value={roleId}
            onChange={(event) => setRoleId(event.target.value)}
            className="w-full rounded-3xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-foreground"
          >
            <option value="">Select a role</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Profile settings</p>
          <p>Save your profile and avatar to keep your workspace personalized.</p>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center justify-center rounded-3xl bg-foreground px-5 py-3 text-sm font-semibold text-background transition hover:bg-foreground/90 disabled:opacity-60"
        >
          {isSaving ? "Saving…" : "Save profile"}
        </button>
      </div>
    </form>
  );
}
