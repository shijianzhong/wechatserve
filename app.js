const Koa = require('koa')
const cors = require('koa2-cors')
const app = new Koa()
const views = require('koa-views')
const json = require('koa-json')
const onerror = require('koa-onerror')
const bodyparser = require('koa-bodyparser')
const logger = require('koa-logger')
const { Wechaty, Room, Contact, MediaMessage } = require('wechaty')

const index = require('./routes/index')
// const receivemsg = require('./routes/receivemsg')
const users = require('./routes/users')
const wechatapp = require('./public/wechat_robot/wechat')
// const padchatapp = require('./public/padchat_robot/padchat')
// error handler
onerror(app)
/**
 * 若基于wechat则取消注释
 */
wechatapp.app.start();
// middlewares
app.use(cors({
    origin: function(ctx) {
        if (ctx.url === '/test') {
            return false;
        }
        return '*';
    },
    exposeHeaders: ['WWW-Authenticate', 'Server-Authorization'],
    maxAge: 5,
    credentials: true,
    allowMethods: ['GET', 'POST', 'DELETE'],
    allowHeaders: ['Content-Type', 'Authorization', 'Accept'],
}))
app.use(bodyparser({
    enableTypes: ['json', 'form', 'text']
}))
app.use(json())
app.use(logger())
app.use(require('koa-static')(__dirname + '/public'))

app.use(views(__dirname + '/views', {
    extension: 'pug'
}))

// logger
app.use(async(ctx, next) => {
    const start = new Date()
    await next()
    const ms = new Date() - start
    console.log(`${ctx.method} ${ctx.url} - ${ms}ms`)
})

// routes
// app.use(receivemsg.routes(), receivemsg.allowedMethods())
app.use(index.routes(), index.allowedMethods())
app.use(users.routes(), users.allowedMethods())
app.use(wechatapp.router.routes(), wechatapp.router.allowedMethods())

// error-handling
app.on('error', (err, ctx) => {
    console.error('server error', err, ctx)
});

module.exports = app