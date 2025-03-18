import quark from "./quark.js";
import uc from "./uc.js";
import ucTv from "./uc-tv.js";
import y115 from "./115.js";
import muou from "./muou.js";
import tianyi from "./tianyi.js";
import wogg from "./wogg.js";
import leijing from "./leijing.js";
import tgsou from "./tgsou.js";
import pan123 from "./pan123.js";
import ali from "./ali.js";

export default async function website(fastify) {
  fastify.get('/', (req, res) => {
    res.type('text/html').send(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>首页</title>
      </head>
      <body>
        <div id="app"></div>
        <script>${globalThis.websiteBundle}</script>
      </body>
    </html>
    `)
  })

  fastify.register(quark, {prefix: '/quark'})
  fastify.register(uc, {prefix: '/uc'})
  fastify.register(ucTv, {prefix: '/uc-tv'})
  fastify.register(y115, {prefix: '/115'})
  fastify.register(muou, {prefix: '/muou'})
  fastify.register(tianyi, {prefix: '/tianyi'})
  fastify.register(wogg, {prefix: '/wogg'})
  fastify.register(leijing, {prefix: '/leijing'})
  fastify.register(tgsou, {prefix: '/tgsou'})
  fastify.register(pan123, {prefix: '/pan123'})
  fastify.register(ali, {prefix: '/ali'})
}