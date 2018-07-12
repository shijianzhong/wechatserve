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

var padchatapp = {
    app: wx,
    router: router
}
module.exports = padchatapp;