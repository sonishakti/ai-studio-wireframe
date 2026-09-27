# P0.11 Connect the team's software to the agent · Before and after

Track: **v3**, in the existing Console design system. Before shots captured 26 Sep 2026 at 1600 px, dark, design-mode fixtures, no sign-in, from the design/v3 prototype at commit `4f5bea4b` (P0.3 built; P0.4 to P0.10 specified, not built):

- Concept A code agent: `/v3?concept=a&view=agent&agent=agent_tutor&tab=deploy`

| Shot | Route | What it shows |
|---|---|---|
| `shots/before-01-deploy-code-tab.png` | `…&tab=deploy` | The Code tab, **In your app** with the curl snippet |
| `shots/before-02-deploy-telephony-tab.png` | `…&tab=deploy`, second tab | **One phone call** with the telephony transport |

## Before · Concept A today (`SdkCode` in `parts/deploy.tsx`)

The third tab is named **Code** (P0.8 renames it Deployment and makes the snippet the **Code** row under Readiness and Retention). It holds two `Tabs`, a `CodeBlock` with copy, and a ghost **API keys** link at the top right.

What is wrong, against the JTBD (red = defect, amber = friction):

1. **Placeholders where Studio knows the value.** The URL reads `$APP_ID` and the auth line `$CUSTOMER_ID:$CUSTOMER_SECRET` with no App ID shown anywhere and no word on where the Customer ID and secret come from. Sam leaves the page to find both. (red, .a step 2)
2. **No client path.** Nothing says the browser or app joins with the App ID and an RTC token, and that the RESTful API key stays on the server. The snippet is the only code Sam sees, so the key ends up in the client. (red, .g)
3. **One language.** curl only; the PRD asks for curl plus one language. (amber)
4. **Nothing after the copy.** No copied state, no waiting line, no first-session confirmation, no error, no idle-timeout help, no 24 h nudge. Studio is silent from the copy onward. (red, .a step 4, .b, .c, .d, .h)
5. **No ephemeral snippet.** A developer who does not want a saved agent has nowhere to start. (amber, .f)
6. **Toy body.** `"agent": "agent_tutor"` where the spec key is `agent_id` (P0.3 and P0.8 fix it), no `lifecycle` (P0.3 adds it), no `data_policy` when Zero retention (P0.8 adds it). (amber)
7. **Copy.** "One phone call" uses the never word call; P0.8 renames it **By phone**. The API keys link floats away from the thing it explains. (amber)
8. **No dev-versus-production note.** Sam's own runs silently count as production with no word about it. (amber, .e)

## Before · P0.8's Code row (specified, the base this row extends)

P0.8 already puts the snippet in the **Code** row with tabs **In your app** and **By phone**, the `CodeBlock` with copy as the code Go live, **API keys**, and one line under it: "Copy the snippet into your software. The first session it starts is Go live." / "First session from your software on {date}." / "No session from your software yet." That line and that row are the sibling every addition here is diffed against.

## After

The same **Code** row, grown. Nothing moves; three facts arrive above the snippet, a language toggle enters the code box header, a third tab joins the two, and the line under the snippet learns six states.

```
Code        In your app   By phone   Without a saved agent
            ---------------------------------------------------------------
            App ID                RESTful API key                 RTC token
            4c1e…5d6e  [copy]     Customer ID and secret,         Your server mints one for the agent's uid
                                  server side only. Open API keys and one for the person. Clients join with the
                                                                  App ID and their token, never with the
                                                                  RESTful API key. How tokens work
            ---------------------------------------------------------------
            POST /sessions                              curl | Node.js   [copy]
            curl -X POST "https://preview.ai.agora.io/…/projects/4c1e0b7d…/sessions" \
              -u "$CUSTOMER_ID:$CUSTOMER_SECRET" # server side only
              -H "Content-Type: application/json" \
              -d '{
                "agent_id": "agent_assist",
                "transport": { "type": "rtc", "channel": "room-42", "uid": "agent",
                               "subscribe_uids": ["user-7"], "token": "AGENT_RTC_TOKEN" },
                "lifecycle": { … }
              }'
            ---------------------------------------------------------------
            Copied at 14:02. Waiting for the first session from your software.   Nothing arrived?
```

After the first session: `✓ First session from your software at 14:09. (i)`

| Before | After | Why |
|---|---|---|
| `$APP_ID` in the URL | The project's App ID filled in, and shown above with a copy | The snippet arrives filled (.a step 2); the App ID is not a secret |
| `$CUSTOMER_ID:$CUSTOMER_SECRET` unexplained | Kept as environment names, with the key line "Customer ID and secret, server side only." and **Open API keys**; `# server side only` on the auth line | Never print a secret; say where it lives (.g) |
| No client path | The RTC token note, per the project's auth mode, with **How tokens work** | The browser joins with the App ID and a token, never the key (.g) |
| curl only | curl and Node.js in the code box header | curl plus one language; the v3 snapshot has no SDK, so Node.js is a `fetch` |
| One line, three variants (P0.8) | Six states: draft, waiting, first session, failed (G1), idle timeout with the RTC channel check, stale at 24 h; plus **Nothing arrived?** with the three common refusals | .a step 4, .b, .c, .d, .h |
| No ephemeral snippet | Third tab **Without a saved agent**, `POST /sessions/ephemeral`, "Account level only." | .f |
| Nothing about dev sessions | The (i) on the first-session line | .e, honest about the missing purpose field |
| API keys link top right | The key line in the facts strip | The link sits with the fact it explains |

Nothing new enters the design system: `Tabs`, `ToggleGroup`, `CodeBlock` (title, actions, copy), the `<dl>` facts row (P0.10's run panel), `Button variant="link"`, `Field` + `Input` + `Button variant="outline" size="sm"` (P0.6's key row), `Alert variant="destructive"` (P0.1), `InfoTip`, the gray tick (P0.8's Readiness item), `sonner`.
