# list_design_tokens

## Status and purpose

Accepted V1 responsibility, recorded on 2026-10-05.
`list_design_tokens` reads the active project's explicit token registry.
It takes over the Tokens scope previously placed in `get_context`.
Core JSON filters/results and examples are accepted below.
Detailed value/reference grammars, reference accounting, limits, and SDK/error integration remain implementation decisions.
The running ORC-web tool has not been verified.

## Requested registry information

Return the project identity and matching applied revision with a focused requested scope or filter.
Do not automatically attach the entire token registry to every project or hierarchy read.

| Information | Required meaning |
| --- | --- |
| Definition identity | Stable token ID, readable name, type/category, and supported CSS identity where known. |
| Values and units | Existing default values, applicable saved Dark overrides, and supported units without silently converting them. |
| References | Supported linked uses and reference counts, identifying unavailable, bounded, or incomplete accounting. |
| Editing capabilities | Supported definition actions under the V1 category/default-value boundary. |

Imported CSS variables remain authored source unless they are explicit supported registry definitions.
Matching literal values do not become token references automatically.
Name changes preserve identity; labels and CSS identifiers have distinct roles.
An independent component can still use a shared token definition.

## Agreed JSON exchange

Core registry-read fields and examples accepted on 2026-10-05.
Use the [shared JSON rules](../read-tools.md#json-schemas-and-examples).
Category-specific value and linked-use grammars, shared-source reference accounting, limits/continuation, and SDK/error integration remain implementation decisions.

### Input schema

An empty object requests the explicit registry list, subject to declared response limits.
Optional `category` or `tokenIds` narrows that list; when both are supplied, return their intersection.
Known IDs address definitions, not readable names or CSS variable text.
Invalid filters or missing explicitly requested identities receive useful errors rather than invented definitions.

```json
{
  "type": "object",
  "properties": {
    "category": {"type": "string", "enum": ["color", "spacing", "corner_radius", "typography"]},
    "tokenIds": {"type": "array", "minItems": 1, "items": {"type": "string", "minLength": 1}, "uniqueItems": true}
  },
  "additionalProperties": false
}
```

### Output schema

```json
{
  "type": "object",
  "properties": {
    "projectId": {"type": "string", "minLength": 1},
    "appliedRevision": {"type": "integer", "minimum": 0},
    "tokens": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {"type": "string", "minLength": 1},
          "name": {"type": "string"},
          "category": {"type": "string", "enum": ["color", "spacing", "corner_radius", "typography"]},
          "cssVariable": {"type": "string", "minLength": 1},
          "values": {"type": "object", "properties": {"default": {}, "dark": {}}, "required": ["default"], "additionalProperties": false},
          "references": {
            "type": "object",
            "properties": {"count": {"type": ["integer", "null"], "minimum": 0}, "complete": {"type": "boolean"}},
            "required": ["count", "complete"],
            "additionalProperties": true,
            "allOf": [{"if": {"properties": {"complete": {"const": true}}, "required": ["complete"]}, "then": {"properties": {"count": {"type": "integer"}}}}]
          },
          "editableActions": {"type": "array", "items": {"type": "string", "enum": ["edit_default", "rename", "delete"]}, "uniqueItems": true}
        },
        "required": ["id", "name", "category", "values", "references", "editableActions"],
        "additionalProperties": true
      }
    },
    "complete": {"type": "boolean"}
  },
  "required": ["projectId", "appliedRevision", "tokens", "complete"],
  "additionalProperties": false
}
```

The outer `complete` describes the filtered definition list, independently of each token's reference accounting.
An empty registry or valid filter with no matches returns `tokens: []` and `complete: true`.
If limits truncate the matching list, report false; limits and continuation remain open.
Preserve supported existing values and units rather than silently converting them or rewriting the persisted token schema.
The core schema leaves category-specific values and additional definition/reference details open while their exact grammars are settled.
This does not make arbitrary JSON an accepted token value for creation or editing.

Include `cssVariable` when its supported CSS identity is reliably known.
`values.default` is the saved default; include `values.dark` only for an existing Dark override.
Absence of a Dark override means the default applies in both modes.
Reading existing Typography and Dark values does not enable their deferred value editors.
The `typography` category retains its existing separate types; subtype encoding remains open.

`references.count` is null when unavailable and never a guessed zero.
A partial supported count reports `references.complete: false`; a complete count must be an actual nonnegative integer.
This completeness describes the count, not automatic inclusion of every linked-use record.
Detailed linked-use identities and bounded accounting retain the existing requested-registry responsibilities above and require a reliable encoding before being exposed.
Deletion always validates authoritative supported references through [update_design_tokens](update_design_tokens.md), regardless of a displayed count.
`editableActions` describes currently supported definition actions, not operations inferred from the token's displayed value.
Existing Typography/Dark value preservation and in-use deletion rules still apply.

### Request and response examples

Arguments:

```json
{}
```

Successful structured result:

```json
{
  "projectId": "project_1",
  "appliedRevision": 12,
  "tokens": [
    {
      "id": "token_brand",
      "name": "Brand color",
      "category": "color",
      "cssVariable": "--color-brand",
      "values": {"default": "#7c3aed", "dark": "#a78bfa"},
      "references": {"count": 3, "complete": true},
      "editableActions": ["edit_default", "rename"]
    }
  ],
  "complete": true
}
```

Arguments for Color definitions only:

```json
{"category": "color"}
```

Arguments for one known definition:

```json
{"tokenIds": ["token_brand"]}
```

Imported theme variables and matching literal values do not automatically appear as registered tokens.
Reading changes neither definitions, selection, frame modes, project revision, nor history.

## Reading and editing boundaries

[update_design_tokens](update_design_tokens.md) manages supported definitions; [update_styles](update_styles.md) or an accepted input owner manages object binding/unlinking.
V1 definition mutation covers Color, Spacing, and Corner radius defaults under the [token release scope](../../interface/tokens-and-modes.md#release-scope).
Reading existing Typography or Dark values does not add their deferred value editors to V1.
Listing registered tokens does not import a component theme into the panel or enumerate installed fonts.

Reference information includes supported hidden/source uses, not just currently visible canvas objects.
Bounded or displayed counts cannot establish that a definition is unused.
Deletion still performs authoritative reference validation through the mutation service.
Exact shared-source reference accounting remains open rather than implying complete arbitrary React analysis.

## Consistency and failures

Follow the [shared read rules](../read-tools.md#shared-read-behavior), including current applied values before autosave, matching revision, and exclusion of temporary token previews and private Code drafts.
Report invalid filters or unavailable reference information without inventing definitions, values, or counts.
Reads do not change tokens, frame modes, selection, the revision, or Undo history.
Server-owned registry reads remain available with the editor tab closed.

## Implementation verification still required

- List an empty and populated registry, then request focused categories/definitions without returning unrelated definitions.
- Verify stable IDs and CSS identity through creation, default edits, rename, and application Undo/Redo.
- Preserve units, existing Typography values and Dark overrides, and the distinction between registry definitions and imported CSS variables.
- Check references shared across frames, independent components, hidden content, and supported source; identify partial/unavailable counts honestly.
- Verify before-autosave consistency, save/reopen, private-preview exclusion, closed-tab operation, and unchanged project/view/history state.

These are required implementation checks, not passed application tests.
