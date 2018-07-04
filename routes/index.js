const router = require('koa-router')()
const userctrl = require('../public/controller/usercontroller')
const wechatapp =require('../public/wechat_robot/wechat')
const padch =require('../public/controller/padchatcontroller')
const htmlqrcode =require ('qrcode')
router.get('/', async (ctx, next) => {

  await ctx.render('wxcode', {
    title: await htmlqrcode.toDataURL(padch.padurl)
  })
})

router.get('/string', async (ctx, next) => {
  ctx.body = wechatapp.loginurl
})

router.get('/json', async (ctx, next) => {
  ctx.body = {
    title: 'koa2 json'
  }
})
router.get('/register',userctrl.register)

router.get('/login',userctrl.login)
module.exports = router
