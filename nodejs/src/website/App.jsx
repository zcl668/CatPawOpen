import React, {useEffect} from 'react';
import { createRoot } from 'react-dom/client';
import {Button, Card, Form, Input, Tabs, message, Divider} from 'antd';
import axios from 'axios'
import copy from 'copy-to-clipboard';
import './App.less'
import refreshImg from './assets/qrcode_refresh.jpg'

const { TabPane } = Tabs;

const http = axios.create({
  baseURL: '/website',
})

http.interceptors.response.use(function (response) {
  if (response.data.code !== 0) {
    message.error(response.data.message);
    throw new Error(response.data);
  } else {
    return response.data.data;
  }
}, function (error) {
  return Promise.reject(error);
});

message.config({
  top: '40%',
});

function QrcodeImage({src}) {
  const [inited, setInited] = React.useState(false);
  return (
    <img src={inited ? src : refreshImg} onClick={() => setInited(true)}/>
  )
}

function QrcodeCard({qrcodeUrl, cacheUrl}) {
  const [data, setData] = React.useState('');

  const generateData = async () => {
    const data = await http.post(cacheUrl)
    setData(data)
  }

  const storeData = async () => {
    await http.put(cacheUrl, {
      cookie: data,
    })
    message.success('入库成功')
  }

  const copyText = (text) => {
    copy(text)
    message.success('复制成功')
  }

  useEffect(() => {
    http.get(cacheUrl)
      .then(data => {
        setData(data);
      })
  }, [])

  return (
    <div className={'qrcodeCard'}>
      <QrcodeImage src={qrcodeUrl}/>
      <Divider>
        <Button onClick={generateData}>扫码后点我</Button>
      </Divider>
      <Input.TextArea value={data} rows={4}/>
      <div className={'btns'}>
        <Button onClick={() => copyText(data)} disabled={!data} color="cyan" variant="solid"
                style={{marginRight: 24}} size={'large'}>复制</Button>
        <Button onClick={storeData} disabled={!data} type={'primary'} size={'large'}>入库</Button>
      </div>
    </div>
  )
}

function App() {
  return (
    <div className={'container'}>
      <Card style={{ minHeight: 500 }}>
        <Tabs defaultActiveKey={'quark'}>
          <TabPane tab="夸克" key="quark">
            <QrcodeCard
              qrcodeUrl="/website/quark/qrcode"
              cacheUrl="/quark/cookie"
            />
          </TabPane>
          <TabPane tab="UC Cookie" key="uc-cookie">
            <QrcodeCard
              qrcodeUrl="/website/uc/qrcode"
              cacheUrl="/uc/cookie"
            />
          </TabPane>
          <TabPane tab="UC token" key="uc-token">
            <QrcodeCard
              qrcodeUrl="/website/uc-tv/qrcode"
              cacheUrl="/uc-tv/token"
            />
          </TabPane>
          <TabPane tab="115" key="115">
            <QrcodeCard
              qrcodeUrl="/website/115/qrcode"
              cacheUrl="/115/cookie"
            />
          </TabPane>
          <TabPane tab="天翼" key="tianyi">
            <Form>
              <Form.Item label={"账号"}>
                <Input/>
              </Form.Item>
              <Form.Item label={"密码"}>
                <Input/>
              </Form.Item>
            </Form>
          </TabPane>
          <TabPane tab="移动" key="yidong">
            移动
          </TabPane>
        </Tabs>
      </Card>
    </div>
  )
}

export function renderClient() {
  const root = createRoot(document.getElementById('app'));
  root.render(<App/>);
}