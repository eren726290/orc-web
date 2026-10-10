# Properties

Properties controls, editable fields, and temporary property previews belong here.
Sizing-owner labels and parent-controlled positions are derived from the applied native canvas after document, selection, or native box size changes.
Controlled positions are read-only, and Select parent uses the workspace's existing Code draft safeguard.
Frame layout controls submit one measured Free/Row/Column conversion through the shared atomic command path.
They render a temporary property preview and verify native boxes before submitting the command.
The Row-only Wrap to next line checkbox uses the same preview, draft safeguard, and atomic command path.
Layout actions restore their button or checkbox focus after a pending command when the same owner is still selected and focus has fallen to the page body.
Their styles stay beside the control in layout-controls.css.
Frame Padding starts with paired fields and a native Individual sides disclosure.
Mixed opposite values remain unchanged until an explicit edit, and unsupported CSS stays available in Code.
The control and its styles live in frame-padding-controls.tsx and padding-controls.css.

Ordinary Row/Column Gap uses one authored CSS value through typing, local arrows, value dragging, and canvas handles.
frame-gap-controls.tsx shares the same numeric field between Properties and the canvas.
number-drag.ts owns pointer preparation, live preview, cancellation, and one-command completion.
Adjustable fields retain their DOM input and synchronize from the latest applied value after acknowledgement.
Their styles remain in gap-controls.css; canvas handle geometry and styles belong to ../canvas/.
