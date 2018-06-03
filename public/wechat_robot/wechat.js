const {
    Wechaty,
    Room,
    Contact,
    MediaMessage
} = require('wechaty')
const QrcodeTerminal = require('qrcode-terminal')
const bot = Wechaty.instance()

const router = require('koa-router')()
var request = require('request');

router.prefix('/wechat')
const one = ['车寻人', '车找人', '找人', '寻人', '满人', '满车', '车满', '人满']
const two = ['人寻车', '人找车', '找车', '寻车']
var msgMap = new Map();


router.get('/msglist', function(ctx, next) {

    request('https://api.it120.cc/360mall/json/list', (error, response, body) => {
        if (!error && response.statusCode == 200) {
            let resul = JSON.parse(body);
            if (resul.code == 0) {
                resul.data.forEach(item => {
                    msgMap.set(item.jsonData.author, item.id)
                })
            }
            ctx.body = {
                requestdata: body
            }
        }
    })
})

function getInfoList() {
    return new Promise((resolve, reject) => {
        request('https://api.it120.cc/360mall/json/list', (error, response, body) => {
            if (!error && response.statusCode == 200) {
                let resul = JSON.parse(body);
                if (resul.code == 0) {
                    resul.data.forEach(item => {
                        msgMap.set(item.jsonData.author, item.id)
                    })
                }
                resolve();
            }
        })
    })
}

function sendMsg(text, desp) {
    request.post({
        url: 'https://sc.ftqq.com/SCU27446T6848a340eb15bbceea156eef0cbb3c0c5b13e4e00adb0.send',
        formData: {
            text: text,
            desp: desp
        }
    }, function(error, response, body) {
        if (!error && response.statusCode == 200) {}
    })
}
// 登录二维码
bot.on('scan', (url, code) => {
        if (!/201|200/.test(String(code))) {
            console.log(`请扫描二维码完成登录: `)
            const loginUrl = url.replace(/\/qrcode\//, '/l/')
                // request('https://api.it120.cc/360mall/json/list', function(error, response, body) {
                //     if (!error && response.statusCode == 200) {
                //         let resul = JSON.parse(body);
                //         if (resul.code == 0) {
                //             resul.data.forEach(item => {
                //                 msgMap.set(item.jsonData.author, item.id)
                //                 request('https://api.it120.cc/360mall/json/delete?id=' + item.id, function(error, response, body) {

            //                 })
            //             })
            //         }
            //     }
            // })
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
        sendMsg("登陆成功", `${user}`)
    })
    .on('logout', async m => {
        console.log('logout')
        console.log(m);
        sendMsg("机器人退出了", `${user}`)
    })
    .on('error', async m => {
        sendMsg("机器人报错了", `${m}`)
    })
    .on('friend', m => {
        sendMsg("有人加好友", `${m}`)
    })
    // 自动回复
    .on('message', async m => {
        const contact = m.from() //发送人
        const content = m.content() //内容
        const room = m.room() //群  room.topic()
        const tels = content.match(/((((13[0-9])|(15[^4])|(18[0,1,2,3,5-9])|(17[0-8])|(147))\d{8})|((\d3,4|\d{3,4}-|\s)?\d{7,14}))?/g)
        const tel = tels.filter((x) => { if (x) { return x } })
        console.log(`${contact.name()}-----发送了----：${content}`)

        if (room) {
            var contet = null;
            one.forEach(item => {
                if (content.indexOf(item) > -1) {
                    contet = {
                        type: 1,
                        author: contact.name(),
                        wxid: contact.id,
                        msg: content.replace(/(<img.*?)>/gi, ''),
                        tel: tel[0]
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
                        tel: tel[0]
                    }
                }
            })

            if (contet) {
                sendMsg(contact.name(), content) //发送日志
                let postdata = { content: JSON.stringify(contet) };
                getInfoList().then(() => {
                    if (msgMap.has(contact.name())) {
                        postdata['id'] = msgMap.get(contact.name());
                    }
                    request.post({
                        url: 'https://api.it120.cc/360mall/json/set',
                        formData: postdata
                    }, function(error, response, body) {
                        if (!error && response.statusCode == 200) {}
                    })
                })
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
// bot.start()