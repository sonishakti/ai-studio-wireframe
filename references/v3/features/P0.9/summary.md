Sam points a project number or a new SIP number at Clinic reception with a call policy (max duration, max silence, end rules) and a transfer, then dials the number to hear it answer; the Numbers row now carries an Edit door, a policy/transfer summary and a reach line with Dial it and Carrier checklist.
URL keys added: `fold` (`call-policy` | `transfer`), `num` (review only), `panel=number` with `item=<number id>` for Edit number.
Preview: https://ng-console-8x88vsrde-agoraio.vercel.app/v3?concept=a&view=agent&agent=agent_clinic&tab=deploy&dep=ready
Commit: 67c1ccc5
Open problem: the 409/400 paths are caught by client validation before any request is sent, so the API's own error responses are never actually exercised in design mode.
