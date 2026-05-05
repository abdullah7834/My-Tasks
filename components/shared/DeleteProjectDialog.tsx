"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  project: { id: string; name: string; taskCount: number } | null;
  onClose: () => void;
}

export function DeleteProjectDialog({ project, onClose }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (!project) return null;

  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects?id=${project.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Could not delete project");
      }
      toast.success("Project deleted");
      onClose();
      router.refresh();
    } catch (err: any) {
      toast.error(err?.message ?? "Could not delete project");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-foreground/30 p-4 backdrop-blur-sm"
      onClick={() => !loading && onClose()}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl border border-border bg-card shadow-2xl shadow-foreground/10"
      >
        <div className="p-5">
          <div className="flex items-start gap-3">
            <div className="grid size-9 shrink-0 place-items-center rounded-full bg-danger-muted text-danger">
              <AlertTriangle size={18} strokeWidth={1.75} />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold tracking-tight text-foreground">
                Delete project?
              </h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">
                  "{project.name}"
                </span>{" "}
                will be permanently deleted
                {project.taskCount > 0 && (
                  <>
                    {" "}
                    along with its{" "}
                    <span className="font-medium text-foreground">
                      {project.taskCount}{" "}
                      {project.taskCount === 1 ? "task" : "tasks"}
                    </span>
                  </>
                )}
                . This can't be undone.
              </p>
            </div>
          </div>

          <div className="mt-5 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 rounded-lg border border-border bg-card py-2 text-sm font-medium text-foreground transition hover:bg-muted disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-danger py-2 text-sm font-medium text-danger-foreground transition hover:bg-danger/90 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Deleting…
                </>
              ) : (
                "Delete"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
