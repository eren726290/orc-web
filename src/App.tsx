import { useState } from "react";
import { Dashboard } from "./Dashboard";
import { Header } from "./Header";
import { ProjectDialog } from "./project-dialog";
import { useSession } from "./useSession";
import { useNavigation } from "./navigation";
import { Workspace } from "./Workspace";
import { useModal } from "./useModal";
import type { ProjectSnapshot } from "../shared/model";
import { DiscardDraft, useDraftGuard } from "./draft-guard";

export function App() {
  const connection = useSession();
  const navigation = useNavigation(connection.act);
  const [closing, setClosing] = useState<ProjectSnapshot | null>(null);
  const [recovery, setRecovery] = useState<ProjectSnapshot | null>(null);
  return (
    <div className="app-shell">
      <AppHeader
        connection={connection}
        navigation={navigation}
        close={setClosing}
        recover={setRecovery}
      />
      <AppMessages connection={connection} />
      <AppContent connection={connection} navigation={navigation} />
      <AppDialogs
        connection={connection}
        navigation={navigation}
        closing={closing}
        close={() => setClosing(null)}
      />
      {recovery && (
        <SaveRecovery
          project={recovery}
          connection={connection}
          close={() => setRecovery(null)}
          saveAs={() => {
            navigation.save(recovery);
            setRecovery(null);
          }}
        />
      )}
    </div>
  );
}

function AppMessages({ connection }: Pick<AppState, "connection">) {
  return (
    <>
      {connection.error && (
        <div className="app-error" role="alert">
          {connection.error}
          <button onClick={() => connection.setError(null)} aria-label="Dismiss error">
            Dismiss
          </button>
        </div>
      )}
      {!connection.connected && (
        <output className="connection-status">
          Disconnected. Your workspace will reconnect when the local server is available.
        </output>
      )}
    </>
  );
}

function AppDialogs({
  connection,
  navigation,
  closing,
  close,
}: AppState & { closing: ProjectSnapshot | null; close: () => void }) {
  return (
    <>
      {navigation.flow && (
        <ProjectDialog
          key={navigation.flow.kind}
          kind={navigation.flow.kind}
          initialName={navigation.flow.kind === "save" ? navigation.flow.name : ""}
          close={navigation.closeFlow}
          submit={navigation.submit}
          error={connection.error}
        />
      )}
      {closing && (
        <CloseProject
          project={closing}
          cancel={close}
          save={() => {
            navigation.save(closing, true);
            close();
          }}
          discard={() => {
            void connection
              .act("/api/projects/close", { projectId: closing.document.id, discard: true })
              .then((done) => {
                if (done) close();
              });
          }}
        />
      )}
    </>
  );
}

type AppState = {
  connection: ReturnType<typeof useSession>;
  navigation: ReturnType<typeof useNavigation>;
};

function AppHeader({
  connection,
  navigation,
  close,
  recover,
}: AppState & {
  close: (project: ProjectSnapshot) => void;
  recover: (project: ProjectSnapshot) => void;
}) {
  const draftGuard = useDraftGuard();
  const projects = connection.session.projects;
  const closeProject = async (id: string) => {
    if (!(await draftGuard.request(id))) return;
    const project = projects.find((item) => item.document.id === id);
    if (!project) return;
    if (project.document.revision > 0 && project.saveStatus.kind !== "saved") close(project);
    else void connection.act("/api/projects/close", { projectId: id, discard: false });
  };
  return (
    <>
      <Header
        projects={projects}
        activeId={connection.session.activeProjectId}
        dashboard={navigation.dashboard}
        busy={connection.busy}
        home={navigation.home}
        activate={(id) => void navigation.activate(id)}
        close={(id) => void closeProject(id)}
        add={navigation.toggleMenu}
        save={(id) => {
          const project = projects.find((item) => item.document.id === id);
          if (project?.saveStatus.kind === "failed") recover(project);
          else if (project) navigation.save(project);
        }}
      />
      {navigation.projectMenu && <ProjectMenu navigation={navigation} />}
      {draftGuard.pending && <DiscardDraft decide={draftGuard.decide} />}
    </>
  );
}

function ProjectMenu({ navigation }: Pick<AppState, "navigation">) {
  return (
    <div className="project-menu">
      <button onClick={() => void navigation.create()}>New project</button>
      <button onClick={navigation.open}>Open project</button>
    </div>
  );
}

function SaveRecovery(props: {
  project: ProjectSnapshot;
  connection: AppState["connection"];
  close: () => void;
  saveAs: () => void;
}) {
  const dialog = useModal();
  const retry = async () => {
    if (await props.connection.act("/api/projects/retry", { projectId: props.project.document.id }))
      props.close();
  };
  return (
    <dialog
      ref={dialog}
      onCancel={props.close}
      className="close-project"
      aria-labelledby="recovery-title"
    >
      <h2 id="recovery-title">Save failed · {props.project.document.name}</h2>
      <p>
        {props.connection.error ??
          (props.project.saveStatus.kind === "failed"
            ? props.project.saveStatus.message
            : "Your applied changes are still available in this session.")}
      </p>
      <div className="dialog-actions">
        <button onClick={props.close}>Cancel</button>
        <button onClick={props.saveAs} disabled={props.connection.busy}>
          Save as
        </button>
        <button className="primary" onClick={() => void retry()} disabled={props.connection.busy}>
          Retry
        </button>
      </div>
    </dialog>
  );
}

function AppContent({ connection, navigation }: AppState) {
  const active = connection.session.projects.find(
    (project) => project.document.id === connection.session.activeProjectId,
  );
  if (navigation.dashboard || !active)
    return (
      <Dashboard
        create={() => void navigation.create()}
        open={navigation.open}
        recent={connection.session.recentPaths}
        load={(path) => void navigation.load(path)}
        busy={connection.busy || !connection.connected}
      />
    );
  return (
    <Workspace
      key={active.document.id}
      project={active}
      act={connection.act}
      disabled={connection.busy || !connection.connected}
      error={connection.error}
    />
  );
}

function CloseProject(props: {
  project: ProjectSnapshot;
  cancel: () => void;
  save: () => void;
  discard: () => void;
}) {
  const dialog = useModal();
  return (
    <dialog
      ref={dialog}
      onCancel={props.cancel}
      className="close-project"
      role="alertdialog"
      aria-labelledby="close-title"
      aria-modal="true"
    >
      <h2 id="close-title">Save changes to {props.project.document.name}?</h2>
      <p>Your applied changes have not been saved.</p>
      <div className="dialog-actions">
        <button onClick={props.cancel}>Cancel</button>
        <button onClick={props.discard}>Discard</button>
        <button className="primary" onClick={props.save}>
          Save
        </button>
      </div>
    </dialog>
  );
}
