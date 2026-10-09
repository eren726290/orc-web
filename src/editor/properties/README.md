# Properties

Properties controls, editable fields, and temporary property previews belong here.
Sizing-owner labels and parent-controlled positions are derived from the applied native canvas after document, selection, or native box size changes.
Controlled positions are read-only, and Select parent uses the workspace's existing Code draft safeguard.
Frame layout controls submit one measured Free/Row/Column conversion through the shared atomic command path.
They render a temporary property preview and verify native boxes before submitting the command.
Layout actions restore their button's focus after a pending command when the same owner is still selected and focus has fallen to the page body.
Their styles stay beside the control in layout-controls.css.
