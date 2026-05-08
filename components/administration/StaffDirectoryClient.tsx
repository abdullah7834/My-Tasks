"use client";

import { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, Shield, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";

interface Role { id: string; name: string; level: number }
interface StaffMember {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  roles: Role[];
}

export function StaffDirectoryClient({
  initialStaff,
  allRoles,
}: {
  initialStaff: StaffMember[];
  allRoles: Role[];
}) {
  const [staff, setStaff] = useState<StaffMember[]>(initialStaff);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);
  const [editRoleId, setEditRoleId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActionMenuId(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggleActive = async (member: StaffMember) => {
    const next = !member.is_active;
    setStaff((prev) => prev.map((m) => m.id === member.id ? { ...m, is_active: next } : m));
    setActionMenuId(null);
    try {
      const res = await fetch("/api/admin/staff", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: member.id, is_active: next }),
      });
      if (!res.ok) throw new Error();
      toast.success(next ? "User activated" : "User deactivated");
    } catch {
      setStaff((prev) => prev.map((m) => m.id === member.id ? { ...m, is_active: !next } : m));
      toast.error("Failed to update user");
    }
  };

  const assignRole = async (memberId: string, roleId: string | null) => {
    try {
      const res = await fetch("/api/admin/staff", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: memberId, role_id: roleId }),
      });
      if (!res.ok) throw new Error();
      const role = allRoles.find((r) => r.id === roleId) ?? null;
      setStaff((prev) =>
        prev.map((m) => m.id === memberId ? { ...m, roles: role ? [role] : [] } : m),
      );
      toast.success("Role updated");
    } catch {
      toast.error("Failed to update role");
    }
    setEditRoleId(null);
  };

  const displayed = staff.filter((m) => {
    const matchSearch =
      !search ||
      m.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && m.is_active) ||
      (filterStatus === "inactive" && !m.is_active);
    return matchSearch && matchStatus;
  });

  const initials = (m: StaffMember) => {
    const name = m.full_name ?? m.email;
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm w-full max-w-sm">
          <Search size={15} className="shrink-0 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search staff..."
            className="w-full bg-transparent outline-none placeholder:text-muted-foreground/60 text-foreground"
          />
        </div>
        <div className="flex items-center gap-2">
          {(["all", "active", "inactive"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`capitalize rounded-full border px-4 py-1.5 text-xs font-medium transition ${
                filterStatus === s
                  ? "border-transparent bg-foreground text-background"
                  : "border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Role(s)</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Joined</th>
                <th className="w-px px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {displayed.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-14 text-center text-sm text-muted-foreground">
                    No staff members found.
                  </td>
                </tr>
              ) : (
                displayed.map((member) => (
                  <tr key={member.id} className="group transition hover:bg-muted/30">
                    {/* Name */}
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold text-foreground">
                          {initials(member)}
                        </span>
                        <span className="font-medium text-foreground">
                          {member.full_name ?? "—"}
                        </span>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-4 py-3 text-muted-foreground">{member.email}</td>

                    {/* Role */}
                    <td className="px-4 py-3">
                      {editRoleId === member.id ? (
                        <div className="relative">
                          <select
                            autoFocus
                            defaultValue={member.roles[0]?.id ?? ""}
                            onBlur={(e) => assignRole(member.id, e.target.value || null)}
                            onChange={(e) => assignRole(member.id, e.target.value || null)}
                            className="rounded-lg border border-border bg-background px-2 py-1 text-xs text-foreground outline-none"
                          >
                            <option value="">No role</option>
                            {allRoles.map((r) => (
                              <option key={r.id} value={r.id}>{r.name}</option>
                            ))}
                          </select>
                        </div>
                      ) : member.roles.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {member.roles.map((r) => (
                            <span
                              key={r.id}
                              className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-foreground"
                            >
                              <Shield size={10} />
                              {r.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          member.is_active
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <span
                          className={`size-1.5 rounded-full ${member.is_active ? "bg-emerald-500" : "bg-muted-foreground/50"}`}
                        />
                        {member.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>

                    {/* Joined */}
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(member.created_at).toLocaleDateString("en-US", {
                        month: "short", day: "numeric", year: "numeric",
                      })}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3">
                      <div className="relative flex justify-end" ref={actionMenuId === member.id ? menuRef : undefined}>
                        <button
                          onClick={() => setActionMenuId(actionMenuId === member.id ? null : member.id)}
                          className="grid size-7 place-items-center rounded-md text-muted-foreground opacity-0 transition hover:bg-muted hover:text-foreground group-hover:opacity-100"
                        >
                          <MoreHorizontal size={15} />
                        </button>

                        {actionMenuId === member.id && (
                          <div className="absolute right-0 top-8 z-20 min-w-[148px] rounded-xl border border-border bg-card py-1 shadow-lg shadow-black/10">
                            <button
                              onClick={() => { setEditRoleId(member.id); setActionMenuId(null); }}
                              className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-foreground hover:bg-muted"
                            >
                              <Shield size={13} strokeWidth={1.75} />
                              Edit Roles
                            </button>
                            <button
                              onClick={() => toggleActive(member)}
                              className={`flex w-full items-center gap-2.5 px-4 py-2 text-sm hover:bg-muted ${
                                member.is_active ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"
                              }`}
                            >
                              <span className={`size-3.5 rounded-full border-2 ${member.is_active ? "border-red-400" : "border-emerald-400"}`} />
                              {member.is_active ? "Deactivate" : "Activate"}
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {displayed.length} of {staff.length} member{staff.length !== 1 ? "s" : ""}
      </p>
    </div>
  );
}
