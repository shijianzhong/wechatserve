/*
 * @Description:
 * @Author: shijianzhong
 * @Date: 2019-04-09
 */
const router = require('koa-router')();
const userctrl = require('../public/controller/usercontroller');
const wechatapp = require('../public/wechat_robot/wechat');
const wechatmethod = require('../public/wechat_robot/wechatmethod.js');
const padch = require('../public/controller/padchatcontroller');
const htmlqrcode = require('qrcode');
const wxgzhmethod = require('../public/wxgzh/publicmethod');
// const padchatapp = require('../public/padchat_robot/padchat')
const crypto = require('crypto');

router.post('/', async (ctx, next) => {
  if (ctx.method == 'POST') {
    let promise = new Promise(function(resolve, reject) {
      let buf = '';
      ctx.req.setEncoding('utf8');
      ctx.req.on('data', chunk => {
        buf += chunk;
      });
      ctx.req.on('end', () => {
        wxgzhmethod
          .xmlToJson(buf)
          .then(resolve)
          .catch(reject);
      });
    });
    await promise
      .then(async result => {
        var patt1 = /^#{2}.*/;
        var ct = result.xml.Content[0];
        var sendmsg = ct.match(patt1);
        if (sendmsg) {
          wxgzhmethod.pbmsg = sendmsg;
          let suc = wxgzhmethod.message(result.xml, '发布成功');
          ctx.res.setHeader('Content-Type', 'application/xml');
          ctx.res.end(suc);
          // padchatapp.Sns();
        } else {
          var realcontent = await wechatmethod.getMsgListForGXH(
            result.xml.Content
          );
          var as = '';
          console.log(realcontent.length);
          if (realcontent.length > 15) {
            realcontent = realcontent.slice(0, 10);
          }
          realcontent.forEach(item => {
            as += '\r\n' + item.jsonData.msg + '\r\n';
          });
          as = as + '\r\n' + '更多拼车消息请访问' + '\r\n' + 'www.imeasy.cn';
          wxgzhmethod.msg = as;
          ctx.req.body = result;
        }
      })
      .catch(e => {
        e.status = 400;
      });
    next();
  } else {
    await next();
  }
});
module.exports = router;
