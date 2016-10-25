/**
 * Created by Liuwei on 2016/10/24.
 * 定时、周期调用方法创建音频存放目录
 */
var SM = require('../app/server/modules/site-manager');

var fs = require("fs");
var path = require("path");
var schedule = require('node-schedule');
var moment = require('moment');
moment.locale('zh-cn');

//定时任务
var j = schedule.scheduleJob({hour: 23, minute: 30}, function () {
    console.log("It's time to create audioData files...");
    createAudioDataFiles();
});

//创建音频目录文件
function createAudioDataFiles() {
    //获取Tag列表
    SM.getAllDevicesTagRecords(function (err, result) {
        if (err) {
            console.log(err)
        } else {
            if (result) {
                var RegisterTagIDs = result[0].RegisterTagID;   //tags列表数组

                var dateStrToday = moment().format('YYYYMMDD');
                var dateStrTomorrow = moment().add(1, 'days').format('YYYYMMDD');

                //console.log(dateStrToday);
                //console.log(dateStrTomorrow);

                for (var i = 0; i < RegisterTagIDs.length; i++) {
                    var tag = RegisterTagIDs[i];
                    var dest0 = "../shanxi/app/public/historicalAudioData/" + tag + "/" + dateStrToday + "/";
                    var dest1 = "../shanxi/app/public/historicalAudioData/" + tag + "/" + dateStrTomorrow + "/";

                    mkdirs(dest0, "0777", function (err) {
                        if (err) {
                            console.log(err);
                        } else {
                            console.log("creat done!");
                        }
                    });

                    mkdirs(dest1, "0777", function (err) {
                        if (err) {
                            console.log(err);
                        } else {
                            console.log("creat done!");
                        }
                    });

                }

            } else {
                console.log("数据库中无tag信息!")
            }
        }
    })
}

//递归创建目录 异步方法
function mkdirs(dirname, mode, callback) {
    fs.exists(dirname, function (exists) {
        if (exists) {
            callback();
        } else {
            console.log(path.dirname(dirname));
            mkdirs(path.dirname(dirname), mode, function () {
                fs.mkdir(dirname, mode, callback);
            });
        }
    });
}
