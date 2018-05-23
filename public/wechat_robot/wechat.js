const { Wechaty, Room, Contact, MediaMessage } = require('wechaty')
const QrcodeTerminal = require('qrcode-terminal')
const bot = Wechaty.instance()

const router = require('koa-router')()

router.prefix('/wechat')


// 登录二维码
bot.on('scan', (url, code) => {
    if (!/201|200/.test(String(code))) {
        console.log(`请扫描二维码完成登录: `)
        const loginUrl = url.replace(/\/qrcode\//, '/l/')

        router.get('/loginul', function (ctx, next) {
            ctx.body = 'this is a users/bar response'+loginUrl
          })
        QrcodeTerminal.generate(loginUrl, { small: true })
    }
})
// 登录成功
.on('login', user => {
    const me = user
    console.log(`User ${user} logined`)
})
// 自动回复
.on('message', async m => {
    // await m.say('hello world')
    // console.log('Receive msg: ' + m.content())
    const contact = m.from() //发送人
    const content = m.content() //内容
    const room = m.room() //群
    if (room) {
            if (content.indexOf('车寻人') > -1) {
                for (let i = 0; i < ctxs.length; i++) {
                    var res = `【${room.topic()}】^【${contact.name()}】^ ${content}`
                    ctxs[i].websocket.send(res);
                }
                messagelist.set(contact.name(),res);
            }
    } else {
        if (contact.name() != "Sking") {
        }
    }
})
var wechatapp = {
    app:bot,
    router:router
}
module.exports =wechatapp;
// bot.start()
