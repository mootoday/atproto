import { Server } from '../../../../lexicon'
import AppContext from '../../../../context'
import { pipethrough } from '../../../../pipethrough'

export default function (server: Server, ctx: AppContext) {
  server.app.bsky.graph.getList({
    auth: ctx.authVerifier.access,
    handler: async ({ params, auth }) => {
      const requester = auth.credentials.did
      return pipethrough(
        ctx.cfg.bskyAppView.url,
        'app.bsky.graph.getList',
        params,
        await ctx.appviewAuthHeaders(requester),
      )
    },
  })
}
