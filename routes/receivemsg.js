const router = require('koa-router')()
const userctrl = require('../public/controller/usercontroller')
const wechatapp = require('../public/wechat_robot/wechat')
const padch = require('../public/controller/padchatcontroller')
const htmlqrcode = require('qrcode')
const wxgzhmethod = require('../public/wxgzh/publicmethod')
const crypto = require('crypto')

router.post('/', async (ctx, next) => {
    if (ctx.method == 'POST') {
        let promise =new Promise(function (resolve, reject) {
            let buf = ''
            ctx.req.setEncoding('utf8')
            ctx.req.on('data', (chunk) => {
                buf += chunk
            })
            ctx.req.on('end', () => {
                wxgzhmethod.xmlToJson(buf)
                    .then(resolve)
                    .catch(reject)
            })
        })
        await promise.then(result => {
            console.log(result)
            ctx.req.body = result;
            
        }).catch(e => {
            e.status = 400;
        })
        next()
    } else {
        await next()
    }
})
module.exports = router