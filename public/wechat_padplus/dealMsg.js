const api1 = require('../../server/api')
const one = ['车寻人', '车找人', '找人', '寻人', '满人', '满车', '车满', '人满'];
const two = ['人寻车', '人找车', '找车', '寻车', '找个车']
class dealMsg {

    async collectMsg(m) {
        const contact = m.from() //发送人
        const content = m.text() //内容
        const room = m.room() //群  room.topic()
        const tels = content.match(/((((13[0-9])|(15[^4])|(18[0,1,2,3,5-9])|(17[0-8])|(147))\d{8})|((\d3,4|\d{3,4}-|\s)?\d{7,14}))?/g)
        const tel = tels.filter((x) => {
            if (x) {
                return x
            }
        })
        let sex = "无"
        // const file = await contact.avatar()
        // var imgtype = file.name.split('.')
        // var name = file.name
        // if (imgtype.length > 1) {
        //     name = `./images/${contact.id}.${imgtype[imgtype.length - 1]}`
        // }
        // await file.toFile(name, true)
        if (room) {
            var contet = null;
            one.forEach(item => {
                if (content.indexOf(item) > -1) {
                    contet = {
                        type: 1,
                        author: contact.name(),
                        wxid: contact.id,
                        msg: content.replace(/(<img.*?)>/gi, ''),
                        tel: tel[0],
                        gender: sex,
                        headimg: ''
                    }
                }
            })
            two.forEach(item => {
                if (content.indexOf(item) > -1) {
                    contet = {
                        type: 2,
                        author: contact.name(),
                        wxid: contact.id,
                        msg: content.replace(/(<img.*?)>/gi, ''),
                        tel: tel[0],
                        gender: sex,
                        headimg: ''
                    }
                }
            })
            if (contet) {
                // wechatmethod.sendMsg(contact.name(), content) //发送日志
                // let postdata = {
                //     content: JSON.stringify(contet),
                //     type: 1
                // };
                api1.insertInfo(contet)
                // msgMap = await wechatmethod.getInfoList();
                // if (msgMap.has(contact.name())) {
                //     postdata['id'] = msgMap.get(contact.name());
                // }
                // wechatmethod.postData(postdata);
            }
        } else {
            if (contact.name() != "Sking") { }
        }
    }
}
module.exports = dealMsg