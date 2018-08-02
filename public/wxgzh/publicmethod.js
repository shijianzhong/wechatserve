var request = require('request');
const xml2js = require('xml2js')
const crypto = require('crypto')
class MPController {

    static auth(ctx) {
        const token = 'mywxtoken',
            signature = ctx.query.signature,
            timestamp = ctx.query.timestamp,
            nonce = ctx.query.nonce
        // 字典排序
        const arr = [token, timestamp, nonce].sort()
        const sha1 = crypto.createHash('sha1')
        sha1.update(arr.join(''))
        const result = sha1.digest('hex')
        if (result === signature) {
            return true
        } else {
            return false
        }
    }
    static message(msg, content) {
        return MPController.jsonToXml({
            xml: {
                ToUserName: msg.FromUserName,
                FromUserName: msg.ToUserName,
                CreateTime: Date.now(),
                MsgType: msg.MsgType,
                Content: content
            }
        })
    }
    static getAccessToken() {
        return new Promise((resolve, reject) => {
            request(`https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=wxe930e462d424515a
            &secret=6c2a4e29d033fdbfaede25046dfac2e3`,
                (error, response, body) => {
                    if (!error && response.statusCode == 200) {
                        resolve(body)
                    }
                })
        })
    }
    static sendMsg(token,requestData){
		var url ="https://api.weixin.qq.com/cgi-bin/message/custom/send?access_token="+token;
		console.log(url)        
		return new Promise((resolve,reject)=>{
			request({
				url: url,
				method: "POST",
				json: true,
				headers: {
					"content-type": "application/json",
				},
				body: JSON.stringify(requestData)
		}, (error, response, body)=> {
				if (!error && response.statusCode == 200) {
					console.log(body) // 请求成功的处理逻辑
				}
				console.log(response)
			}	
		)})
	}
    static xmlToJson(str) {
        return new Promise((resolve, reject) => {
            const parseString = xml2js.parseString
            parseString(str, (err, result) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(result)
                }
            })
        })
    }
    static jsonToXml(obj) {
        const builder = new xml2js.Builder()
        return builder.buildObject(obj)
    }
}
MPController.pbmsg=""
MPController.msg=""
MPController.accesstoken = ""
module.exports = MPController