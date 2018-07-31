const router = require('koa-router')()
const userctrl = require('../public/controller/usercontroller')
const wechatapp = require('../public/wechat_robot/wechat')
const wechatmethod = require('../public/wechat_robot/wechatmethod.js')
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
        await promise.then(async (result) => {
            var realcontent = await wechatmethod.getMsgListForGXH(result.xml.Content);
			var as="";
			console.log(realcontent.length)
			if(realcontent.length>15){
				realcontent =realcontent.slice(0,10);
			}
			realcontent.forEach(item=>{
				as+="\r\n"+item.jsonData.msg+"\r\n";
			})
			as=as+"\r\n"+"更多拼车消息请访问"+"\r\n"+"www.sharedrive.cn";
			wxgzhmethod.msg = as;
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