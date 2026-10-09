import { Home, Plus, X } from "lucide-react";
import type { ProjectSnapshot } from "../../shared/document/model";
import { useEffect, useState } from "react";

type Props = {
  projects: ProjectSnapshot[];
  activeId: string | null;
  dashboard: boolean;
  busy: boolean;
  home: () => void;
  activate: (id: string) => void;
  close: (id: string) => void;
  add: () => void;
  save: (id: string) => void;
};

export function Header(props: Props) {
  return (
    <header className="topbar">
      <button className="dashboard-button" onClick={props.home} aria-pressed={props.dashboard}>
        <Home size={17} />
        Dashboard
      </button>
      <nav className="project-tabs" aria-label="Open projects">
        {props.projects.map((project) => (
          <div
            key={project.document.id}
            className={`project-tab ${!props.dashboard && project.document.id === props.activeId ? "active" : ""}`}
          >
            <button
              className="project-name"
              onClick={() => props.activate(project.document.id)}
              disabled={props.busy}
            >
              {project.document.name}
            </button>
            <SaveFeedback project={project} save={() => props.save(project.document.id)} />
            <button
              className="close-tab"
              aria-label={`Close ${project.document.name}`}
              onClick={() => props.close(project.document.id)}
              disabled={props.busy}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </nav>
      <button className="new-project-button" onClick={props.add} aria-label="New or open project">
        <Plus size={18} />
      </button>
    </header>
  );
}

function SaveFeedback({ project, save }: { project: ProjectSnapshot; save: () => void }) {
  if (project.saveStatus.kind === "not-saved")
    return (
      <button className="save-feedback" onClick={save}>
        Not saved
      </button>
    );
  if (project.saveStatus.kind === "failed")
    return (
      <button className="save-feedback failed" onClick={save}>
        Save failed
      </button>
    );
  if (project.saveStatus.kind === "saving") return <span className="save-feedback">Saving</span>;
  return <BriefSaved key={project.saveStatus.revision} />;
}

function BriefSaved() {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 2000);
    return () => clearTimeout(timer);
  }, []);
  return visible ? <output className="save-feedback">Saved</output> : null;
}
