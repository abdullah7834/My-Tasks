"use client";

import { useState } from "react";
import { CreateProjectDialog } from "@/components/shared/CreateProjectDialog";

interface Project {
  id: string;
  name: string;
  color: string | null;
}

interface ProjectsSectionProps {
  initialProjects: Project[];
}

export function ProjectsSection({ initialProjects }: ProjectsSectionProps) {
  const [projects, setProjects] = useState(initialProjects);

  const handleProjectCreated = async () => {
    const response = await fetch("/api/projects");
    const data = await response.json();
    setProjects(data.projects ?? []);
  };

  return (
    <section className="rounded-2xl border border-border bg-card">
      <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Projects
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
            {projects.length}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Active in your workspace.
          </p>
        </div>
        <CreateProjectDialog onProjectCreated={handleProjectCreated} />
      </div>
      {projects.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-muted-foreground">
          No projects yet.
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {projects.map((project) => (
            <li
              key={project.id}
              className="flex items-center gap-3 px-5 py-3 transition hover:bg-muted/40"
            >
              <span
                className="size-2 rounded-full"
                style={{ background: project.color ?? "oklch(0.7 0 0)" }}
              />
              <span className="text-sm font-medium text-foreground">
                {project.name}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
