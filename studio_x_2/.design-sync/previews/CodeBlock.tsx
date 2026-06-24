// CodeBlock — standardized code-snippet display with one-click copy. Use
// anywhere we show code, install commands, or curl examples.
import { CodeBlock } from 'studio-x'

const curl = `curl https://api.agora.io/v1/convoai/agents/start \\
  -H "Authorization: Basic $AGORA_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "agent": "aria-inbound-support",
    "channel": "support-line-1",
    "tts": { "vendor": "elevenlabs", "voice": "rachel" }
  }'`

const sdk = `import { ConvoAI } from "agora-convoai"

const client = new ConvoAI({ appId: process.env.AGORA_APP_ID })

await client.deployments.start({
  agentId: "aria-inbound-support",
  channel: "support-line-1",
})`

export const Curl = () => (
  <div className="w-[560px]">
    <CodeBlock language="bash" filename="start-agent.sh">{curl}</CodeBlock>
  </div>
)

export const SdkSnippet = () => (
  <div className="w-[560px]">
    <CodeBlock language="typescript" filename="server.ts">{sdk}</CodeBlock>
  </div>
)

export const Install = () => (
  <div className="w-[560px]">
    <CodeBlock variant="inline">npm install agora-convoai</CodeBlock>
  </div>
)
