var HM = require('../app/server/modules/historicalAudioData-manager.js');

var fs = require('fs');
var util = require('util');
var config = require("./config");
var chokidar = require('chokidar');
var _ = require("underscore")._;

var mp3File = config.historicalAudioDataPath;

var fileJsonTemp = {
    "time": ""
};

//存放前一次的文件目录， 以便比较获得改动过的文件目录！
var temp = {
    _temp1: [],
    _temp2: [],
    timer: null
};

/**
 * Created by Liuwei on 2016/9/26.
 * //监听历史音频文件的变化， 并生成相应的MP3文件列表以供页面使用
 */

// Initialize watcher.
var watcher = chokidar.watch(mp3File, {
    ignored: /[\/\\]\./,
    persistent: true
});

// Something to use when events are received.
var log = console.log.bind(console);

var setExplorer = null;

// Add event listeners.
watcher
    .on('ready', () => log('已经监听 historicalAudioData 目录下的文件变化！'))
    .on('add', function () {
        fileJsonTemp = {
            "time": ""
        };
        lazyRunout();
    });

var lazyRunout = _.debounce(function () {
    HM.clearMP3Souce(function (err, result) {
        if (err) {
            console.log(err)
        } else {
            explorer(mp3File);
        }
    });
}, 100);

/**
 * Created by Liuwei on 2016/9/26.
 * //文件遍历读取并将文件路径写入json文件
 */

function explorer(path) {
    fs.readdir(path, function (err, files) {

        //err 为错误 , files 文件名列表包含文件夹与文件
        if (err) {
            console.log('error:\n' + err);
            return;
        }
        files.forEach(function (file) {
            try {
                fs.stat(path + '/' + file, function (err, stat) {
                    if (err) {
                        console.log(err);
                        console.log(fileJsonTemp);
                        return;
                    }
                    if (stat.isDirectory()) {
                        // 如果是文件夹遍历
                        explorer(path + '/' + file);
                    } else {
                        if (temp.timer) {
                            clearTimeout(temp.timer);
                        }
                        // 读出所有的文件
                        var allPath = path + '/' + file;
                        temp._temp1.push(allPath);
                        //只获得新增文件列表
                        temp.timer = setTimeout(function () {
                            var differences = _.difference(temp._temp1, temp._temp2);
                            temp._temp2 = [].concat(temp._temp1);
                            _.each(differences, function(everyNew) {
                                console.log(everyNew);
                               if(everyNew){
                                   var RegisterTagID = everyNew.match(/\w{32}/)[0];
                                   var mp3Path = everyNew.match(/\/\w{32}\/\d{8}\/\d{2}_\d{2}_\w{8}.mp3$/)[0];
                                   var date = everyNew.match(/\/\d{8}\//)[0].substring(1, 9);
                                   var mp3Name = everyNew.match(/\/\d{2}_\d{2}_\w{8}.mp3$/)[0].substring(1);
                                   HM.updateMp3List(RegisterTagID, date, mp3Path, mp3Name);
                               }
                            });
                        }, 3000);    //3s 没有新文件产生， 则执行后续操作。
                    }
                });
            } catch (err) {
                console.log(err)
            }
        });
    });
}