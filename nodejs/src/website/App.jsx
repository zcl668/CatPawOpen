import React, {useEffect} from 'react';
import { createRoot } from 'react-dom/client';
import {Button, Card, Form, Input, Tabs, message, Divider, Space} from 'antd';
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
      <Input.TextArea value={data} onChange={e => setData(e.target.value)} rows={4}/>
      <div className={'btns'}>
        <Button onClick={() => copyText(data)} disabled={!data} color="cyan" variant="solid"
                style={{marginRight: 24}} size={'large'}>复制</Button>
        <Button onClick={storeData} disabled={!data} type={'primary'} size={'large'}>入库</Button>
      </div>
    </div>
  )
}

function MuOu() {
  const [url, setUrl] = React.useState('');

  const saveUrl = async () => {
    try {
      await http.put('/muou/url', {
        url
      })
      message.success('设置成功')
    } catch (e) {
      console.error(e);
      message.error(`设置失败：${e?.message}`)
    }
  }

  useEffect(() => {
    http.get('/muou/url')
      .then(data => {
        setUrl(data);
      })
  }, [])

  return (
    <Space.Compact style={{ width: '100%' }}>
      <Input placeholder="请输入木偶域名" value={url} onChange={(e) => setUrl(e.target.value)} />
      <Button type="primary" onClick={saveUrl}>保存</Button>
    </Space.Compact>
  )
}

function TianYi() {
  const [form] = Form.useForm();
  const submit = async () => {
    try {
      const data = await form.validateFields()
      await http.put('/tianyi/account', data)
      message.success('入库成功')
    } catch (e) {
      console.error(e)
      message.error(`入库失败：${e?.message}`)
    }
  }

  useEffect(() => {
    http.get('/tianyi/account')
      .then(data => {
        form.setFieldsValue(data)
      })
  }, [])

  return (
    <Form form={form}>
      <Form.Item label={"账号"} name="username">
        <Input/>
      </Form.Item>
      <Form.Item label={"密码"} name="password">
        <Input.Password/>
      </Form.Item>
      <Form.Item label={null}>
        <Button type="primary" onClick={submit}>
          保存
        </Button>
      </Form.Item>
    </Form>
  )
}

function App() {
  return (
    <div className={'container'}>
      <Card style={{ height: 600, width: 500 }}>
        <Tabs type="card">
          <TabPane tab="登录信息" key="account">
            <Tabs>
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
                <TianYi/>
              </TabPane>
            </Tabs>
          </TabPane>
          <TabPane tab="站源设置" key="site">
            <Tabs>
              <TabPane tab="木偶域名" key="muou">
                <MuOu/>
              </TabPane>
            </Tabs>
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