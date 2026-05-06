// Cloudflare Worker: keep-alive для Supabase Free
// Пингует Supabase раз в 6 дней, чтобы проект не уснул (пауза после 7 дней бездействия)

export interface Env {
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string
}

export default {
  async scheduled(_event: ScheduledEvent, env: Env, _ctx: ExecutionContext) {
    // Лёгкий запрос к публичному endpoint — этого достаточно, чтобы Supabase
    // считал проект активным и не отправлял в pause
    const response = await fetch(
      `${env.SUPABASE_URL}/rest/v1/games?select=id&limit=1`,
      {
        headers: {
          apikey: env.SUPABASE_ANON_KEY,
          Authorization: `Bearer ${env.SUPABASE_ANON_KEY}`,
        },
      }
    )

    if (!response.ok) {
      console.error(`Keep-alive ping не удался: ${response.status}`)
    } else {
      console.log('Keep-alive ping успешен')
    }
  },
}
