var MongoDB = require('mongodb').Db;
var ObjectId = require('mongodb').ObjectID;
var Server = require('mongodb').Server;
var config = require("../../../config/config");
var moment = require('moment');
moment.locale('zh-cn');

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
                    console.log('mongo :: authenticated and connected to database - ARM :: "' + dbName + '"');
                }
            });
        } else {
            console.log('mongo :: connected to database  without authenticated - ARM :: "' + dbName + '"');
        }
    }
});

var alertRules = db.collection('alertRules');
var alertData = db.collection('alertData');
var historicalData = db.collection('historicalData');
var NsOHBasicProject = db.collection('NsOHBasicProject');
var NsOHBasicSite = db.collection('NsOHBasicSite');
var NsOHBasicDevice = db.collection('NsOHBasicDevice');


exports.getAlertRulesByDeviceID = function (deviceID, callback) {
    alertRules.find({"deviceID": "" + deviceID}, {_id: 0, deviceID: 0}).toArray(function (err, o) {
        if (err) {
            callback(err, null);
        } else {
            callback(err, o);
        }
    });
};

exports.addDataToHistoricalDatabase = function (data) {
    //实时数据入库
    var _Date = moment().format('YYYY-MM-DD HH:mm:ss'); //2014-09-24 23:36:09
    data.insertDate = _Date;
    data.createdAt = new Date();
    historicalData.insert(data);

    //每一条入库数据 -- 监测4个参数的报警状态 - 判断报警状态并入库
    var deviceID = data.deviceID;
    var FMReviceRSSI_Status = data.deviceData.FMReviceRSSI.alarmStatus;
    var FMReviceSNR_Status = data.deviceData.FMReviceSNR.alarmStatus;
    var RoomHum_Status = data.deviceData.RoomHum.alarmStatus;
    var RoomTemp_Status = data.deviceData.RoomTemp.alarmStatus;
    var normal = 1;   //正常
    var warning = 2;   //警告
    var danger = 3;   //异常
    var offline = 4;   //掉线

    NsOHBasicDevice.find({"DeviceID": deviceID}, {_id: 0, SiteID: 1}).toArray(function (err, oSiteID) {
        try {
            if (err) {
                console.log(err)
            } else {
                NsOHBasicSite.find({"SiteNum": oSiteID[0].SiteID}, {
                    _id: 0,
                    SiteName: 1,
                    ProjectID: 1
                }).toArray(function (err, oSite) {
                    if (err) {
                        console.log(err)
                    } else {
                        var SiteName = oSite[0].SiteName;
                        var ProjectID = oSite[0].ProjectID;
                        NsOHBasicProject.find({"ProjNum": ProjectID}, {
                            _id: 0,
                            ProjName: 1
                        }).toArray(function (err, oProj) {
                            if (err) {
                                console.log(err)
                            } else {
                                var ProjName = oProj[0].ProjName;

                                if (FMReviceRSSI_Status == danger) {


                                    alertData.update(
                                        {
                                            "deviceID": deviceID,
                                            "_type": "realTime",
                                            "type": "FMReviceRSSI"
                                        },
                                        {
                                            $set: {
                                                "AlarmTime": _Date,
                                                "deviceID": deviceID,
                                                "type": "FMReviceRSSI",
                                                "SiteName": SiteName,
                                                "ProjName": ProjName,
                                                "AlarmContent": "设备【场强】异常！",
                                                "IsRemove": "0",
                                                "RemovedWays": "未消警",
                                                "RemovedTime": "",
                                                "IsHandle": "0",
                                                "HandleTime": "",
                                                "HandleUserID": "",
                                                "HandleMark": "",
                                                "remove": "0"
                                            }
                                        },
                                        {
                                            upsert: true
                                        });
                                }
                                if (FMReviceSNR_Status == danger) {
                                    alertData.update(
                                        {
                                            "deviceID": deviceID,
                                            "_type": "realTime",
                                            "type": "FMReviceSNR"
                                        },
                                        {
                                            $set: {
                                                "AlarmTime": _Date,
                                                "deviceID": deviceID,
                                                "type": "FMReviceSNR",
                                                "SiteName": SiteName,
                                                "ProjName": ProjName,
                                                "AlarmContent": "设备【信噪比】异常！",
                                                "IsRemove": "0",
                                                "RemovedWays": "未消警",
                                                "RemovedTime": "",
                                                "IsHandle": "0",
                                                "HandleTime": "",
                                                "HandleUserID": "",
                                                "HandleMark": "",
                                                "remove": "0"
                                            }
                                        },
                                        {
                                            upsert: true
                                        });
                                }
                                if (RoomHum_Status == danger) {
                                    alertData.update(
                                        {
                                            "deviceID": deviceID,
                                            "_type": "realTime",
                                            "type": "RoomHum"
                                        },
                                        {
                                            $set: {
                                                "AlarmTime": _Date,
                                                "deviceID": deviceID,
                                                "type": "RoomHum",
                                                "SiteName": SiteName,
                                                "ProjName": ProjName,
                                                "AlarmContent": "设备【湿度】异常！",
                                                "IsRemove": "0",
                                                "RemovedWays": "未消警",
                                                "RemovedTime": "",
                                                "IsHandle": "0",
                                                "HandleTime": "",
                                                "HandleUserID": "",
                                                "HandleMark": "",
                                                "remove": "0"
                                            }
                                        },
                                        {
                                            upsert: true
                                        });
                                }
                                if (RoomTemp_Status == danger) {
                                    alertData.update(
                                        {
                                            "deviceID": deviceID,
                                            "_type": "realTime",
                                            "type": "RoomTemp"
                                        },
                                        {
                                            $set: {
                                                "AlarmTime": _Date,
                                                "deviceID": deviceID,
                                                "type": "RoomTemp",
                                                "SiteName": SiteName,
                                                "ProjName": ProjName,
                                                "AlarmContent": "设备【温度】异常！",
                                                "IsRemove": "0",
                                                "RemovedWays": "未消警",
                                                "RemovedTime": "",
                                                "IsHandle": "0",
                                                "HandleTime": "",
                                                "HandleUserID": "",
                                                "HandleMark": "",
                                                "remove": "0"
                                            }
                                        },
                                        {
                                            upsert: true
                                        });
                                }

                                if (FMReviceRSSI_Status == normal) {
                                    alertData.remove({
                                        "deviceID": deviceID,
                                        "_type": "realTime",
                                        "type": "FMReviceRSSI"
                                    });
                                }
                                if (FMReviceSNR_Status == normal) {
                                    alertData.remove({
                                        "deviceID": deviceID,
                                        "_type": "realTime",
                                        "type": "FMReviceSNR"
                                    });
                                }
                                if (RoomHum_Status == normal) {
                                    alertData.remove({
                                        "deviceID": deviceID,
                                        "_type": "realTime",
                                        "type": "RoomHum"
                                    });
                                }
                                if (RoomTemp_Status == normal) {
                                    alertData.remove({
                                        "deviceID": deviceID,
                                        "_type": "realTime",
                                        "type": "RoomTemp"
                                    });
                                }
                            }
                        });
                    }
                });
            }
        } catch (err) {

        }
    });
};

exports.updateAlertRulesByDeviceID = function (newData, callback) {
    alertRules.findOne({deviceID: newData.deviceID}, function (e, o) {
        o.FMReceiveFQY.value = newData.FMReceiveFQY;
        o.FMReviceSNR.value = newData.FMReviceSNR;
        o.FMReviceRSSI.value = newData.FMReviceRSSI;
        o.RoomHum.value = newData.RoomHum;
        o.RoomTemp.value = newData.RoomTemp;
        alertRules.save(o, {safe: true}, function (e) {
            if (e) callback(e);
            else callback(null, o);
        });
    });
};

exports.getChartDataByDeviceIDAndDate = function (deviceID, date, callback) {
    //console.log(deviceID);
    //console.log(date);
    var selectedStartDay = moment(date).format('YYYY-MM-DD');
    var selectedEndDay = moment(date).add(1, 'days').format('YYYY-MM-DD'); //2014年10月01日

    historicalData.aggregate([
        {
            $match: {
                "deviceID": deviceID,
                "insertDate": {"$gt": selectedStartDay, "$lt": selectedEndDay}
            }
        },
        {
            $group: {
                _id: "$deviceID",
                FMReviceSNR: {$push: "$deviceData.FMReviceSNR.value"},
                FMReviceRSSI: {$push: "$deviceData.FMReviceRSSI.value"},
                RoomHum: {$push: "$deviceData.RoomHum.value"},
                RoomTemp: {$push: "$deviceData.RoomTemp.value"},
                date: {$push: "$insertDate"}
            }
        },
        {
            $sort: {
                "insertDate": 1
            }
        }
    ]).toArray(function (err, o) {
        if (err) {
            callback(err, null);
        } else {
            callback(err, o);
        }
    });
};

exports.getAllRecords = function (newData, callback) {
    var page = parseInt(newData.page);
    var rows = parseInt(newData.rows);
    var sidx = newData.sidx;
    var sord = parseInt(newData.sord);
    var sortStr = {};   //排序查询字符串！
    sortStr[sidx] = sord;
    alertData.find({}).sort(sortStr).skip((page - 1) * rows).limit(rows).toArray(function (err, rs) {
        if (err) {
            callback(err)
        } else {
            //计算数据总数
            alertData.find({}).count(function (e, count) {
                if (e) callback(e);
                else {
                    var totalPages = Math.ceil(count / rows);
                    var jsonArray = {rows: rs, total: totalPages};
                    callback(jsonArray)
                }
            });
        }
    });
};

exports.creatNewAlertRules = function (deviceID, callback) {
    alertRules.update({
        'deviceID': deviceID
    }, {
        $set: {
            "deviceID": deviceID,
            "FMReceiveFQY": {
                "name": "接收频率",
                "value": [
                    "87",
                    "108"
                ]
            },
            "FMReviceSNR": {
                "name": "信噪比",
                "value": [
                    "0",
                    "9999"
                ]
            },
            "FMReviceRSSI": {
                "name": "场强",
                "value": [
                    "0",
                    "9999"
                ]
            },
            "RoomHum": {
                "name": "湿度",
                "value": [
                    "0",
                    "100"
                ]
            },
            "RoomTemp": {
                "name": "温度",
                "value": [
                    "-30",
                    "40"
                ]
            }
        }
    }, {upsert: true}, function (e) {
        if (e) callback(e);
        else callback(null);
    })
};
