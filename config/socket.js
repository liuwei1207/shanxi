/**
 * Created by Liuwei on 2016/9/19.
 */
var ARM = require('../app/server/modules/alertRules-manager');

var net = require('net');
var moment = require('moment');
var config = require("./config");
require("./cache");

var HOST = config.tcpSocket.HOST;
var PORT = config.tcpSocket.PORT;
var HOST2 = config.tcpSocket.HOST2;
var PORT2 = config.tcpSocket.PORT2;

global.nodeServer = new net.Socket();       //实时数据通道
var nodeServer2 = new net.Socket();     //实时音频通道

var waitTime = 5; //min无数据清空缓存
var timer = 5; //重连时间
var n = 0;  //重连计数器


/* ********************************************** nodeServer1 **************************************************** */

//负责实时数据和下发设置

var splicingDataCacheObj = {}; //拼接数据缓存
var Cmoment = null;//用来给处理程序传递时间戳标记
var countNum = null;//处理完的可用数据计数器
var retry = null;//重置定时器

nodeServer.connect(PORT, HOST, function () {
    console.log('CONNECTED TO: ' + HOST + ':' + PORT);
    // 建立连接后立即向服务器发送数据，服务器将收到这些数据
    nodeServer.write('[START0043]{"type":"login","login":"who","pwd":"xxxx"}[END]');   // server login
});

// 为客户端添加"data"事件处理函数
// dataPackage是服务器发回的数据 , 1包！
nodeServer.on('data', function (dataPackage) {
    //这里对收到每一个片段包的数据进行处理
    try {
        splicingRealDataPackage(dataPackage.toString());
    } catch (err) {
        console.log("处理程序异常 ：");
        console.log(err);
        console.log(dataPackage);
    }

    //// 完全关闭连接
    //nodeServer.destroy();
});

//设置超时时间
nodeServer.setTimeout(1000 * 60 * waitTime, function () {
    console.log('客户端在' + waitTime + 'min内未通信，将断开连接...');
});

//监听到超时事件，断开连接
nodeServer.on('timeout', function () {
    nodeServer.end();
});

// 为客户端添加"close"事件处理函数
nodeServer.on('close', function (had_error) {
    console.log('Connection closed ' + had_error);
    retry = setInterval(reconnectToTcpSocketServer, 1000 * timer);
});

// 当 socket 另一端发送 FIN 包时，触发该事件。
nodeServer.on('end', function () {
    console.log('断开与服务器的连接');
});

// 捕捉客户端的异常
nodeServer.on('error', function (err) {
    if (err) {
        try {
            console.log("【错误】socket异常关闭" + err);
            clearInterval(retry);
            nodeServer.end();
            nodeServer.destroy()
        } catch (err) {
            console.log("【错误】socket服务异常关闭" + err)
        }
    }
});

//tcp socket 断线重连
function reconnectToTcpSocketServer() {
    nodeServer.connect(PORT, HOST, function () {
        clearInterval(retry);
        ++n;
        console.log(n);
        console.log('RE-CONNECTED TO: ' + HOST + ':' + PORT);
        // 建立连接后立即向服务器发送数据，服务器将收到这些数据
        nodeServer.write('[START0043]{"type":"login","login":"who","pwd":"xxxx"}[END]');   // server login
    });

    //设置超时时间
    nodeServer.setTimeout(1000 * 60 * waitTime, function () {
        console.log('客户端在' + waitTime + 'min内未通信，将断开连接...');
    });

//监听到超时事件，断开连接
    nodeServer.on('timeout', function () {
        nodeServer.end();
    });
}

//数据拼接程序
function splicingRealDataPackage(dataPackageStr) {


//一包数据，包含起始符与结束符， 那可以确定这是一包完整数据!

//探测到起始位， 那可以确定这是第一包数据!
    if (isStartPackage(dataPackageStr)) {

        //探测到结束位, 判断是否为一包完整数据
        if (isEndPackage(dataPackageStr)) {

            //console.log("这是一包完整数据!");

            Cmoment = +new Date(); //每一包完整数据， 重置时间戳标记!
            splicingDataCacheObj[Cmoment] = {}; //设置为对象
            splicingDataCacheObj[Cmoment].value = dataPackageStr;

            var result1 = splicingDataCacheObj[Cmoment].value;  //合并后的最终数据！

            //这里对拼接的数据做长度检测， 验证通过， 送入缓存模块， 验证失败抛弃数据
            testDataLength(result1);

        } else {

            //console.log("这是第一包数据!");

            Cmoment = +new Date(); //每一包新数据， 重置时间戳标记!
            splicingDataCacheObj[Cmoment] = {}; //设置为对象
            splicingDataCacheObj[Cmoment]._length = dataPackageStr.match(/^\[(START)\d{4}\]/)[0].match(/\d{4}/)[0];     //设置数字长度
            splicingDataCacheObj[Cmoment].value = dataPackageStr;
        }
    }
    //一包数据只包含结束位， 那可以确定这是最后一包数据
    else if (isEndPackage(dataPackageStr)) {

        //console.log("这是最后一包数据!");

        splicingDataCacheObj[Cmoment].value += dataPackageStr;

        var result2 = splicingDataCacheObj[Cmoment].value;  //合并后的最终数据！
        //删除该处理程序分支 - 释放内存空间
        delete splicingDataCacheObj[Cmoment];

        //这里对拼接的数据做长度检测， 验证通过， 送入缓存模块， 验证失败抛弃数据
        testDataLength(result2);

    } else {
        //console.log("这是中间的数据包!!");

        try {
//判断该时间戳下的初始处理程序是否存在， 如果存在说明处理正常， 将中间数据包拼接进处理程序， 如不存在， 则代表丢失带[STARTxxxx]的起始包， 则丢弃该数据包!

            if (splicingDataCacheObj[Cmoment]) {
                splicingDataCacheObj[Cmoment].value += dataPackageStr;
            }
        } catch (err) {
            //丢弃该包数据， 即对该数据包不做任何处理
            console.log("在一包完整数据化， 未收到带[STARTxxxx]起始位的数据包！ 该包数据丢弃：");
            console.log(dataPackageStr)
        }
    }


    //正则判断一个数据包是否为第一包
    function isStartPackage(dataPackage) {
        var Reg = /^\[(START)\d{4}\]/;
        return Reg.test(dataPackage);
    }

    //正则判断一个数据包是否为最后一包
    function isEndPackage(dataPackage) {
        var Reg = /\[END\]$/;
        return Reg.test(dataPackage);
    }

    //校验数据长度， 验证通过送入缓存模块， 验证失败丢弃数据

    function testDataLength(result) {
        if (result._length = result.length) {
            //console.log("数据长度与预设长度相同， 保留数据， 送入testDataType!")
            testDataType(result);  //检查数据类型
        } else {
            console.log("数据设置长度 " + result._length + " 与拼接后的实际长度 " + result.length + " 不符， 该条数据丢弃！");
            console.log(result);
        }
    }

    function testDataType(dataStr) {
        //去掉标识位置， 获得最终数据！
        var _finalResult = dataStr.replace(/^\[(START)\d{4}\]/, "").replace(/\[END\]$/, "");
        var _finalResultObj = JSON.parse(_finalResult);

        //获得数据的json对象 -- 已准备接受type类型检查
        var _type = _finalResultObj.type;

        if (_type === "heartBeat") {
            //这是心跳
            //console.log("这是心跳");
            //收到心跳包， 就立即回送一包心跳包;
            sendAResponsePackage();

        } else if (_type === "deviceData") {
            //这是实时数据
            //console.log("这是实时数据")
            //console.log("共计收到： " + countNum + " 条完整的socket数据");
            alertVerification(_finalResultObj);
        } else if (_type === "levels") {
            //这是音频彩条
            //console.log("这是音频彩条")
            audioLevels(_finalResultObj);
        }


    }


    //接收到心跳包， 则回送响应包
    function sendAResponsePackage() {
        nodeServer.write('[START0039]{"type":"heartBeat","keepAlive":"true"}[END]');   // server login
    }

    //报警规则模块
    function alertVerification(_finalResultObj) {
        var _deviceDataObj = _finalResultObj.deviceData;
        var deviceID = _finalResultObj.deviceID;

        //通过设备ID 查找对应的 报警规则!
        ARM.getAlertRulesByDeviceID(deviceID, function (err, res) {

            if (err) {
                console.log(err)
            } else {

                addAlertRules(res[0]);   //将查询出来的报警规则与最终数据集合组合

                function addAlertRules(alertRulesObj) {
                    if (alertRulesObj) {
                        var len = Object.getOwnPropertyNames(alertRulesObj).length;

                        var i = 1;


                        var normal = 1;   //正常
                        var warning = 2;   //警告
                        var danger = 3;   //异常
                        var offline = 4;   //掉线

                        for (var key in _deviceDataObj) {

                            if (alertRulesObj.hasOwnProperty(key)) {
                                try {
                                    //从报警规则 对象中 获取对应key的报警规则， 数组的第一位是min ，  第二位是max

                                    var value = parseFloat(_deviceDataObj[key].value);
                                    var min = parseFloat(alertRulesObj[key].value[0]);
                                    var max = parseFloat(alertRulesObj[key].value[1]);

                                    if (len == i) {
                                        if (value >= min && value <= max) {
                                            //console.log("正常");
                                            _finalResultObj.deviceData[key].alarmStatus = normal;
                                            //等待循环结束后， 将带有参数是否报警的状态值集合送入缓存！

                                            var _finalResultStr = JSON.stringify(_finalResultObj);
                                            var expire = 1000 * 60 * 5; //5分钟没数据 即清空缓存， 页面可以直观得到显示！

                                            //此处为写入缓存模块代码
                                            GLOBAL_CACHE.set(deviceID, _finalResultStr, expire);
                                            addDataToHistoricalDatabase(_finalResultObj);  //写入数据库
                                            countNum++; //接收计数器+1
                                            //console.log(countNum);
                                        } else {
                                            //console.log("超出范围");
                                            _finalResultObj.deviceData[key].alarmStatus = danger;
                                            //等待循环结束后， 将带有参数是否报警的状态值集合送入缓存！

                                            var _finalResultStr = JSON.stringify(_finalResultObj);
                                            var expire = 1000 * 60 * 5; //5分钟没数据 即清空缓存， 页面可以直观得到显示！

                                            //此处为写入缓存模块代码
                                            GLOBAL_CACHE.set(deviceID, _finalResultStr, expire);
                                            addDataToHistoricalDatabase(_finalResultObj);  //写入数据库
                                            countNum++; //接收计数器+1
                                            //console.log(countNum);

                                            _finalResultStr = null;//释放内存
                                        }
                                    } else {
                                        if (value >= min && value <= max) {
                                            //console.log("正常");
                                            _finalResultObj.deviceData[key].alarmStatus = normal;
                                            i++;
                                        } else {
                                            //console.log("超出范围");
                                            _finalResultObj.deviceData[key].alarmStatus = danger;
                                            i++;
                                        }
                                    }


                                } catch (err) {
                                    console.log(err);
                                }
                            }
                        }
                    } else {
                        console.log("报警规则未配置!");

                        //不进行报警规则验证， 直接添加到缓存！
                        var _finalResultStr = JSON.stringify(_finalResultObj);


                        //此处为写入缓存模块代码
                        GLOBAL_CACHE.set(deviceID, _finalResultStr, expire);

                        addDataToHistoricalDatabase(_finalResultObj);  //写入数据库
                    }

                    //
                    //写入数据库
                    function addDataToHistoricalDatabase(data) {
                        ARM.addDataToHistoricalDatabase(data);
                    }
                }
            }
        });
    }

    //彩条处理模块
    function audioLevels(_finalResultObj) {
        var levels = _finalResultObj.levels;
        var deviceID = _finalResultObj.deviceID;
        var expire = 1000 * 60 * 5; //5分钟没数据 即清空缓存， 页面可以直观得到显示！

        //此处为写入缓存模块代码
        GLOBAL_CACHE.set('levels_' + deviceID, levels, expire);
        console.log(GLOBAL_CACHE.get('levels_' + deviceID))
    }
}


/* ********************************************** nodeServer2 **************************************************** */

//负责levels音频数据接收, 无设置下发;

var countNumLevels = null;//处理完的可用数据计数器
var TEMP = "";
var n = 0;  //音频报错计数器
var retryLevels = null;//重置定时器

nodeServer2.connect(PORT2, HOST2, function () {
    console.log('levels connect to: ' + HOST2 + ':' + PORT2);
    // 建立连接后立即向服务器发送数据，服务器将收到这些数据
    nodeServer2.write('[START0043]{"type":"login","login":"who","pwd":"xxxx"}[END]');   // server login
});

// 为客户端添加"data"事件处理函数
// dataPackage是服务器发回的数据 , 1包！
nodeServer2.on('data', function (dataPackage) {
    //这里对收到每一个片段包的数据进行处理
    splicingDataPackage(dataPackage.toString());
    if (TEMP) {
        splicingDataPackage(TEMP);
    }

    //// 完全关闭连接
    //nodeServer2.destroy();
});

//设置超时时间
nodeServer2.setTimeout(1000 * 60 * waitTime, function () {
    console.log('客户端在' + waitTime + 'min内未通信，将断开连接...');
});

//监听到超时事件，断开连接
nodeServer2.on('timeout', function () {
    nodeServer.end();
});

// 为客户端添加"close"事件处理函数
nodeServer2.on('close', function (had_error) {
    console.log('Connection closed ' + had_error);
    retryLevels = setInterval(reconnectToTcpSocketServer2, 1000 * timer);
});

// 当 socket 另一端发送 FIN 包时，触发该事件。
nodeServer2.on('end', function () {
    console.log('断开与服务器的连接');
});

// 捕捉客户端的异常
nodeServer2.on('error', function (err) {
    if (err) {
        try {
            console.log("【错误】socket异常关闭" + err);
            clearInterval(retryLevels);
            nodeServer2.end();
            nodeServer2.destroy()
        } catch (err) {
            console.log("【错误】socket服务异常关闭" + err)
        }
    }
});

//tcp socket 断线重连
function reconnectToTcpSocketServer2() {

    nodeServer2.connect(PORT2, HOST2, function () {
        clearInterval(retryLevels);
        console.log('levels connect to: ' + HOST2 + ':' + PORT2);
        // 建立连接后立即向服务器发送数据，服务器将收到这些数据
        nodeServer2.write('[START0043]{"type":"login","login":"who","pwd":"xxxx"}[END]');   // server login
    });

//设置超时时间
    nodeServer2.setTimeout(1000 * 60 * waitTime, function () {
        console.log('客户端在' + waitTime + 'min内未通信，将断开连接...');
    });

//监听到超时事件，断开连接
    nodeServer2.on('timeout', function () {
        nodeServer.end();
    });
}

//数据拼接程序
function splicingDataPackage(splicingDataPackage) {
    var arr = splicingDataPackage.match(/\[START\d{4}\][\s\S]*?\[END\]/g);
    if (arr) {

        //match 返回的是数组形式， 所以需要遍历
        for (var i = 0; i < arr.length; i++) {
            //获得了每一条完整数据！送入数据处理模块
            var _length = arr[i].match(/^\[(START)\d{4}\]/)[0].match(/\d{4}/)[0];   //预期字节长度
            var length = arr[i].length;//实际字节长度

            //解析后的字符串长度与预期相同！
            if (_length = length) {
                //送入type处理模块
                try {
                    testDataType(arr[i]);
                } catch (err) {
                    console.log(err);
                    console.log(n);
                }
            } else {
                //解析后的字符串长度与预期不同！
                console.log("解析后的字符串长度与预期不同!");
            }
        }
        TEMP += splicingDataPackage.replace(/\[START\d{4}\][\s\S]*?\[END\]/g, "");

    } else {

        TEMP = "";
        n++
    }

    function testDataType(dataStr) {
        //去掉标识位置， 获得最终数据！
        var _finalResult = dataStr.replace(/^\[(START)\d{4}\]/, "").replace(/\[END\]$/, "");
        var _finalResultObj = JSON.parse(_finalResult);

        //获得数据的json对象 -- 已准备接受type类型检查
        var _type = _finalResultObj.type;

        if (_type === "heartBeat") {
            //这是心跳
            //console.log("这是心跳");
            //收到心跳包， 就立即回送一包心跳包;
            sendAResponsePackage();

        } else if (_type === "deviceData") {
            //这是实时数据
            //console.log("这是实时数据")
            //console.log("共计收到： " + countNumLevels + " 条完整的socket数据");
            alertVerification(_finalResultObj);
        } else if (_type === "levels") {
            //这是音频彩条
            //console.log("这是音频彩条")
            audioLevels(_finalResultObj);
        }


    }

//接收到心跳包， 则回送响应包
    function sendAResponsePackage() {
        nodeServer2.write('[START0039]{"type":"heartBeat","keepAlive":"true"}[END]');   // server login
    }

//报警规则模块
    function alertVerification(_finalResultObj) {
        var _deviceDataObj = _finalResultObj.deviceData;
        var deviceID = _finalResultObj.deviceID;

        //通过设备ID 查找对应的 报警规则!
        ARM.getAlertRulesByDeviceID(deviceID, function (err, res) {

            if (err) {
                console.log(err)
            } else {

                addAlertRules(res[0]);   //将查询出来的报警规则与最终数据集合组合

                function addAlertRules(alertRulesObj) {
                    if (alertRulesObj) {
                        var len = Object.getOwnPropertyNames(alertRulesObj).length;

                        var i = 1;


                        var normal = 1;   //正常
                        var warning = 2;   //警告
                        var danger = 3;   //异常
                        var offline = 4;   //掉线

                        for (var key in _deviceDataObj) {

                            if (alertRulesObj.hasOwnProperty(key)) {
                                try {
                                    //从报警规则 对象中 获取对应key的报警规则， 数组的第一位是min ，  第二位是max

                                    var value = parseFloat(_deviceDataObj[key].value);
                                    var min = parseFloat(alertRulesObj[key].value[0]);
                                    var max = parseFloat(alertRulesObj[key].value[1]);

                                    if (len == i) {
                                        if (value >= min && value <= max) {
                                            //console.log("正常");
                                            _finalResultObj.deviceData[key].alarmStatus = normal;
                                            //等待循环结束后， 将带有参数是否报警的状态值集合送入缓存！

                                            var _finalResultStr = JSON.stringify(_finalResultObj);
                                            var expire = 1000 * 60 * 5; //5分钟没数据 即清空缓存， 页面可以直观得到显示！

                                            //此处为写入缓存模块代码
                                            GLOBAL_CACHE.set(deviceID, _finalResultStr, expire);
                                            addDataToHistoricalDatabase(_finalResultObj);  //写入数据库
                                            countNumLevels++; //接收计数器+1
                                            //console.log(countNumLevels);
                                        } else {
                                            //console.log("超出范围");
                                            _finalResultObj.deviceData[key].alarmStatus = danger;
                                            //等待循环结束后， 将带有参数是否报警的状态值集合送入缓存！

                                            var _finalResultStr = JSON.stringify(_finalResultObj);
                                            var expire = 1000 * 60 * 5; //5分钟没数据 即清空缓存， 页面可以直观得到显示！

                                            //此处为写入缓存模块代码
                                            GLOBAL_CACHE.set(deviceID, _finalResultStr, expire);
                                            addDataToHistoricalDatabase(_finalResultObj);  //写入数据库
                                            countNumLevels++; //接收计数器+1
                                            //console.log(countNumLevels);

                                            _finalResultStr = null;//释放内存
                                        }
                                    } else {
                                        if (value >= min && value <= max) {
                                            //console.log("正常");
                                            _finalResultObj.deviceData[key].alarmStatus = normal;
                                            i++;
                                        } else {
                                            //console.log("超出范围");
                                            _finalResultObj.deviceData[key].alarmStatus = danger;
                                            i++;
                                        }
                                    }


                                } catch (err) {
                                    console.log(err);
                                }
                            }
                        }
                    } else {
                        console.log("报警规则未配置!");

                        //不进行报警规则验证， 直接添加到缓存！
                        var _finalResultStr = JSON.stringify(_finalResultObj);


                        //此处为写入缓存模块代码
                        GLOBAL_CACHE.set(deviceID, _finalResultStr, expire);

                        addDataToHistoricalDatabase(_finalResultObj);  //写入数据库
                    }

                    //
                    //写入数据库
                    function addDataToHistoricalDatabase(data) {
                        ARM.addDataToHistoricalDatabase(data);
                    }
                }
            }
        });
    }

//彩条处理模块
    function audioLevels(_finalResultObj) {
        var levels = _finalResultObj.levels;
        var deviceID = _finalResultObj.deviceID;
        var expire = 1000 * 60 * 5; //5分钟没数据 即清空缓存， 页面可以直观得到显示！

        //此处为写入缓存模块代码
        GLOBAL_CACHE.set('levels_' + deviceID, levels, expire);
    }
}