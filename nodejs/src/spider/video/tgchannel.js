import { init as _init ,detail as _detail ,proxy ,play } from '../../util/pan.js';
import axios from "axios";
import {is115Link, is123Link, isAliLink, isQuarkLink, isTyLink, isUcLink, isYdLink} from "../../util/linkDetect.js";
import * as cheerio from "cheerio";
import {getHomeChannelUsernameCache, getChannelUsernameCache, getCountCache} from "../../website/tgchannel.js";

function findImg(node) {
  const style = node.attr('style');
  const backgroundUrlMatch = /background-image:url\('([^']+)'\)/.exec(style);

  if (backgroundUrlMatch && backgroundUrlMatch.length > 1) {
    return backgroundUrlMatch[1];
  }
}

function replaceTitle(text) {
  text = text.replace(/https?:\/\/[^\s]+/gi, '')
  text = text.split(/名称[：|:]/)?.[1] || text;
  text = text.split(/\(|（/)?.[0] || text;
  text = text.split('\n')?.[0] || text;
  text = text.split(' ')[0]
  return text?.trim()
}

function findPanLinks(text) {
  const rs = []
  const validators = [isAliLink, isQuarkLink, isUcLink, isTyLink, isYdLink, is123Link, is115Link]
  const links = text.match(/https?:\/\/[^\s]+/gi)
  if (links) {
    for(let link of links) {
      if (validators.some(validator => validator(link))) {
        rs.push(link)
      }
    }
  }
  return rs;
}

function findTgMsgLink(text) {
  const links = text.match(/https?:\/\/[^\s]+/gi)
  if (links) {
    for (let link of links) {
      if (isTgLink(link)) {
        return link
      }
    }
  }
}

const isTgLink = (shareUrl) => /t.me\/.*\/.*/.test(shareUrl)

async function parseChannelHtml(channelLink) {
  const response = await axios.get(channelLink, {
    timeout: 5000
  })
  const $ = cheerio.load(response.data);
  const blocks = $('.tgme_widget_message')
  const rs = []
  for(let block of blocks){
    const id = block.attribs['data-post']
    const cover = findImg($(block).find('.tgme_widget_message_photo_wrap'))
    const text = $(block).find('.tgme_widget_message_text').text()
    const title = replaceTitle(text)
    const description = text
    const links = findPanLinks(text)
    let tgMsgLink
    if (!links.length) {
      tgMsgLink = findTgMsgLink($(block).find('.tgme_widget_message_text a').text())
    }
    if (cover && (links.length > 0 || tgMsgLink)) {
      rs.push({
        id,
        title,
        description,
        cover,
        links,
        tgMsgLink
      })
    }
  }
  return rs
}

async function parseMessageHtml(msgLink) {
  const response = await axios.get(msgLink, {
    timeout: 5000
  })
  const $ = cheerio.load(response.data);
  const cover = $('meta[property="og:image"]').attr('content')
  const title = replaceTitle($('meta[property="og:description"]').attr('content'))
  const description = $('meta[property="og:description"]').attr('content')
  const links = findPanLinks($('meta[property="og:description"]').attr('content'))
  const tgMsgLink = findTgMsgLink($('meta[property="og:description"]').attr('content'))

  return {
    title,
    description,
    cover,
    links,
    tgMsgLink,
  }
}

function getNumberId(id) {
  return Number(id.split('/')[1])
}

async function init(inReq, _outResp) {
  await _init(inReq, _outResp);
  return {};
}

async function home(inReq) {
  const homeChannelUsername = await getHomeChannelUsernameCache(inReq.server)
  return {
    class: homeChannelUsername.split(',').map(id => {
      return {
        type_id: id,
        type_name: id,
      }
    }),
  };
}

const channelEndIdMap = {}
const channelCurrentIdMap = {}

async function category(inReq) {
  const id = inReq.body.id;
  let page = inReq.body.page;
  if (!page) page = 1;
  try {
    const data = await parseChannelHtml(`https://t.me/s/${id}${page > 1 ? `?before=${channelCurrentIdMap[id]}` : ''}`);
    channelCurrentIdMap[id] = getNumberId(data[0].id);
    if (page === 1) {
      channelEndIdMap[id] = getNumberId(data[data.length - 1].id);
    }
    data.reverse()
    const videos = data.map((item) => {
      return {
        vod_name: item.title,
        vod_id: item.id,
        vod_pic: item.cover,
        rawData: item,
      }
    })
    return {
      page,
      pagecount: Math.ceil(channelEndIdMap[id] / videos.length),
      list: videos,
    }
  } catch (e) {
    console.error(e)
    return {
      page,
      pagecount: 1,
      list: []
    }
  }
}

async function detail(inReq, _outResp) {
  const ids = !Array.isArray(inReq.body.id) ? [inReq.body.id] : inReq.body.id;
  const videos = [];
  for (const id of ids) {
    const data = await parseMessageHtml(`https://t.me/${id}`);
    let links = data.links
    if (!links.length && data.tgMsgLink) {
      const tgMsgInfo = await parseMessageHtml(data.tgMsgLink)
      links = tgMsgInfo.links
    }
    const vodFromUrl = await _detail(links);
    const vod = {
      vod_id: id,
      vod_name: data.title,
      vod_pic: data.cover,
      vod_content: data.description,
    }
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
  const count = await getCountCache(inReq.server)
  const channelUsername = await getChannelUsernameCache(inReq.server)
  const wd = inReq.body.wd;
  const channels = channelUsername.split(',')
  const data = await Promise.all(channels.map(channel => {
    return category({
      body: {
        id: `${channel}?q=${encodeURIComponent(wd)}`
      }
    })
  }))
  const rs = []
  const panInfos = [
    {name: '逸动', validator: isYdLink, 'pic': 'https://yun.139.com/w/static/img/LOGO.png'},
    {name: '天意', validator: isTyLink, pic: 'https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/a8/fa/f0/a8faf032-0fa4-d9c5-ac70-920d9c84dff1/AppIcon-0-0-1x_U007emarketing-0-7-0-0-sRGB-85-220.png/350x350.png'},
    {name: '115', validator: is115Link, pic: 'https://img.pcsoft.com.cn/soft/202104/093230-608b5e2ed5912.jpg'},
    {name: '夸父', validator: isQuarkLink, pic: 'https://ts1.cn.mm.bing.net/th/id/R-C.a0d60e6a72806738e6f0b711a979bdf5?rik=lp5C9t5sYlkrLw&riu=http%3a%2f%2fpic.2265.com%2fupload%2f2020-10%2f202010151719492792.png&ehk=Pv6rq3JxJvKe2y1QsdzssyZ4Ez4cwiKWmIvK0aMgxi0%3d&risl=&pid=ImgRaw&r=0'},
    {name: '优夕', validator: isUcLink, pic: 'https://ts1.cn.mm.bing.net/th/id/R-C.421c96e47df7c9719403654ee4f7c281?rik=yiiEoGCTgDDc3w&riu=http%3a%2f%2fpic.9663.com%2fupload%2f2023-5%2f20235111411256277.png&ehk=R81N%2flXMrl%2bxpRlST8DtHXDfab6rzaMb83gihuD71Fk%3d&risl=&pid=ImgRaw&r=0'},
    {name: '阿狸', validator: isAliLink, pic: 'https://inews.gtimg.com/newsapp_bt/0/13263837859/1000'},
    {name: '123', validator: is123Link, pic: 'https://statics.123957.com/static/favicon.ico'},
  ]
  data.forEach((channelData, index) => {
    channelData.list.filter(item => item.rawData.links.length).slice(0, count).forEach(item => {
      let remark = ''
      item.rawData.links.forEach(link => {
        const panInfo = panInfos.find(pan => pan.validator(link));
        if (panInfo) {
          remark += remark ? `|${panInfo.name}` : panInfo.name;
        }
      })
      rs.push({
        vod_id: item.vod_id,
        vod_name: item.vod_name,
        vod_pic: item.vod_pic,
        vod_remarks: `${remark}:${channels[index]}`,
      })
    })
  })
  return {
    page: 1,
    pagecount: 1,
    list: rs,
  };
}

export default {
  meta: {
    key: 'tgchannel',
    name: 'tg频道',
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
