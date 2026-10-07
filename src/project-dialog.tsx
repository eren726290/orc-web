import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Folder, X } from "lucide-react";
import { parseDirectory, type DirectoryListing } from "../shared/session";
import { request } from "./api";
import { useModal } from "./useModal";

type Props = {
  kind: "open" | "save";
  initialName: string;
  close: () => void;
  submit: (path: string, name: string) => Promise<boolean>;
  error: string | null;
};
type FolderState = { listing: DirectoryListing | null; path: string; error: string | null };

function useFolders() {
  const [state, setState] = useState<FolderState>({ listing: null, path: "", error: null });
  const sequence = useRef(0);
  const navigate = async (target: string) => {
    const version = ++sequence.current;
    try {
      const listing = parseDirectory(
        await request(`/api/folders?path=${encodeURIComponent(target)}`),
      );
      if (version === sequence.current) setState({ listing, path: listing.path, error: null });
    } catch (failure) {
      if (version === sequence.current)
        setState((current) => ({
          ...current,
          error: failure instanceof Error ? failure.message : "Cannot open folder.",
        }));
    }
  };
  return {
    ...state,
    navigate,
    setPath: (path: string) => {
      sequence.current++;
      setState((current) => ({ ...current, path }));
    },
  };
}

export function ProjectDialog(props: Props) {
  const dialog = useModal();
  const folders = useFolders();
  const initialName = props.initialName === "Untitled" ? "My design" : props.initialName;
  const [name, setName] = useState(initialName);
  const [busy, setBusy] = useState(false);
  useInitialFolder(folders.navigate);
  const submit = async () => {
    setBusy(true);
    try {
      if (await props.submit(folders.path, name)) props.close();
    } finally {
      setBusy(false);
    }
  };
  return (
    <dialog
      ref={dialog}
      className="project-dialog"
      aria-labelledby="project-dialog-title"
      onCancel={props.close}
    >
      <DialogHeading kind={props.kind} close={props.close} />
      {props.kind === "save" && <ProjectName name={name} change={setName} />}
      <FolderBrowser kind={props.kind} folders={folders} />
      {props.error && (
        <p role="alert" className="inline-error">
          {props.error}
        </p>
      )}
      <DialogActions
        kind={props.kind}
        busy={busy}
        disabled={!folders.path || (props.kind === "save" && !name.trim())}
        close={props.close}
        submit={() => void submit()}
      />
    </dialog>
  );
}

function useInitialFolder(navigate: (path: string) => Promise<void>) {
  useEffect(() => {
    void navigate("");
    // The dialog loads its initial directory once per mounted project flow.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

function ProjectName({ name, change }: { name: string; change: (name: string) => void }) {
  return (
    <label className="field">
      Project name
      <input value={name} onChange={(event) => change(event.target.value)} />
    </label>
  );
}

function DialogHeading({ kind, close }: Pick<Props, "kind" | "close">) {
  return (
    <div className="dialog-heading">
      <h2 id="project-dialog-title">{kind === "open" ? "Open project" : "Save project"}</h2>
      <button onClick={close} aria-label="Cancel">
        <X size={18} />
      </button>
    </div>
  );
}

function FolderBrowser({
  kind,
  folders,
}: {
  kind: Props["kind"];
  folders: ReturnType<typeof useFolders>;
}) {
  return (
    <>
      <label className="field">
        {kind === "open" ? "Project folder" : "Save in folder"}
        <input
          value={folders.path}
          onChange={(event) => folders.setPath(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") void folders.navigate(folders.path);
          }}
        />
      </label>
      <div className="folder-heading">
        <button
          onClick={() => {
            if (folders.listing) void folders.navigate(folders.listing.parent);
          }}
          aria-label="Parent folder"
        >
          <ArrowLeft size={16} />
        </button>
        <span>Folders</span>
      </div>
      <FolderList folders={folders} />
      {folders.error && (
        <p role="alert" className="inline-error">
          {folders.error}
        </p>
      )}
    </>
  );
}

function FolderList({ folders }: { folders: ReturnType<typeof useFolders> }) {
  return (
    <div className="folder-list">
      {folders.listing?.directories.map((entry) => (
        <button
          key={entry}
          onClick={() => void folders.navigate(`${folders.listing?.path}/${entry}`)}
        >
          <Folder size={17} />
          <span>{entry}</span>
        </button>
      ))}
    </div>
  );
}

function DialogActions(props: {
  kind: Props["kind"];
  busy: boolean;
  disabled: boolean;
  close: () => void;
  submit: () => void;
}) {
  return (
    <div className="dialog-actions">
      <button onClick={props.close}>Cancel</button>
      <button className="primary" disabled={props.busy || props.disabled} onClick={props.submit}>
        {props.busy ? "Please wait" : props.kind === "open" ? "Open project" : "Save project"}
      </button>
    </div>
  );
}
