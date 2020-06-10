var request = require('request');
class WechatMethod {

    static   mLogin() {
         request.post({
            url: 'https://api.it120.cc/login/mobile/v2',
            formData: {
                deviceId: '12313',
                deviceName: '231313',
                mobile: '',
                pwd: ''
            }
        }, function (error, response, body) {

            
            if (!error && response.statusCode == 200) { }
        })
    }
    static getMsgList(page) {
        this.mLogin()
        return new Promise((resolve, reject) => {
            request('https://api.it120.cc/360mall/json/list?page=' + page, (error, response, body) => {
                if (!error && response.statusCode == 200) {
                    resolve(body)
                }
            })
        })
    }
    // dateAdd":"2018-07-12 15:10:04","dateUpdate":"2018-07-12 15:10:33"
    static getMsgListForGXH(keywords) {
        return new Promise((resolve, reject) => {
            request('https://api.it120.cc/360mall/json/list?page=1&pageSize=400', (error, response, body) => {
                if (!error && response.statusCode == 200) {
                    let lsmonth = new Date().getMonth() + 1;
                    let month = lsmonth.toString().length == 1 ? `0${lsmonth}` : lsmonth;

                    let lsdate = new Date().getDate();
                    let dt = lsdate.toString().length == 1 ? `0${lsdate}` : lsdate;

                    var str = `${new Date().getFullYear()}-${month}-${dt}`
                    let resul = JSON.parse(body);
                    var newresul;
                    if (resul.code == 0) {
                        newresul = resul.data.filter(item => {
                            if (item.dateUpdate) {
                                if ((item.dateUpdate.split(' ')[0] == str) && (item.jsonData.msg.indexOf(keywords) > -1)) {
                                    return true
                                }
                                return false
                            } else {
                                if (item.jsonData.msg) {
                                    if ((item.dateAdd.split(' ')[0] == str) && (item.jsonData.msg.indexOf(keywords) > -1)) {
                                        return true
                                    }
                                }
                                return false
                            }

                        })
                    }

                    resolve(newresul)
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
        request('https://api.it120.cc/360mall/json/delete?id=' + id, function (error, response, body) { })
    }
    static postData(postadta) {
        request.post({
            url: 'https://api.it120.cc/360mall/json/set',
            formData: postadta
        }, function (error, response, body) {
            if (!error && response.statusCode == 200) { }
        })
    }
    static sendMsg(text, desp) {
        request.post({
            url: 'https://sc.ftqq.com/SCU2156eef0adb0.send',
            formData: {
                text: text,
                desp: desp
            }
        }, function (error, response, body) {
            if (!error && response.statusCode == 200) { }
        })
    }
}
module.exports = WechatMethod;