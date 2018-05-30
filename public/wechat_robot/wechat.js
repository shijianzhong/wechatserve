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
const one = ['车寻人', '车找人', '找人', '寻人']
const two = ['人寻车', '人找车', '找车', '找人']
var msgMap = new Map();


router.get('/msglist', function (ctx, next) {

    request('https://api.it120.cc/360mall/json/list', (error, response, body)=> {
        if (!error && response.statusCode == 200) {
            let resul =JSON.parse(body);
            if(resul.code==0){
                resul.data.forEach(item=>{
                    msgMap.set(resul.jsonData.author,resul.id)
                })
            }
            ctx.body={
                requestdata:body
            }
        }
    })
})
// 登录二维码
bot.on('scan', (url, code) => {
        if (!/201|200/.test(String(code))) {
            // console.log(`请扫描二维码完成登录: `)
            const loginUrl = url.replace(/\/qrcode\//, '/l/')
            request('https://api.it120.cc/360mall/json/list', function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    let resul =JSON.parse(body);
                    if(resul.code==0){
                        resul.data.forEach(item=>{
                            msgMap.set(resul.jsonData.author,resul.id)
                        })
                    }
                }
            })
            router.get('/loginul', function (ctx, next) {
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
    })
    // 自动回复
    .on('message', async m => {
        const contact = m.from() //发送人
        const content = m.content() //内容
        const room = m.room() //群  room.topic()
        if (room) {
            var contet = null;
            one.forEach(item => {
                if (content.indexOf(item) > -1) {
                    contet = {
                        type: 1,
                        author: contact.name(),
                        msg: content
                    }
                }
            })
            two.forEach(item => {
                if (content.indexOf(item) > -1) {
                    contet = {
                        type: 2,
                        author: contact.name(),
                        msg: content
                    }
                }
            })
            if (contet) {
                let postdata = {content:JSON.stringify(contet)};
                if(msgMap.has(contact.name())){
                   postdata['id']=msgMap.get(contact.name());
                }
                request.post({
                    url: 'https://api.it120.cc/360mall/json/set',
                    formData:postdata
                }, function (error, response, body) {
                    if (!error && response.statusCode == 200) {}
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