/**
 * 时间：2018年7月4日15:10:14
 * 作者：sking
 * padchat
 */
const Padchat = require('padchat-sdk')
const qrcode = require('qrcode-terminal')
const log4js = require('log4js')
const fs = require('fs')
const util = require('util')
const url = 'ws://52.80.34.207:7777'
const wx = new Padchat(url)
const router = require('koa-router')()
const pchatController = require('../controller/padchatcontroller');
var request = require('request');
try {
    require('fs').mkdirSync('./logs')
} catch (e) {
    if (e.code !== 'EEXIST') {
        console.error('Could not set up log directory, error: ', e)
        process.exit(1)
    }
}

try {
    log4js.configure('./log4js.json')
} catch (e) {
    console.error('载入log4js日志输出配置错误: ', e)
    process.exit(1);
}
const logger = log4js.getLogger('app')
const dLog = log4js.getLogger('dev')
try {
    const tmpBuf = fs.readFileSync('./config.json')
    const data = JSON.parse(String(tmpBuf))
    autoData.wxData = data.wxData
    autoData.token = data.token
    logger.info('载入设备参数与自动登陆数据：%o ', autoData)
} catch (e) {
    logger.warn('没有在本地发现设备登录参数或解析数据失败！如首次登录请忽略！')
}


logger.info('demo start!')

const autoData = {
    wxData: '',
    token: '',
}
let disconnectCount = 0 // 断开计数
let connected = false // 成功连接标志
router.prefix('/padchat')
wx
    .on('close', () => {
        // 根据是否成功连接过判断本次是未能连接成功还是与服务器连接中断
        if (connected) {
            connected = false
            disconnectCount++
            logger.info(`第 ${disconnectCount} 次与服务器连接断开！现在将重试连接服务器。`)
        } else {
            logger.debug(`未能连接服务器！将重试连接服务器。`)
        }
        // 重新启动websocket连接
        wx.start()
    })
    .on('open', async () => {
        let ret
        ret = await wx.init()
        if (!ret.success) {
            console.error('初始化失败! ret:', ret)
            return
        }
        console.log('初始化成功! ret:', ret)

        ret = await wx.login()
        if (!ret.success) {
            console.error('请求登录失败! ret:', ret)
            return
        }
        console.log('请求登录成功! ret:', ret)
    })
    .on('qrcode', data => {
        if (data.url) {

            console.log('登陆二维码url: %s ,请扫码登陆：', data.url)
            qrcode.generate(data.url)
            pchatController.padurl = data.url;
            return
        } else if (data.qrCode) {
            console.log('登陆二维码图片数据，请输出到文件扫码。')
            return
        }
        console.error('没有发现二维码数据!')
    })
    .on('scan', data => {
        switch (data.status) {
            case 0:
                console.log('等待扫码...', data)
                break;
            case 1:
                console.log('已扫码，请在手机端确认登陆...', data)
                break;
            case 2:
                switch (data.subStatus) {
                    case 0:
                        console.log('扫码成功！登陆成功！', data)
                        break;
                    case 1:
                        console.log('扫码成功！登陆失败！', data)
                        break;
                    default:
                        console.log('扫码成功！未知状态码！', data)
                        break;
                }
                break;
            case 3:
                console.log('二维码已过期', data)
                break;
            case 4:
                console.log('手机端已取消登陆！', data)
                break;
            default:
                break;
        }
    })
    .on('login', async () => {
        logger.info('微信账号登陆成功！')
        let ret

        ret = await wx.getMyInfo()
        logger.info('当前账号信息：', ret.data)

        // 主动同步通讯录
        await wx.syncContact()

        if (!autoData.wxData) {
            // 如果已经存在设备参数，则不再获取
            ret = await wx.getWxData()
            if (!ret.success) {
                logger.warn('获取设备参数未成功！ json:', ret)
                return
            }
            logger.info('获取设备参数成功, json: ', ret)
            Object.assign(autoData, {
                wxData: ret.data.wxData
            })
        }

        ret = await wx.getLoginToken()
        if (!ret.success) {
            logger.warn('获取自动登陆数据未成功！ json:', ret)
            return
        }
        logger.info('获取自动登陆数据成功, json: ', ret)
        Object.assign(autoData, {
            token: ret.data.token
        })

        // NOTE: 这里将设备参数保存到本地，以后再次登录此账号时提供相同参数
        fs.writeFileSync('./config.json', JSON.stringify(autoData, null, 2))
        logger.info('设备参数已写入到 ./config.json文件')
    })
    .on('logout', ({
        msg
    }) => {
        logger.info('微信账号已退出！', msg)
    })
    .on('over', ({
        msg
    }) => {
        logger.info('任务实例已关闭！', msg)
    })
    .on('loaded', () => {
        console.log('载入通讯录完成!')
    })
    .on('sns', (data, msg) => {
        logger.info('收到朋友圈事件！请查看朋友圈新消息哦！', msg)
    })
    .on('push', async data => {
        // 消息类型 data.mType
        // 1  文字消息
        // 2  好友信息推送，包含好友，群，公众号信息
        // 3  收到图片消息
        // 34  语音消息
        // 35  用户头像buf
        // 37  收到好友请求消息
        // 42  名片消息
        // 43  视频消息
        // 47  表情消息
        // 48  定位消息
        // 49  APP消息(文件 或者 链接 H5)
        // 50  语音通话
        // 51  状态通知（如打开与好友/群的聊天界面）
        // 52  语音通话通知
        // 53  语音通话邀请
        // 62  小视频
        // 2000  转账消息
        // 2001  收到红包消息
        // 3000  群邀请
        // 9999  系统通知
        // 10000  微信通知信息. 微信群信息变更通知，多为群名修改，进群，离群信息，不包含群内聊天信息
        // 10002  撤回消息
        // --------------------------------
        // 注意，如果是来自微信群的消息，data.content字段中包含发言人的wxid及其发言内容，需要自行提取
        // 各类复杂消息，data.content中是xml格式的文本内容，需要自行从中提取各类数据。（如好友请求）
        if ((data.mType !== 2) && !(data.mType === 10002 && data.fromUser === 'weixin')) {
            // 输出除联系人以外的推送信息
            dLog.info('push: \n%o', data)
        }
        let rawFile
        switch (data.mType) {
            case 2:
                logger.info('收到推送联系人：%s - %s', data.userName, data.nickName)
                break

            case 3:
                logger.info('收到来自 %s 的图片消息，包含图片数据：%s，xml内容：\n%s', data.fromUser, !!data.data, data.content)
                rawFile = data.data || null
                logger.info('图片缩略图数据base64尺寸：%d', rawFile.length)
                await wx.getMsgImage(data)
                    .then(ret => {
                        rawFile = ret.data.image || ''
                        logger.info('获取消息原始图片结果：%s, 获得图片base64尺寸：%d', ret.success, rawFile.length)
                    })
                logger.info('图片数据base64尺寸：%d', rawFile.length)
                await wx.sendImage('filehelper', rawFile)
                    .then(ret => {
                        logger.info('转发图片信息给 %s 结果：', 'filehelper', ret)
                    })
                    .catch(e => {
                        logger.warn('转发图片信息异常:', e.message)
                    })
                break

            case 43:
                logger.info('收到来自 %s 的视频消息，包含视频数据：%s，xml内容：\n%s', data.fromUser, !!data.data, data.content)
                rawFile = data.data || null
                if (!rawFile) {
                    await wx.getMsgVideo(data)
                        .then(ret => {
                            rawFile = ret.data.video || ''
                            logger.info('获取消息原始视频结果：%s, 获得视频base64尺寸：%d', ret.success, rawFile.length)
                        })
                }
                logger.info('视频数据base64尺寸：%d', rawFile.length)
                break

            case 1:
                if (data.fromUser === 'newsapp') { // 腾讯新闻发的信息太长
                    break
                }
                logger.info('收到来自 %s 的文本消息：', data.fromUser, data.description || data.content)
                if (/ding/.test(data.content)) {
                    await wx.sendMsg(data.fromUser, 'dong. receive:' + data.content)
                        .then(ret => {
                            logger.info('回复信息给%s 结果：', data.fromUser, ret)
                        })
                        .catch(e => {
                            logger.warn('回复信息异常:', e.message)
                        })
                } else if (/^#.*/.test(data.content) || /^[\w]*:\n#.*/.test(data.content)) {
                    await onMsg(data)
                        .catch(e => {
                            logger.warn('处理信息异常：', e)
                        })
                }
                break

            case 34:
                logger.info('收到来自 %s 的语音消息，包含语音数据：%s，xml内容：\n%s', data.fromUser, !!data.data, data.content)
                // 超过30Kb的语音数据不会包含在推送信息中，需要主动拉取
                rawFile = data.data || null
                if (!rawFile) {
                    // BUG: 超过60Kb的语音数据，只能拉取到60Kb，也就是说大约36~40秒以上的语音会丢失后边部分语音内容
                    await wx.getMsgVoice(data)
                        .then(ret => {
                            rawFile = ret.data.voice || ''
                            logger.info('获取消息原始语音结果：%s, 获得语音base64尺寸：%d，拉取到数据尺寸：%d', ret.success, rawFile.length, ret.data.size)
                        })
                }
                logger.info('语音数据base64尺寸：%d', rawFile.length)
                if (rawFile.length > 0) {
                    let match = data.content.match(/length="(\d+)"/) || []
                    const length = match[1] || 0
                    match = data.content.match(/voicelength="(\d+)"/) || []
                    const ms = match[1] || 0
                    logger.info('语音数据语音长度：%d ms，xml内记录尺寸：%d', ms, length)

                    await wx.sendVoice('filehelper', rawFile, ms)
                        .then(ret => {
                            logger.info('转发语音信息给 %s 结果：', 'filehelper', ret)
                        })
                        .catch(e => {
                            logger.warn('转发语音信息异常:', e.message)
                        })
                }
                break

            case 49:

                if (data.content.indexOf('<![CDATA[微信红包]]>') > 0) {
                    logger.info('收到来自 %s 的红包：', data.fromUser, data)
                    await wx.queryRedPacket(data)
                        .then(ret => {
                            logger.info('未领取，查询来自 %s 的红包信息：', data.fromUser, ret)
                        })
                        .catch(e => {
                            logger.warn('未领取，查询红包异常:', e.message)
                        })
                    await wx.receiveRedPacket(data)
                        .then(async ret => {
                            logger.info('接收来自 %s 的红包结果：', data.fromUser, ret)
                            await wx.openRedPacket(data, ret.data.key)
                                .then(ret2 => {
                                    logger.info('打开来自 %s 的红包结果：', data.fromUser, ret2)
                                })
                                .catch(e => {
                                    logger.warn('打开红包异常:', e.message)
                                })
                            await wx.queryRedPacket(data)
                                .then(ret => {
                                    logger.info('打开后，查询来自 %s 的红包信息：', data.fromUser, ret)
                                })
                                .catch(e => {
                                    logger.warn('打开后，再次查询红包异常:', e.message)
                                })
                        })
                        .catch(e => {
                            logger.warn('接收红包异常:', e.message)
                        })
                } else if (data.content.indexOf('<![CDATA[微信转账]]>') > 0) {
                    logger.info('收到来自 %s 的转账：', data.fromUser, data)
                    await wx.queryTransfer(data)
                        .then(ret => {
                            logger.info('查询来自 %s 的转账信息：', data.fromUser, ret)
                        })
                        .catch(e => {
                            logger.warn('查询转账异常:', e.message)
                        })
                    await wx.acceptTransfer(data)
                        .then(ret => {
                            logger.info('接受来自 %s 的转账结果：', data.fromUser, ret)
                        })
                        .catch(e => {
                            logger.warn('接受转账异常:', e.message)
                        })
                    await wx.queryTransfer(data)
                        .then(ret => {
                            logger.info('接受后，查询来自 %s 的转账信息：', data.fromUser, ret)
                        })
                        .catch(e => {
                            logger.warn('接受后，查询转账异常:', e.message)
                        })
                } else {
                    logger.info('收到一条来自 %s 的appmsg富媒体消息：', data.fromUser, data)
                }
                break
            case 10000:

                break
            case 10002:
                if (data.fromUser === 'weixin') {
                    //每次登陆，会收到一条系统垃圾推送，过滤掉
                    break
                }
                logger.info('用户 %s 撤回了一条消息：', data.fromUser, data)
                await wx.sendMsg(data.fromUser, '你的撤回消息已被记录')
                break

            default:
                logger.info('收到推送消息：', data)
                break
        }
    })
    .on('error', e => {
        logger.error('ws 错误:', e.message)
    })
    .on('warn', e => {
        logger.error('任务出现错误:', e.message)
    })
    .on('cmdRet', (cmd, ret) => {
        //捕捉接口操作结果，补充接口文档用
        dLog.info('%s ret: \n%s', cmd, util.inspect(ret, {
            depth: 10
        }))
    })

async function onMsg(data) {
    const content = data.content.replace(/^[\w:\n]*#/m, '')
    let [cmd, ...args] = content.split('\n')

    args = args.map(str => {
        try {
            str = JSON.parse(str)
        } catch (e) {}
        return str
    })
    if (cmd && wx[cmd] && typeof wx[cmd] === 'function') {
        logger.info('执行函数 %s，参数：', cmd, args)
        await wx[cmd](...args)
            .then(ret => {
                logger.info('执行函数 %s 结果：%o', cmd, ret)
            })
            .catch(e => {
                logger.warn('执行函数 %s 异常：', e)
            })
    }
}
process.on('uncaughtException', e => {
    logger.error('Main', 'uncaughtException:', e)
})

process.on('unhandledRejection', e => {
    logger.error('Main', 'unhandledRejection:', e)
})
var padchatapp = {
    app: wx,
    router: router
}
module.exports = padchatapp;