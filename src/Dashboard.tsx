import { ArrowUpRight, FilePlus2, FolderOpen } from "lucide-react";

type Props = {
  create: () => void;
  open: () => void;
  recent: string[];
  load: (path: string) => void;
  busy: boolean;
};

export function Dashboard(props: Props) {
  return (
    <main className="dashboard">
      <section className="welcome">
        <p className="eyebrow">Your local workspace</p>
        <h1>
          A place for
          <br />
          <span>your next idea.</span>
        </h1>
        <p className="welcome-copy">Open a design or start with a clean canvas.</p>
        <div className="welcome-actions">
          <button className="primary" onClick={props.create} disabled={props.busy}>
            <FilePlus2 size={18} />
            New project
          </button>
          <button onClick={props.open} disabled={props.busy}>
            <FolderOpen size={18} />
            Open project
          </button>
        </div>
        <RecentProjects recent={props.recent} load={props.load} />
      </section>
    </main>
  );
}

function RecentProjects(props: Pick<Props, "recent" | "load">) {
  return (
    <section className="recent-projects">
      <h2>Recent projects</h2>
      {props.recent.length ? (
        props.recent.map((path) => (
          <button key={path} onClick={() => props.load(path)}>
            <FolderOpen size={18} />
            <span>
              {path.split(/[\\/]/u).at(-1)}
              <small>{path}</small>
            </span>
            <ArrowUpRight size={15} />
          </button>
        ))
      ) : (
        <p>Saved projects will appear here.</p>
      )}
    </section>
  );
}
