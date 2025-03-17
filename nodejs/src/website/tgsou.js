const getCache = async (server, key, defaultValue) => {
  const obj = await server.db.getObjectDefault(`/tgsou`, {})
  // 优先级：缓存->配置文件->兜底域名
  return obj?.[key] || server.config.tgsou[key] || defaultValue
}

export const getUrlCache = (server) => {
  return getCache(server, 'url', 'http://tgsou.fish2018.ip-ddns.com')
}

export const getCountCache = (server) => {
  return getCache(server, 'count', 4)
}

export const getChannelUsernameCache = (server) => {
  return getCache(server, 'channelUsername', 'Q66Share,alyp_TV,ucpanpan,ucquark,tianyirigeng,shares_115,cloud189_group,tianyi_pd2,hao115,guaguale115,yunpanchat,ydypzyfx,tgsearchers,NewQuark,Mbox115,dianyingshare,XiangxiuNB,yunpanpan,kuakeyun,Quark_Movies,qixingzhenren,longzbija,alyp_4K_Movies,yunpanshare,shareAliyun,ikiviyyp,alyp_1,xx123pan')
}

export const setCache = async (server, key, value) => {
  await server.db.push(`/tgsou/${key}`, value);
}

export default async function tgsou(fastify) {
  fastify.get('/config', async (req, res) => {
    const url = await getUrlCache(req.server)
    const count = await getCountCache(req.server)
    const channelUsername = await getChannelUsernameCache(req.server)
    res.send({
      code: 0,
      data: {
        url,
        count: Number(count),
        channelUsername: channelUsername.split(',')
      }
    })
  })

  fastify.put('/config', async (req, res) => {
    await setCache(req.server, 'url', req.body.url)
    await setCache(req.server, 'count', req.body.count)
    await setCache(req.server, 'channelUsername', req.body.channelUsername.join(','))
    res.send({
      code: 0,
    })
  })
}