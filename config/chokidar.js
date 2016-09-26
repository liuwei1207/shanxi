var fs = require('fs');
var util = require('util');
var chokidar = require('chokidar');

var mp3File = "./app/public/historicalAudioData"; //历史音频存放地址!

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
// Add event listeners.
watcher
    .on('ready', () => log('已经监听 historicalAudioData 目录下的文件变化！'))
    .on('add', path => log(`File ${path} has been added`))
    .on('change', path => log(`File ${path} has been changed`))
    .on('unlink', path => log(`File ${path} has been removed`));


/**
 * Created by Liuwei on 2016/9/26.
 * //文件遍历读取并将文件路径写入json文件
 */

var fileJsonTemp = {};

function explorer(path, type) {
    fs.readdir(path, function (err, files) {

        //err 为错误 , files 文件名列表包含文件夹与文件
        if (err) {
            console.log('error:\n' + err);
            return;
        }

        files.forEach(function (file) {

            fs.stat(path + '/' + file, function (err, stat) {
                if (err) {
                    console.log(err);
                    return;
                }
                if (stat.isDirectory()) {
                    // 如果是文件夹遍历
                    explorer(path + '/' + file);
                } else {
                    // 读出所有的文件
                    var allPath = path + '/' + file;
                    var deviceID = allPath.match(/\w{35}/)[0];
                    var mp3Path = allPath.match(/\/\d{8}\/\d{2}_\d{2}_\w{8}.mp3$/)[0];

                    if(!isArray(fileJsonTemp[deviceID])) {
                        fileJsonTemp[deviceID] = [];
                        fileJsonTemp[deviceID].push(mp3Path);
                    } else {
                        fileJsonTemp[deviceID].push(mp3Path);
                    }
                }
            });

        });

    });
}

function isArray(obj) {
    return Object.prototype.toString.call(obj) === '[object Array]';
}

explorer(mp3File);