// import { MessageType } from 'wechaty-puppet';
const {MessageType} =require('wechaty-puppet')
const { Contact, Message,Wechaty } = require('wechaty')
const router = require('koa-router')()
// import { ScanStatus } from 'wechaty-puppet'
const {PuppetPadplus} = require('wechaty-puppet-padplus')
const pchatController = require('../controller/padchatcontroller');
const api1 = require('../../server/api');
const dealMsg = require('./dealMsg')
// import QrcodeTerminal from 'qrcode-terminal'
router.prefix('/wechat')
const token = 'puppet_padplus_36338d4fd4d7117c'
const wechatmethod = require('../wechat_robot/wechatmethod')
router.get('/msglist', async function(ctx, next) { //
    
  let result = await wechatmethod.getMsgList(ctx.query.page);
  ctx.body = result;
})
const puppet = new PuppetPadplus({
    token,
})

const dealMsgObj  = new dealMsg();
const bot = new Wechaty({
  puppet,
  name:'sking'
})
// 运行 wechaty
bot
.on('scan', (qrcode, status) => {

  console.log(`Scan QR Code to login: ${status}
  https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrcode)}`)
  let url = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrcode)}`
  pchatController.padurl = url;
  router.get('/loginul', function(ctx, next) {
      ctx.body = {
          loginUrl: url
      }
  })
})
.on('login', user => {
  console.log(`User ${user} login.`)
})
.on('message', async message => {
  dealMsgObj.collectMsg(message)
  
  if(await message.mentionSelf()){ //被艾特了
    console.log('被艾特了')
  }
  if (message.type() === MessageType.Recalled) { //撤回了消息
    const recalledMessage = await message.toRecalled()
    console.log(`Message: ${recalledMessage} has been recalled.`)
  }
  console.log(`Message: ${message}`)
})
var wechatapp = {
    app: bot,
    router: router
}
module.exports = wechatapp;