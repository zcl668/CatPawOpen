export const getCache = async (server) => {
  const obj = await server.db.getObjectDefault(`/muou`, {})
  // 优先级：缓存->配置文件->兜底域名
  return obj?.url || server.config.muou.url || 'http://mo.666291.xyz'
}

export const setCache = async (server, value) => {
  await server.db.push(`/muou/url`, value);
}

export default async function muou(fastify) {
  fastify.get('/url', async (req, res) => {
    res.send({
      code: 0,
      data: await getCache(req.server)
    })
  })

  fastify.put('/url', async (req, res) => {
    await setCache(req.server, req.body.url)
    res.send({
      code: 0,
    })
  })
}