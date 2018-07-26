const router = require('koa-router')()
const userctrl = require('../public/controller/usercontroller')
const wechatapp = require('../public/wechat_robot/wechat')
const padch = require('../public/controller/padchatcontroller')
const htmlqrcode = require('qrcode')
const wxgzhmethod = require('../public/wxgzh/publicmethod')
const wechatmethod = require('../public/wechat_robot/wechatmethod')
const crypto = require('crypto')
router.get('/', async (ctx, next) => {
  const result = wxgzhmethod.auth(ctx)
  if (result) {
    ctx.body = ctx.query.echostr
  } else {
    await ctx.render('index',{
      title:'哥们，你访问这里是想做什么呢，赶快回去把',
      hrf:'www.sharedrive.cn'
  })
  }
})
router.post('/', async (ctx, next) => {
  let msg,
    MsgType,
    result,
    content

  msg = ctx.req.body ? ctx.req.body.xml : ''

  if (!msg) {
    ctx.body = 'error request.'
    return;
  }
  
  content =msg.Content[0];
  MsgType = msg.MsgType[0];
  let ooresult =await  wechatmethod.getMsgListForGXH(content);
  console.log(`MsgType--------${MsgType}-----${msg.Content}`)
  switch (MsgType) {
    case 'text':
      result = wxgzhmethod.message(msg, msg.Content)
      break;
    default:
      result = 'success'
  }
  ctx.res.setHeader('Content-Type', 'application/xml')
  ctx.res.end(result)
})
router.get('/string', async (ctx, next) => {
  ctx.body = wechatapp.loginurl
  wxgzhmethod.accesstoken = await wxgzhmethod.getAccessToken();
  console.log(wxgzhmethod.accesstoken)
})

router.get('/json', async (ctx, next) => {
  ctx.body = {
    title: 'koa2 json'
  }
})
router.get('/register', userctrl.register)

router.get('/login', userctrl.login)
module.exports = router