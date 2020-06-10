const {
    Wechaty,
    Room,
    Contact,
    MediaMessage
} = require('wechaty')
const wechatmethod = require('./wechatmethod')

const QrcodeTerminal = require('qrcode-terminal')
const pchatController = require('../controller/padchatcontroller');
const bot = Wechaty.instance()
const fs = require('fs');
const router = require('koa-router')()
var request = require('request');

router.prefix('/wechat')
const one = ['车寻人', '车找人', '找人', '寻人', '满人', '满车', '车满', '人满']
const two = ['人寻车', '人找车', '找车', '寻车', '找个车']
var msgMap = new Map();
router.get('/msglist', async function(ctx, next) { //
    
    let result = await wechatmethod.getMsgList(ctx.query.page);
    ctx.body = result;
})
router.get('/delate', (ctx, next) => {

})

// 登录二维码···
bot.on('scan', (url, code) => {
        if (!/201|200/.test(String(code))) {
            console.log(`请扫描二维码完成登录: `)
            pchatController.padurl = url;
            const loginUrl = url.replace(/\/qrcode\//, '/l/')
            
            router.get('/loginul', function(ctx, next) {
                ctx.body = {
                    loginUrl: loginUrl
                }
            })
        }
    })
    // 登录成功
    .on('login', user => {
        const me = user
        console.log(`User ${user} logined`)
        wechatmethod.sendMsg("登陆成功", `${user}`)
    })
    .on('logout', async m => {
        console.log('logout')
        console.log(m);
        wechatmethod.sendMsg("机器人退出了", `${user}`)
    })
    .on('error', async m => {
        wechatmethod.sendMsg("机器人报错了", `${m}`)
    })
    .on('friendship', friendship => {
        wechatmethod.sendMsg("有人加好友", `${friendship}`)
    })
    // 自动回复
    .on('message', async m => {
        const contact = m.from() //发送人
        const content = m.text() //内容
        const room = m.room() //群  room.topic()
        const tels = content.match(/((((13[0-9])|(15[^4])|(18[0,1,2,3,5-9])|(17[0-8])|(147))\d{8})|((\d3,4|\d{3,4}-|\s)?\d{7,14}))?/g)
        const tel = tels.filter((x) => {
            if (x) {
                return x
            }
        })
        let sex  = contact.gender()==1?"男":"女"
        const file = await contact.avatar()
        var imgtype = file.name.split('.')
        var name =file.name
        if(imgtype.length>1){
            name = `./images/${contact.id}.${imgtype[imgtype.length-1]}`
        }
        await file.toFile(name, true)
        if (room) {
            var contet = null;
            one.forEach(item => {
                if (content.indexOf(item) > -1) {
                    contet = {
                        type: 1,
                        author: contact.name(),
                        wxid: contact.id,
                        msg: content.replace(/(<img.*?)>/gi, ''),
                        tel: tel[0],
                        gender:sex,
                        headimg:name
                    }
                }
            })
            two.forEach(item => {
                if (content.indexOf(item) > -1) {
                    contet = {
                        type: 2,
                        author: contact.name(),
                        wxid: contact.id,
                        msg: content.replace(/(<img.*?)>/gi, ''),
                        tel: tel[0],
                        gender:sex,
                        headimg:name
                    }
                }
            })
            if (contet) {
                wechatmethod.sendMsg(contact.name(), content) //发送日志
                let postdata = {
                    content: JSON.stringify(contet),
                    type:contet.type
                };
                msgMap = await wechatmethod.getInfoList();
                if (msgMap.has(contact.name())) {
                    postdata['id'] = msgMap.get(contact.name());
                }
                wechatmethod.postData(postdata);
            }
        } else {
            if (contact.name() != "Sking") {}
        }
    })
var wechatapp = {
    app: bot,
    router: router
}
module.exports = wechatapp;