# React compatibility of the intrinsic Column proposal

## Conclusion

The user requested a small React and established-practice review on 2026-10-19.
The proposed layout wrapper is compatible with the tested React composition when its tree position remains stable.
Layout containers have documented precedents in React libraries and visual editors.
The exact ORC Grid/Flex percentage-basis projection remains a custom implementation supported by our bounded experiments.
This review does not establish it as a widely deployed industry standard or certify arbitrary imported React components.

The recommendation remains conditional on stable React ancestry, correct source ownership and the integration checks in the [architecture proposal](intrinsic-column-wrapper-proposal.md).
Application adoption is not authorized by this research request.

## Established practices and their limits

| Primary source | Relevant evidence | What it does not establish |
| --- | --- | --- |
| [MUI Stack](https://mui.com/system/react-stack/) | A React layout component renders a div container and arranges its immediate children. | MUI does not document ORC's exact intrinsic sharing formula here. |
| [React Flow NodeProps](https://reactflow.dev/api-reference/types/node-props) | Custom React nodes are wrapped by a component that provides selection and dragging. | Its editor wrapper is not evidence that ORC's source exporter or layout projection is complete. |
| [React state preservation](https://react.dev/learn/preserving-and-resetting-state) | State follows the component's position and ancestor structure in the React tree. | Keeping the same child key cannot preserve state across arbitrary changes of parent structure. |
| [React DOM refs](https://react.dev/learn/manipulating-the-dom-with-refs) | React warns against adding or removing children that React itself manages. | An imperative DOM wrapping pass is not an acceptable substitute for rendering the wrapper in JSX. |
| [Base UI composition](https://base-ui.com/react/handbook/composition) | Composed custom components must forward refs and spread behavioral props to their real DOM element. | A generic layout div cannot replace a trigger's button or receive its ref indiscriminately. |
| [Tailwind spacing](https://tailwindcss.com/docs/margin#adding-space-between-children) | Space utilities use selectors against direct children. | Adding a DOM level is not transparent to every Tailwind or authored CSS rule. |

These sources establish a conventional approach to component composition and explicit ownership of layout boxes.
They do not supply a compatibility certificate for our complete implementation.
Context7 returned React's official documentation and version-tagged Base UI 1.8.0 composition documentation; the public handbook currently describes a newer Base UI release.
The browser experiment uses the actual installed package versions below.

## Where the wrapper belongs

The proposal adds one flow box inside an eligible owned frame, around its ordered children.
It does not add a new div inside every imported component.

```text
Frame outer box, Grid
└── Generated flow box, Flex Column
    ├── Stateful React component, retaining its own root and refs
    ├── Fit sibling
    └── Other participating child
```

Sizing a component still requires a supported prop, style or source binding on its actual outer element.
A component that ignores style props, returns several root elements, or owns a specialized compound structure needs its existing source-specific handling.
Do not assume that wrapping an arbitrary component makes those bindings safe.
The accepted [React source-binding contract](../doc_v1/architecture/react-source-bindings.md#edit-ownership) already requires this distinction.

## Actual browser experiment

The fixture imports the installed `react@19.3.0`, `react-dom@19.3.0`, `@base-ui/react@1.8.0` and `motion@14.0.0`.
Its stateful Card uses a real `motion.div` root and a Base UI Button composed with a ref-forwarding native button.
It also includes an uncontrolled text input, a Context provider and a React portal outside the frame.
The native layout uses the proposed outer Grid, inner Flex and percentage-aware common basis.

Both Google Chrome for Testing 153.0.8010.12 and 154.0.8037.57 produced identical observations.
The recorded binary paths and executable hashes are in the result file.

| Check | Result in both browsers |
| --- | --- |
| Four stable-wrapper Fit/Fixed and changing-Fit-sibling updates | Constrained sharing passes; counter state, typed input, focus and the original input/button/Motion DOM refs remain intact. |
| Base UI composed button | Native button tag and ref target remain correct; click increments component state and bubbles through the frame. |
| Actual keyboard activation | Focusing the composed button and pressing Enter through agent-browser increments its counter. |
| React Context | The normal child and portal retain the provider value. |
| Portal event | Its DOM is outside the frame, but its click still reaches the React ancestor. |
| Deliberately insert the wrapper around an existing keyed component | Counter and input reset, refs point to new DOM nodes, and input focus is lost. This is the expected negative control. |
| Direct-child selector | The outer frame no longer directly matches the Card; the generated flow box does. |

React's [portal reference](https://react.dev/reference/react-dom/createPortal) documents propagation through the React tree.
This experiment verifies that behavior only; it does not verify modal placement, CSS-variable inheritance, focus trapping or scroll locking.
Motion was exercised with `layout` and zero-duration transitions to check stable root/ref behavior and settled geometry.
It does not certify nonzero animation behavior, drag coordinates, layout groups, nested scrolling or performance.
Motion's [layout documentation](https://motion.dev/docs/react-layout-animations) identifies additional scroll and fixed-container measurement requirements that still apply.

## Required lifecycle clarification

A wrapper that already exists can stay mounted while CSS changes between Fit and Fixed.
Inserting it for the first time around a mounted component is a structural conversion and can reset that component's transient runtime state.
Retaining the wrapper after opt-in does not prevent that first remount.
This is a confirmed limitation of the proposed conversion lifecycle, not a failure of the stable-wrapper layout tests.

For newly mounted opted-in frames, render the correct structure from the first React render.
For ordinary sizing edits after opt-in, update CSS while preserving the wrapper, component types and keys.
Before adopting conversion of an already mounted frame, define and verify how its transient component state is handled.
Performing that conversion before mounting a Preview session is one possible boundary; this review does not approve a new reset policy.
Do not silently reset active inputs or claim that stable editor IDs alone preserve React runtime state.

Render the generated structure through React, rather than reparenting React-owned DOM in a ref callback or layout effect.
Keep the component's root refs and Base UI behavioral props on their original owners.
Do not transfer event handlers, accessibility roles or tab stops to the generated layout div by default.
Preserve the existing component event, portal and source-binding integration work instead of claiming that a layout wrapper solves it.

SSR and hydration were not tested.
React's [hydrateRoot contract](https://react.dev/reference/react-dom/client/hydrateRoot) requires matching server/client output, so the generated wrapper must be identical on both sides of a future SSR export.
Do not emit it only after client mount to hide a hydration mismatch.

## Reproduction and boundaries

The local evidence directory is `.unlazy/intrinsic-fill/react-wrapper-review/`.
`fixture.jsx`, `index.html` and `run.py` retain the fixture and paired browser driver.
`result.json` records package identities, platform, binary hashes, full commands, exit codes, fixture/build hashes and outcomes.
`baseline.json` records the commit, existing uncommitted work and protected source hashes.
All 14 browser/version commands exited zero, and all 219 protected source hashes remained unchanged.

```sh
bun build .unlazy/intrinsic-fill/react-wrapper-review/fixture.jsx --target browser --format iife --define 'process.env.NODE_ENV="development"' --outfile .unlazy/intrinsic-fill/react-wrapper-review/app.js
python3 .unlazy/intrinsic-fill/react-wrapper-review/run.py
```

This is an isolated browser experiment, not production React integration in ORC.
Full shadcn compositions, Tailwind rendering, Base UI dialogs/menus, nonzero Motion animations, Strict Mode lifecycle behavior, SSR/hydration, screen readers, stable Chrome and Windows were not tested.
The research changes no application code, dependencies, accepted doc_v1 content or migration policy.
No commit or push is included.

## Ordinary integration checkpoint, 2026-10-20

The approved ordinary wrapper integration now has a [verified application checkpoint](../IMPLEMENTATION_STATUS.md#ordinary-intrinsic-column-wrapper-checkpoint).
The real shared renderer and serializer use the same structure, and the exact inverse preserves the canonical hierarchy.
The focused React/source replay passes both pinned browser versions, including typed input, focus and DOM identity through stable opted-in sizing changes.
The real editor workflow separately verifies stable ordinary descendant identity, Preview, drafts, history, generated source and saving.
First insertion remains the documented structural conversion and can remount descendants.
These results do not complete arbitrary React source integration, Base UI modal/portal behavior, Tailwind reset ownership, nonzero Motion scheduling, SSR/hydration or full product exporters.
