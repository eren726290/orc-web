import { useState } from "react";
import type { ProjectSnapshot } from "../shared/model";

type ProjectFlow =
  | { kind: "open" }
  | { kind: "save"; projectId: string; name: string; closeAfter: boolean };
type Act = (path: string, input: unknown) => Promise<boolean>;

export function useNavigation(act: Act) {
  const [dashboard, setDashboard] = useState(true);
  const [projectMenu, setProjectMenu] = useState(false);
  const flows = useProjectFlows(
    act,
    () => setDashboard(false),
    () => setProjectMenu(false),
  );
  const create = async () => {
    if (await act("/api/projects/new", {})) {
      setDashboard(false);
      setProjectMenu(false);
    }
  };
  const activate = async (projectId: string) => {
    if (await act("/api/projects/activate", { projectId })) setDashboard(false);
  };
  return {
    ...flows,
    dashboard,
    home: () => setDashboard(true),
    create,
    activate,
    projectMenu,
    toggleMenu: () => setProjectMenu((current) => !current),
  };
}

function useProjectFlows(act: Act, showEditor: () => void, closeMenu: () => void) {
  const [flow, setFlow] = useState<ProjectFlow | null>(null);
  const load = async (path: string) => {
    const result = await act("/api/projects/open", { path });
    if (result) showEditor();
    return result;
  };
  const open = () => {
    setFlow({ kind: "open" });
    closeMenu();
  };
  const save = (project: ProjectSnapshot, closeAfter = false) =>
    setFlow({
      kind: "save",
      projectId: project.document.id,
      name: project.document.name,
      closeAfter,
    });
  const submit = async (path: string, name: string) => {
    if (!flow) return false;
    if (flow.kind === "open") return load(path);
    const result = await act("/api/projects/save", {
      projectId: flow.projectId,
      parent: path,
      name,
    });
    if (result && flow.closeAfter)
      return act("/api/projects/close", { projectId: flow.projectId, discard: false });
    return result;
  };
  return { flow, load, open, save, submit, closeFlow: () => setFlow(null) };
}
