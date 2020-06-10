const config = require('./config.js')
const mysql = require('mysql2')

class api1 {
    static searchData() {
        return new Promise((resolve, reject) => {
            const connection = mysql.createConnection(config.mysqlDB);
            connection.query(
                'SELECT * FROM carinfo',
                function (err, results, fields) {
                    resolve(results)
                    console.log(results); // results contains rows returned by server
                    console.log(fields); // fields contains extra meta data about results, if available
                }
            );
            connection.end();
        })
    }
    //新增数据
    static insertInfo(data) {
        return new Promise((resolve, reject) => {
            const array = Object.values(data)
            const connection = mysql.createConnection(config.mysqlDB);
            api1.getMsgListForGXH('公园西门');
            connection.execute('INSERT INTO `carinfo` (type,author,wxid,msg,tel,gender,headimg) VALUES (?,?,?,?,?,?,?)', array, (er, results, fields) => {
                resolve(results)
            });
            connection.end();
        })
    }
    static dealDate(date){
        let resul = `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}`
        return resul;
    }
    
    static getMsgListForGXH(keywords) {
        api1.searchData().then(resul => {
            var str = api1.dealDate(new Date()) 
            var newresul;
            newresul = resul.filter(item => {
                if (item.dateUpdate) {
                    if ((api1.dealDate(item.dateUpdate) == str) && (item.jsonData.msg.indexOf(keywords) > -1)) {
                        return true
                    }
                    return false
                } else {
                    if (item.jsonData.msg) {
                        if ((api1.dealDate(item.dateUpdate) == str) && (item.jsonData.msg.indexOf(keywords) > -1)) {
                            return true
                        }
                    }
                    return false
                }

            })
        })

    }
}


module.exports = api1