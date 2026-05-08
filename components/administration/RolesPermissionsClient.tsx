"use client";

import { useState, useRef, useEffect } from "react";
import { Search, Plus, Shield, Users, KeyRound, MoreHorizontal, X, Check } from "lucide-react";
import { toast } from "sonner";

interface Permission { id: string; key: string; label: string; category: string }
interface Role {
  id: string;
  name: string;
  description: string | null;
  level: number;
  is_active: boolean;
  is_system: boolean;
  user_count: number;
  permission_count: number;
  permissions: Permission[];
}

export function RolesPermissionsClient({
  initialRoles,
  allPermissions,
}: {
  initialRoles: Role[];
  allPermissions: Permission[];
}) {
  const [roles, setRoles] = useState<Role[]>(initialRoles);
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [creating, setCreating] = useState(false);
  const [newRole, setNewRole] = useState({ name: "", description: "", level: 50 });
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

  const toggleActive = async (role: Role) => {
    const next = !role.is_active;
    setRoles((prev) => prev.map((r) => r.id === role.id ? { ...r, is_active: next } : r));
    setActionMenuId(null);
    try {
      const res = await fetch(`/api/admin/roles/${role.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: next }),
      });
      if (!res.ok) throw new Error();
      toast.success(next ? "Role activated" : "Role deactivated");
    } catch {
      setRoles((prev) => prev.map((r) => r.id === role.id ? { ...r, is_active: !next } : r));
      toast.error("Failed to update role");
    }
  };

  const savePermissions = async (role: Role, permIds: string[]) => {
    try {
      const res = await fetch(`/api/admin/roles/${role.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permission_ids: permIds }),
      });
      if (!res.ok) throw new Error();
      const perms = allPermissions.filter((p) => permIds.includes(p.id));
      setRoles((prev) =>
        prev.map((r) => r.id === role.id ? { ...r, permissions: perms, permission_count: perms.length } : r),
      );
      toast.success("Permissions saved");
      setEditingRole(null);
    } catch {
      toast.error("Failed to save permissions");
    }
  };

  const createRole = async () => {
    if (!newRole.name.trim()) { toast.error("Role name required"); return; }
    try {
      const res = await fetch("/api/admin/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRole),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRoles((prev) => [data.role, ...prev]);
      setCreating(false);
      setNewRole({ name: "", description: "", level: 50 });
      toast.success("Role created");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to create role");
    }
  };

  const displayed = roles.filter((r) => {
    const matchSearch =
      !search ||
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.description?.toLowerCase().includes(search.toLowerCase());
    const matchActive = showInactive ? true : r.is_active;
    return matchSearch && matchActive;
  });

  const categories = [...new Set(allPermissions.map((p) => p.category))].sort();

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm w-full max-w-sm">
          <Search size={15} className="shrink-0 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search roles..."
            className="w-full bg-transparent outline-none placeholder:text-muted-foreground/60 text-foreground"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowInactive((v) => !v)}
            className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
              showInactive
                ? "border-transparent bg-muted text-foreground"
                : "border-border text-muted-foreground hover:bg-muted/60"
            }`}
          >
            {showInactive ? "Hide Inactive" : "Show Inactive"}
          </button>
          <button
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-foreground px-4 py-2 text-sm font-medium text-background transition hover:bg-foreground/90"
          >
            <Plus size={15} strokeWidth={2} />
            Create Role
          </button>
        </div>
      </div>

      {/* Create role inline form */}
      {creating && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">New Role</h3>
            <button onClick={() => setCreating(false)} className="text-muted-foreground hover:text-foreground">
              <X size={15} />
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Name *</label>
              <input
                value={newRole.name}
                onChange={(e) => setNewRole((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Auditor"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-foreground/30"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Description</label>
              <input
                value={newRole.description}
                onChange={(e) => setNewRole((p) => ({ ...p, description: e.target.value }))}
                placeholder="Short description"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-foreground/30"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Level (0–100)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={newRole.level}
                onChange={(e) => setNewRole((p) => ({ ...p, level: Number(e.target.value) }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-foreground/30"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={() => setCreating(false)}
              className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-muted"
            >
              Cancel
            </button>
            <button
              onClick={createRole}
              className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90"
            >
              Create
            </button>
          </div>
        </div>
      )}

      {/* Roles table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3 text-left">Role</th>
                <th className="px-4 py-3 text-left">Description</th>
                <th className="px-4 py-3 text-center">Level</th>
                <th className="px-4 py-3 text-center">Users</th>
                <th className="px-4 py-3 text-center">Permissions</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="w-px px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {displayed.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-14 text-center text-sm text-muted-foreground">
                    No roles found.
                  </td>
                </tr>
              ) : (
                displayed.map((role) => (
                  <tr key={role.id} className="group transition hover:bg-muted/30">
                    {/* Role name */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <Shield size={14} className="shrink-0 text-muted-foreground" />
                        <span className="font-medium text-foreground">{role.name}</span>
                        {role.is_system && (
                          <span className="rounded border border-border px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                            System
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Description */}
                    <td className="max-w-xs px-4 py-3.5">
                      <p className="truncate text-muted-foreground" title={role.description ?? ""}>
                        {role.description ?? "—"}
                      </p>
                    </td>

                    {/* Level */}
                    <td className="px-4 py-3.5 text-center">
                      <span className="inline-block rounded-lg bg-muted px-2.5 py-0.5 text-xs font-semibold text-foreground">
                        {role.level}
                      </span>
                    </td>

                    {/* Users */}
                    <td className="px-4 py-3.5 text-center">
                      <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                        <Users size={13} />
                        {role.user_count}
                      </span>
                    </td>

                    {/* Permissions */}
                    <td className="px-4 py-3.5 text-center">
                      <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                        <KeyRound size={13} />
                        {role.permission_count}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          role.is_active
                            ? "bg-foreground text-background"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {role.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5">
                      <div className="relative flex justify-end" ref={actionMenuId === role.id ? menuRef : undefined}>
                        <button
                          onClick={() => setActionMenuId(actionMenuId === role.id ? null : role.id)}
                          className="grid size-7 place-items-center rounded-md text-muted-foreground opacity-0 transition hover:bg-muted hover:text-foreground group-hover:opacity-100"
                        >
                          <MoreHorizontal size={15} />
                        </button>

                        {actionMenuId === role.id && (
                          <div className="absolute right-0 top-8 z-20 min-w-[148px] rounded-xl border border-border bg-card py-1 shadow-lg shadow-black/10">
                            <button
                              onClick={() => { setEditingRole({ ...role }); setActionMenuId(null); }}
                              className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-foreground hover:bg-muted"
                            >
                              <Shield size={13} strokeWidth={1.75} />
                              Edit Roles
                            </button>
                            <button
                              onClick={() => toggleActive(role)}
                              className={`flex w-full items-center gap-2.5 px-4 py-2 text-sm hover:bg-muted ${
                                role.is_active ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"
                              }`}
                            >
                              <span className={`size-3.5 rounded-full border-2 ${role.is_active ? "border-red-400" : "border-emerald-400"}`} />
                              {role.is_active ? "Deactivate" : "Activate"}
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

      {/* Edit permissions drawer */}
      {editingRole && (
        <PermissionsDrawer
          role={editingRole}
          allPermissions={allPermissions}
          categories={categories}
          onSave={(ids) => savePermissions(editingRole, ids)}
          onClose={() => setEditingRole(null)}
        />
      )}
    </div>
  );
}

function PermissionsDrawer({
  role,
  allPermissions,
  categories,
  onSave,
  onClose,
}: {
  role: Role;
  allPermissions: Permission[];
  categories: string[];
  onSave: (ids: string[]) => void;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(
    new Set(role.permissions.map((p) => p.id)),
  );

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const toggleAll = (perms: Permission[]) => {
    const allOn = perms.every((p) => selected.has(p.id));
    setSelected((prev) => {
      const next = new Set(prev);
      perms.forEach((p) => (allOn ? next.delete(p.id) : next.add(p.id)));
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl border border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="font-semibold text-foreground">Edit Permissions — {role.name}</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">{selected.size} permission{selected.size !== 1 ? "s" : ""} selected</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        {/* Permissions by category */}
        <div className="max-h-[60vh] overflow-y-auto px-6 py-4 space-y-5">
          {categories.map((cat) => {
            const perms = allPermissions.filter((p) => p.category === cat);
            const allOn = perms.every((p) => selected.has(p.id));
            return (
              <div key={cat}>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{cat}</p>
                  <button
                    onClick={() => toggleAll(perms)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    {allOn ? "Deselect all" : "Select all"}
                  </button>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {perms.map((perm) => (
                    <label
                      key={perm.id}
                      className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-background p-3 transition hover:bg-muted/40"
                    >
                      <div
                        onClick={() => toggle(perm.id)}
                        className={`mt-0.5 grid size-4 shrink-0 place-items-center rounded border transition ${
                          selected.has(perm.id)
                            ? "border-foreground bg-foreground"
                            : "border-border bg-background"
                        }`}
                      >
                        {selected.has(perm.id) && <Check size={10} strokeWidth={3} className="text-background" />}
                      </div>
                      <div onClick={() => toggle(perm.id)}>
                        <p className="text-sm font-medium text-foreground">{perm.label}</p>
                        <p className="text-xs text-muted-foreground">{perm.key}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-border px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-xl border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-muted"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave([...selected])}
            className="rounded-xl bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90"
          >
            Save permissions
          </button>
        </div>
      </div>
    </div>
  );
}
