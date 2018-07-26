const padch = require('./padchatcontroller')
const htmlqrcode = require('qrcode')
class UerController{
    static async register(ctx){
        ctx.body = {
            title: 'test unit'
          }
    }
    static async login(ctx){
        await ctx.render('wxcode',{
            title:await htmlqrcode.toDataURL(padch.padurl),
            hrf:'www.sharedrive.cn'
        })
    }
}
module.exports = UerController
