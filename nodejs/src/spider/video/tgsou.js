import { init as _init ,detail as _detail ,proxy ,play } from '../../util/pan.js';
import {getUrlCache, getChannelUsernameCache, getCountCache} from "../../website/tgsou.js";
import axios from "axios";

async function init(inReq, _outResp) {
  await _init(inReq, _outResp);
  return {};
}

async function home(_inReq, _outResp) {
  return {
    class: [],
  };
}



async function category(inReq, _outResp) {
 return {
   page: 1,
   pagecount: 1,
   list: [],
 }
}

async function detail(inReq, _outResp) {
  const ids = !Array.isArray(inReq.body.id) ? [inReq.body.id] : inReq.body.id;
  const videos = [];
  for (const id of ids) {
    const vodFromUrl = await _detail(id, inReq);
    const vod = {}
    if (vodFromUrl){
      vod.vod_play_from = vodFromUrl.froms;
      vod.vod_play_url = vodFromUrl.urls;
    }
    videos.push(vod);
  }
  return {
    list: videos,
  };
}

async function search(inReq, _outResp) {
  const url = await getUrlCache(inReq.server)
  const count = await getCountCache(inReq.server)
  const channelUsername = await getChannelUsernameCache(inReq.server)
  const wd = inReq.body.wd;
  const res = await axios.get(`${url}?pic=false&count=${count}&channelUsername=${encodeURIComponent(channelUsername)}&keyword=${encodeURIComponent(wd)}`);
  const rs = []
  const panInfos = [
    {name: '逸动', domains: ['caiyun.139.com'], 'pic': 'https://yun.139.com/w/static/img/LOGO.png'},
    {name: '天意', domains: ['cloud.189.cn'], pic: 'https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/a8/fa/f0/a8faf032-0fa4-d9c5-ac70-920d9c84dff1/AppIcon-0-0-1x_U007emarketing-0-7-0-0-sRGB-85-220.png/350x350.png'},
    {name: '115', domains: ['115.com', 'anxia.com', '115cdn.com'], pic: 'https://img.pcsoft.com.cn/soft/202104/093230-608b5e2ed5912.jpg'},
    {name: '夸父', domains: ['pan.quark'], pic: 'https://ts1.cn.mm.bing.net/th/id/R-C.a0d60e6a72806738e6f0b711a979bdf5?rik=lp5C9t5sYlkrLw&riu=http%3a%2f%2fpic.2265.com%2fupload%2f2020-10%2f202010151719492792.png&ehk=Pv6rq3JxJvKe2y1QsdzssyZ4Ez4cwiKWmIvK0aMgxi0%3d&risl=&pid=ImgRaw&r=0'},
    {name: '优夕', domains: ['drive.uc'], pic: 'https://ts1.cn.mm.bing.net/th/id/R-C.421c96e47df7c9719403654ee4f7c281?rik=yiiEoGCTgDDc3w&riu=http%3a%2f%2fpic.9663.com%2fupload%2f2023-5%2f20235111411256277.png&ehk=R81N%2flXMrl%2bxpRlST8DtHXDfab6rzaMb83gihuD71Fk%3d&risl=&pid=ImgRaw&r=0'},
    {name: '阿狸', domains: ['alipan', 'aliyundrive'], pic: 'https://inews.gtimg.com/newsapp_bt/0/13263837859/1000'},
    {name: '123', domains: ['www.123684.com', 'www.123865.com', 'www.123912.com'], pic: 'https://statics.123957.com/static/favicon.ico'},
  ]
  for (let item of res.data.results) {
    let [group, vodListStr] = item.split("$$$");
    if (!vodListStr) continue;
    const vodList = vodListStr.split("##");
    for (let p = 0; p < vodList.length && p <= count; p++) {
      const [link, title] = vodList[p].split("$$")
      if (!rs.some(item => item.vod_id === link)) {
        const panInfo = panInfos.find(pan => pan.domains.some(domain => link.includes(domain)));
        if (panInfo) {
          rs.push({
            vod_id: link?.replace(/\s+/g, ''),
            vod_name: title?.replace(/\s+/g, '') || wd,
            vod_pic: panInfo.pic,
            vod_remarks: `${panInfo.name}:${group}`,
          })
        }
      }
    }
  }
  return {
    page: 1,
    pagecount: 1,
    list: rs,
  };
}

export default {
  meta: {
    key: 'tgsou',
    name: 'tg搜(仅搜索)',
    type: 3,
  },
  api: async (fastify) => {
    fastify.post('/init', init);
    fastify.post('/home', home);
    fastify.post('/category', category);
    fastify.post('/detail', detail);
    fastify.post('/play', play);
    fastify.post('/search', search);
    fastify.get('/proxy/:site/:what/:flag/:shareId/:fileId/:end', proxy);
  },
};
