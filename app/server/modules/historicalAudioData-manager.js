var MongoDB = require('mongodb').Db;
var ObjectId = require('mongodb').ObjectID;
var Server = require('mongodb').Server;
var moment = require('moment');
moment.locale('zh-cn');
var config = require("../../../config/config");

/*
 ESTABLISH DATABASE CONNECTION
 */
var dbName = config.mongodb.dbName;
var dbHost = config.mongodb.dbHost;
var dbPort = config.mongodb.dbPort;
var DB_USER = config.mongodb.DB_USER;
var DB_PASS = config.mongodb.DB_PASS;
var NODE_ENV = config.NODE_ENV;

var db = new MongoDB(dbName, new Server(dbHost, dbPort, {auto_reconnect: true}), {w: 1});
db.open(function (e, d) {
    if (e) {
        console.log(e);
    } else {
        if (NODE_ENV == 'live') {
            db.authenticate(DB_USER, DB_PASS, function (e, res) {
                if (e) {
                    console.log('mongo :: error: not authenticated', e);
                }
                else {
                    console.log('mongo :: authenticated and connected to database - LM :: "' + dbName + '"');
                }
            });
        } else {
            console.log('mongo :: connected to database  without authenticated  - LM :: "' + dbName + '"');
        }
    }
});

var historicalAudioData = db.collection('historicalAudioData');

exports.updateMp3List = function (RegisterTagID, date, mp3Path, mp3Name, callback) {
    historicalAudioData.update({
        'RegisterTagID': RegisterTagID,
        'date': date,
        'mp3Name': mp3Name
    }, {
        $set: {
            'mp3Name': mp3Name,
            'RegisterTagID': RegisterTagID,
            'date': date,
            'mp3Path': mp3Path,
            'insertTime': moment().format('YYYY-MM-DD HH:mm:ss')
        }
    }, {upsert: true});
};


//传入当前选中站点的RegisterTagID， 获得历史mp3播放列表
exports.getAllHistoricalAudioDataByRegisterTagID = function (RegisterTagID, date, currentPage, pageSize, callback) {
    historicalAudioData.find({
        "RegisterTagID": RegisterTagID,
        "date": date
    }).sort({"insertTime": -1}).skip((currentPage - 1) * pageSize).limit(parseInt(pageSize)).toArray(function (err, o) {
        if (err) {
            callback(err, null);
        } else {
            //计算数据总数
            historicalAudioData.find({
                "RegisterTagID": RegisterTagID,
                "date": date
            }).count(function (e, count) {
                if (e) callback(e);
                else {
                    var jsonArray = {rows: o, total: count, currentPage: currentPage};
                    callback(err, jsonArray)
                }
            });
        }
    })
};

exports.clearMP3Souce = function(callback) {
    historicalAudioData.remove({},function(err) {
        if(err) {
            callback(err)
        }else {
            callback();
        }
    });
};