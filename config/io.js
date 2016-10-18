/**
 * Created by Liuwei on 2016/9/21.
 */
require("./cache");

var name = "who",
    pass = "xxxx";
var timer = null;
var t = 5000;

module.exports = function (io) {
    io.on('connection', function (socket) {
        //对请求连接进行登陆验证
        socket.emit("login");
        socket.on("userLogin", function (data) {
            //获得客户端发来的验证账号、密码
            if (data.name == name && data.pass == pass) {
                //console.log("验证通过");
                socket.on("getData", function (Obj) {
                    try {
                        var deviceDataArry = Obj.deviceDataArry.siteNumArry;
                        var allDeviceDataArry = Obj.allDeviceDataArry.siteNumArry;
                    } catch (err) {

                    }

                    //客户端传的 设备 ID   数组
                    update();
                    clearInterval(timer);
                    timer = setInterval(update, t);//间隔5s 发送
                    function update() {
                        socket.emit('data', send(deviceDataArry)); //要反复执行的是emit
                        socket.emit('allData', send(allDeviceDataArry)); //要反复执行的是emit
                    }


                    function send(deviceIDArry) {
                        return (function () {
                            var len = deviceIDArry.length;
                            var dataTemp = {};
                            if (len > 0) {
                                for (var i = 0; i < len; i++) {
                                    dataTemp[deviceIDArry[i]] = JSON.parse(GLOBAL_CACHE.get(deviceIDArry[i]));
                                    if (i == len - 1) {
                                        return dataTemp
                                    }
                                }
                            }
                        })()
                    }
                });

                socket.on("set", function (newData) {
                    try {
                        var str = JSON.stringify(newData);
                        var len = str.length;
                        var dataStrLen = preZeroFill(len, 4);
                        nodeServer.write('[START' + dataStrLen + ']' + str + '[END]');   // server login
                        socket.emit('msg', "true"); //要反复执行的是emit
                        //补0模块
                        function preZeroFill(num, size) {
                            if (num >= Math.pow(10, size)) { //如果num本身位数不小于size位
                                return num.toString();
                            } else {
                                var _str = Array(size + 1).join('0') + num;
                                return _str.slice(_str.length - size);
                            }
                        }
                    } catch (err) {
                        socket.emit('msg', "false"); //要反复执行的是emit
                    }
                });

                socket.on("levels", function (deviceIDArry) {
                    global.levelsTimer = setInterval(update, 200);//间隔200ms 发送
                    function update() {
                        socket.emit('levels', getData(deviceIDArry.deviceIDArry)); //要反复执行的是emit
                    }

                    function getData(deviceIDArry) {
                        //return GLOBAL_CACHE.get('levels_' + deviceID);
                        return (function () {
                            var len = deviceIDArry.length;
                            var dataTemp = {};
                            if (len > 0) {
                                for (var i = 0; i < len; i++) {
                                    dataTemp[deviceIDArry[i]] = GLOBAL_CACHE.get('levels_' + deviceIDArry[i]) ? GLOBAL_CACHE.get('levels_' + deviceIDArry[i]) : "";
                                    if (i == len - 1) {
                                        return dataTemp
                                    }
                                }
                            }
                        })()
                    }
                });

            } else {
                console.log("验证失败");
                socket.disconnect();
            }
        });
    });

};