class UerController{
    static async register(ctx){
        ctx.body = {
            title: 'test unit'
          }
    }
    static async login(ctx){
        ctx.body = {
            title: '登陆成功'
          }
    }
}
module.exports = UerController
