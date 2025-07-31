import duoduo from "./spider/video/duoduo.js";
import baseset from "./spider/video/baseset.js";
import mogg from "./spider/video/mogg.js";
import leijing from "./spider/video/leijing.js";
import panta from "./spider/video/panta.js";
import wogg from "./spider/video/wogg.js";
import zhizhen from "./spider/video/zhizhen.js";
import tgsou from "./spider/video/tgsou.js";
import tgchannel from "./spider/video/tgchannel.js";
import douban from "./spider/video/douban.js";
import push from "./spider/video/push.js";
import {getCache} from "./website/sites.js";

const spiders = [douban, duoduo, mogg, leijing, panta, wogg, zhizhen, tgchannel, tgsou, baseset, push];
const spiderPrefix = '/spider';

/**
 * A function to initialize the router.
 *
 * @param {Object} fastify - The Fastify instance
 * @return {Promise<void>} - A Promise that resolves when the router is initialized
 */
export default async function router(fastify) {
    // register all spider router
    spiders.forEach((spider) => {
        const path = spiderPrefix + '/' + spider.meta.key + '/' + spider.meta.type;
        fastify.register(spider.api, { prefix: path });
        console.log('Register spider: ' + path);
    });
    /**
     * @api {get} /check 检查
     */
    fastify.register(
        /**
         *
         * @param {import('fastify').FastifyInstance} fastify
         */
        async (fastify) => {
            fastify.get(
                '/check',
                /**
                 * check api alive or not
                 * @param {import('fastify').FastifyRequest} _request
                 * @param {import('fastify').FastifyReply} reply
                 */
                async function (_request, reply) {
                    reply.send({ run: !fastify.stop });
                }
            );
            const getConfig = () => {
                const config = {
                    video: {
                        sites: [],
                    },
                    read: {
                        sites: [],
                    },
                    comic: {
                        sites: [],
                    },
                    music: {
                        sites: [],
                    },
                    pan: {
                        sites: [],
                    },
                    color: fastify.config.color || [],
                };
                spiders.forEach((spider) => {
                    let meta = Object.assign({}, spider.meta);
                    meta.api = spiderPrefix + '/' + meta.key + '/' + meta.type;
                    meta.key = 'nodejs_' + meta.key;
                    const stype = spider.meta.type;
                    if (stype < 10) {
                        config.video.sites.push(meta);
                    } else if (stype >= 10 && stype < 20) {
                        config.read.sites.push(meta);
                    } else if (stype >= 20 && stype < 30) {
                        config.comic.sites.push(meta);
                    } else if (stype >= 30 && stype < 40) {
                        config.music.sites.push(meta);
                    } else if (stype >= 40 && stype < 50) {
                        config.pan.sites.push(meta);
                    }
                });
                return config
            }
            fastify.get(
                '/config',
                /**
                 * get catopen format config
                 * @param {import('fastify').FastifyRequest} _request
                 * @param {import('fastify').FastifyReply} reply
                 */
                async function (_request, reply) {
                    const config = getConfig()
                    const sites = await getCache(_request.server)

                    const allSites = config.video.sites
                    const visitedMap = {}
                    const allSitesMap = {}
                    allSites.forEach(site => {
                        allSitesMap[site.key] = site
                    })
                    // 旧的取出来 过滤掉已失效的
                    const rs =[]
                    sites.forEach(site => {
                        visitedMap[site.key] = true
                        if (allSitesMap[site.key] && site.enable) {
                            rs.push(allSitesMap[site.key])
                        }
                    })
                    // 如果有新的站源 则追加到后面 默认启用
                    allSites.forEach(site => {
                        if (!visitedMap[site.key]) {
                            rs.push(site)
                        }
                    })
                    config.video.sites = rs

                    reply.send(config);
                }
            );
            fastify.get('/full-config', (_, reply) => {
                const config = getConfig()
                reply.send(config);
            })
        }
    );
}
