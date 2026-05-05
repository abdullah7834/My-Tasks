"use client";

import { useState } from "react";
import { CreateProjectDialog } from "@/components/shared/CreateProjectDialog";

interface Project {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface ProjectsSectionProps {
  initialProjects: Project[];
}

export function ProjectsSection({ initialProjects }: ProjectsSectionProps) {
  const [projects, setProjects] = useState(initialProjects);

  const handleProjectCreated = async () => {
    // Refresh projects
    const response = await fetch("/api/projects");
    const data = await response.json();
    setProjects(data.projects ?? []);
  };

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl shadow-black/20">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Projects</p>
          <p className="mt-4 text-4xl font-semibold text-white">{projects.length}</p>
          <p className="mt-2 text-sm text-slate-400">Active projects in your workspace.</p>
        </div>
        <CreateProjectDialog onProjectCreated={handleProjectCreated} />
      </div>
      <div className="space-y-2">
        {projects.map((project) => (
          <div key={project.id} className="flex items-center gap-3 rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3">
            <span className="text-lg">{project.icon}</span>
            <span className="text-sm font-medium text-slate-200">{project.name}</span>
          </div>
        ))}
      </div>
    </section>
  );
}