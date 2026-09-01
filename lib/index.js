/**
 * dsh-session-rename - host plugin.
 *
 * Registers the rename_session tool: the agent finalizes the title of its
 * OWN session, typically at wrap-up (when the memory note is written). The
 * title becomes a user-source session/title event via the sessionTitle
 * service, so it pins the title: later automatic title work is superseded,
 * and later user messages schedule none (the flake also disables the built-in
 * first-prompt LLM provider - see that patch).
 *
 * Title format agreed with the user: [tag] [tag] one-line summary, tags from
 * the known list or new ones. The service normalizes and truncates to
 * maxTitleBytes (80 in this deployment).
 */
import { defineTool } from '@deepseek-ai/dsh-tools'

export const name = 'dsh-session-rename'
export const inject = ['sessionTitle', 'sessions', 'tools']

const KNOWN_TAGS = 'dsh / zmk / 計劃 / nixos / ha / memory / bifrost / git / pi / pasta / astrbot / backup'

export function apply(ctx) {
  ctx.tools.register(defineTool({
    name: 'rename_session',
    description: 'Finalize the title of the CURRENT session. Use it when the session wraps up (right after the memory note is written), not at the first message. Title format: "[tag] [tag] one-line summary" - known tags: ' + KNOWN_TAGS + '; new tags are allowed. Max 80 UTF-8 bytes; the title is pinned until renamed again.',
    parameters: {
      title: {
        type: 'string',
        required: true,
        description: 'Full session title, e.g. "[dsh] [計劃] rename 工具接线完成".',
      },
    },
    output: {
      schema: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string", required: true },
          eventSeq: { type: "integer", required: true },
          updatedAt: { type: "integer", required: true },
        },
      },
      render: (_args, value) => [{
        type: "text",
        text: "Session titled: " + value.title + " (event seq " + value.eventSeq + ")",
      }],
    },
    isConcurrencySafe: () => true,
    async execute(input, exec) {
      const source = exec?.agent?.session
      if (!source) throw new Error('rename_session: no calling agent session')
      const session = ctx.sessions.get(source.id)
      if (!session) throw new Error('rename_session: session ' + String(source.id) + ' is not live')
      let snapshot
      try {
        snapshot = ctx.sessionTitle.rename(session, input.title)
      } catch (error) {
        if (error && error.name === 'SessionTitleInvalidError') {
          throw new Error('rename_session: title normalizes to empty (' + JSON.stringify(input.title) + ') - include visible text')
        }
        throw error
      }
      return { title: snapshot.title, eventSeq: snapshot.eventSeq, updatedAt: snapshot.updatedAt }
    },
  }))
}
