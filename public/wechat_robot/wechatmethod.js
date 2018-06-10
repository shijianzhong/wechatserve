var request = require('request');
class WechatMethod {
    static getMsgList(page) {
        return new Promise((resolve, reject) => {
            request('https://api.it120.cc/360mall/json/list?page=' + page, (error, response, body) => {
                if (!error && response.statusCode == 200) {
                    resolve(body)
                }
            })
        })
    }
    static getInfoList() {
        return new Promise((resolve, reject) => {
            request('https://api.it120.cc/360mall/json/list', (error, response, body) => {
                if (!error && response.statusCode == 200) {
                    var msgMap = new Map();
                    let resul = JSON.parse(body);
                    if (resul.code == 0) {
                        resul.data.forEach(item => {
                            msgMap.set(item.jsonData.author, item.id)
                        })
                    }
                    resolve(msgMap);
                }
            })
        })
    }
    static deleteInfo(id) { //删除数据
        request('https://api.it120.cc/360mall/json/delete?id=' + id, function(error, response, body) {})
    }
    static postData(postadta) {
        request.post({
            url: 'https://api.it120.cc/360mall/json/set',
            formData: postadta
        }, function(error, response, body) {
            if (!error && response.statusCode == 200) {}
        })
    }
    static sendMsg(text, desp) {
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
}
module.exports = WechatMethod;