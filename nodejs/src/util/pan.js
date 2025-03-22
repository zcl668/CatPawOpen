import { IOS_UA, isEmpty} from './misc.js';
import * as Ali from './ali.js';
import * as Quark from './quark.js';
import * as UC from './uc.js';
import {Cloud, initCloud} from "./cloud.js";
import {Yun} from "./yun.js";
import {initPan123Cloud, Pan} from "./pan123.js";
import * as Y115 from './115.js';
import {videosHandle} from "./utils.js";

export { isEmpty };
export const ua = IOS_UA;

export async function init(inReq, _outResp) {
    return {};
}

export async function detail(shareUrls) {
        shareUrls = !Array.isArray(shareUrls) ? [shareUrls] : shareUrls;
        const froms = [];
        const urls = [];
        for (const shareUrl of shareUrls) {
            if (/www.alipan.com|www.aliyundrive.com/.test(shareUrl)) {
                const data = await Ali.detail(shareUrl);
                if(data && data.from && data.url){
                    froms.push(data.from);
                    urls.push(data.url);
                }
            } else if (shareUrl.includes('https://pan.quark.cn')) {
                const data = await Quark.detail(shareUrl);
                if(data && data.from && data.url){
                    froms.push(data.from);
                    urls.push(data.url);
                }
            } else if (shareUrl.includes('https://drive.uc.cn')) {
                const data = await UC.detail(shareUrl);
                if(data && data.from && data.url){
                    froms.push(data.from);
                    urls.push(data.url);
                }
            } else if (shareUrl.includes('https://cloud.189.cn')) {
                const shareData = await Cloud.getShareData(shareUrl);
                if(shareData) {
                    Object.keys(shareData).forEach(it => {
                        const data = videosHandle('天意-' + it, shareData[it])
                        if(data && data.from && data.url){
                            froms.push(data.from);
                            urls.push(data.url);
                        }
                    })
                }
            } else if (shareUrl.includes('yun.139.com')) {
                let shareData = await Yun.getShareData(shareUrl)
                Object.keys(shareData).forEach(it => {
                    const data = videosHandle('逸动-' + it, shareData[it])
                    if(data && data.from && data.url){
                        froms.push(data.from);
                        urls.push(data.url);
                    }
                })
            } else if(/www.123684.com|www.123865.com|www.123912.com/.test(shareUrl)) {
                const shareData = await Pan.getShareData(shareUrl)
                let files = await Pan.getFilesByShareUrl(shareData)
                Object.keys(files).forEach(it => {
                    const data = videosHandle('Pan123-' + it, files[it])
                    if(data && data.from && data.url){
                        froms.push(data.from);
                        urls.push(data.url);
                    }
                })
            } else if(/115.com|anxia.com|115cdn.com/.test(shareUrl)) {
                const data = await Y115.detail(shareUrl);
                if(data && data.from && data.url){
                    froms.push(data.from);
                    urls.push(data.url);
                }
            }
        }

        return {
            froms: froms.join('$$$'),
            urls: urls.join('$$$')
        };
}

export async function proxy(inReq, _outResp) {
    const site = inReq.params.site;
    if (site == 'ali') {
        return await Ali.proxy(inReq, _outResp);
    } else if (site == 'quark') {
        return await Quark.proxy(inReq, _outResp);
    } else if (site == 'uc') {
        return await UC.proxy(inReq, _outResp);
    }
}

export async function play(inReq, _outResp) {
    const flag = inReq.body.flag;
    if (flag.startsWith('阿狸')) {
        return await Ali.play(inReq, _outResp);
    } else if (flag.startsWith('夸父')) {
        return await Quark.play(inReq, _outResp);
    } else if (flag.startsWith('优夕')) {
        return await UC.play(inReq, _outResp);
    } else if (flag.startsWith('天意')) {
        const ids = inReq.body.id.split('*');
        await initCloud(inReq)
        const url = await Cloud.getShareUrl(ids[0], ids[1]);
        return {
            parse: 0,
            url: ['原画', url],
        }
    } else if (flag.startsWith('逸动')) {
        const ids = inReq.body.id.split('*');
        const url = await Yun.getSharePlay(ids[0], ids[1]);
        return {
            parse: 0,
            url: ['原画', url],
        }
    } else if (flag.startsWith('Pan123')) {
        await initPan123Cloud(inReq)
        const ids = inReq.body.id.split('*');
        const url = await Pan.getDownload(...ids);
        return {
            parse: 0,
            url: ['原画', url],
        }
    } else if (flag.startsWith('115')) {
        return await Y115.play(inReq, _outResp);
    }
}

export async function test(inReq, outResp) {
    try {
        const prefix = inReq.server.prefix;
        const dataResult = {};
        let resp = await inReq.server.inject().post(`${prefix}/init`);
        dataResult.init = resp.json();
        printErr(resp.json());
        resp = await inReq.server.inject().post(`${prefix}/home`);
        dataResult.home = resp.json();
        printErr(resp.json());
        let detailCalled = false;
        if (dataResult.home.class && dataResult.home.class.length > 0) {
            const typeId = dataResult.home.class[0].type_id;
            let filters = {};
            if (dataResult.home.filters) {
                let filter = dataResult.home.filters[typeId];
                if (filter) {
                    for (const filterCfg of filter) {
                        const initValue = filterCfg.init;
                        if (!initValue) continue;
                        for (const value of filterCfg.value) {
                            if (value.v == initValue) {
                                filters[filterCfg.key] = initValue;
                                break;
                            }
                        }
                    }
                }
            }
            resp = await inReq.server.inject().post(`${prefix}/category`).payload({
                id: typeId,
                page: 1,
                filter: true,
                filters: filters,
            });
            dataResult.category = resp.json();
            printErr(resp.json());
            if (dataResult.category.list.length > 0) {
                detailCalled = true;
                const vodId = dataResult.category.list[0].vod_id;
                await detailTest(inReq, vodId, dataResult);
            }
        }
        resp = await inReq.server.inject().post(`${prefix}/search`).payload({
            wd: '仙逆',
            page: 1,
        });
        dataResult.search = resp.json();
        if (!detailCalled && dataResult.search.list.length > 0) {
            const vodId = dataResult.search.list[0].vod_id;
            await detailTest(inReq, vodId, dataResult);
        }
        printErr(resp.json());
        return dataResult;
    } catch (err) {
        console.error(err);
        outResp.code(500);
        return { err: err.message, tip: 'check debug console output' };
    }
}

async function detailTest(inReq, vodId, dataResult) {
    const prefix = inReq.server.prefix;
    let resp = await inReq.server.inject().post(`${prefix}/detail`).payload({
        id: vodId,
    });
    dataResult.detail = resp.json();
    printErr(resp.json());
    if (dataResult.detail.list && dataResult.detail.list.length > 0) {
        dataResult.play = [];
        for (const vod of dataResult.detail.list) {
            const flags = vod.vod_play_from.split('$$$');
            const ids = vod.vod_play_url.split('$$$');
            for (let j = 0; j < flags.length; j++) {
                const flag = flags[j];
                const urls = ids[j].split('#');
                for (let i = 0; i < urls.length && i < 2; i++) {
                    resp = await inReq.server
                        .inject()
                        .post(`${prefix}/play`)
                        .payload({
                            flag: flag,
                            id: urls[i].split('$')[1],
                        });
                    dataResult.play.push(resp.json());
                }
            }
        }
    }
}

function printErr(json) {
    if (json.statusCode && json.statusCode == 500) {
        console.error(json);
    }
}
