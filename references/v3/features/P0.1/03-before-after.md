# P0.1 Choose how people reach it · Before and after

Track: **v3**, in the existing Console design system. Captured 26 Sep 2026 at 1600 px with `scripts/drive.mjs` and `scripts/annotate-shots.mjs` (red = defect), design-mode fixtures, no sign-in:

- Today's Console (design/sandbox preview): https://ng-console-22w8ftqlp-agoraio.vercel.app/agents
- Concept A as reviewed (design/v3 preview): https://ng-console-dcgukcxah-agoraio.vercel.app/v3?concept=a&panel=create

| Shot | Route | What it shows |
|---|---|---|
| `shots/before-01-agents-list.png` | `/agents` | Agents list, **Create Agent** in the toolbar |
| `shots/before-02-create-sheet.png`, `-marked.png` | `/agents` with the sheet open | Today's create sheet |
| `shots/before-03-concept-a-create-sheet.png`, `-marked.png` | `/v3?concept=a&panel=create` | Concept A create sheet (the chosen base) |
| `shots/before-04-concept-a-empty-list.png` | `/v3?concept=a&account=empty` | Empty first screen |
| `shots/before-05-builder-today.png` | `/agents/agent_000001` | Where today's builder lands after create |

## Before · today's Console

The **Create Agent** sheet (`AgentCreateDialog` in `src/components/console/agents-page.tsx`) holds a disabled Project select, an Agent name field and a **Choose a template** list (Blank Template, Sales / Lead qualification, Appointment Reminder, IVR, Customer service for e-commerce).

What is wrong, against the JTBD:

1. **No deployment type.** Templates describe a use case, not how people reach the agent. Every agent gets every section: batch `{{variable}}` hints on an inbound agent, phone settings on a code agent. (red)
2. **Studio invents a name.** The field is prefilled "My Agent", and an empty field saves as "My Agent" (`agentName.trim() || "My Agent"`). Breaks P0.1.g. (red)
3. **Template changes the name.** Picking a template overwrites what Sam typed ("Sales / Lead qualification Agent"). (amber)
4. **Read-only project in a control.** A disabled select repeats the shell's project switcher; two doors for one fact. (amber)
5. **Copy.** Title case "Create Agent" in the title and the button; "template" is on the locked never list for preset. (amber)
6. **Errors.** One generic destructive `Alert` ("Unable to create agent."), no code, no retry, and no check against a double create after a dropped save. (red for .d, .f)
7. **Landing.** After create, the builder opens on Prompt with every tab (`before-05`), not on Voice & models.

## Before · Concept A (a85a09ff, reviewed 24 Sep)

Right model, wrong details (`before-03-concept-a-create-sheet-marked.png`):

1. Helper says "Each type has its own setup. You pick it once." Wrong against P0.1.b. (red)
2. "Code / SDK": SDK is a never word, and the card has no rtc line for web and app (P0.1.e). (red)
3. Card order batch, inbound, code; names "Batch calls", "Inbound calls". PRD order and locked words are inbound, batch, code. (amber)
4. Create is off with an empty name and says nothing. (amber)
5. Saves with preset "Fastest"; the PRD preset name is **Lowest latency**. No labels written, no error, saving or retry states, no type change door, no untyped API agent state.

## After

One `FormSheet` from the right, title **Create agent**, compact size, same as today's sheet so the door and the pattern do not move.

```
Create agent                                         ×
----------------------------------------------------
Name
[                                               ]

Deployment type
How people reach the agent. You can change it until
its first deployment.

( ) Inbound
    People dial its number and the agent answers.
( ) Batch
    The agent dials a list of contacts, one run at a time.
( ) Code
    Your software starts each session through the API.
    Web and app sessions use code over rtc.

----------------------------------------------------
Name the agent to create it.     [Cancel] [Create agent]
```

| Before | After | Why |
|---|---|---|
| Template list | Three `RadioGroup` cards: inbound, batch, code, one line each | The type is the first fork of every journey; templates are v3.1 at most |
| "My Agent" prefilled, used when empty | Empty field; **Create agent** off with one line "Name the agent to create it." | P0.1.g: Studio never invents a name |
| Disabled Project select | Removed; the sheet creates in the shell's current project | One door per fact |
| "Create Agent" | "Create agent" | Sentence case, verb title |
| "Unable to create agent." | Inline `Alert` with the code and **Try again**; name and type kept | P0.1.d |
| Button spins, sheet still editable | Button shows `Spinner` and "Creating"; fields and close are inert | P0.1.f |
| Lands on Prompt, all tabs | Lands on the Agent tab at **Voice & models**, third tab named for the type (Numbers, Runs or Code) | P0.1.a step 4 |
| "Code / SDK", "Batch calls" | Code, Batch, Inbound | Locked words |
| "You pick it once" | "You can change it until its first deployment." plus **Change type** in the header menu | P0.1.b |

Nothing new enters the design system: `FormSheet`, `Field`, `Input`, `RadioGroup` (added by CLI on design/v3, 0c667c09), `Alert`, `AlertDialog`, `Spinner`, `Badge`, `DropdownMenu` and `sonner` all ship today.
