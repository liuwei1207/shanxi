var fs = require('fs');
var MongoDB = require('mongodb').Db;
var ObjectId = require('mongodb').ObjectID;
var Server = require('mongodb').Server;
var config = require("../../../config/config");
var chokidar = require("../../../config/chokidar");
var _ = require("underscore")._;

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
                    console.log('mongo :: authenticated and connected to database - SM :: "' + dbName + '"');
                }
            });
        } else {
            console.log('mongo :: connected to database  without authenticated - SM :: "' + dbName + '"');
        }
    }
});

var NsOHBasicProject = db.collection('NsOHBasicProject');
var NsOHBasicSite = db.collection('NsOHBasicSite');
var NsOHBasicDevice = db.collection('NsOHBasicDevice');
var majorDatas = db.collection('majorDatas');

/* site info for map methods */

exports.splicingMajorData = function (callback) {
    NsOHBasicProject.find({}, {_id: 0}).toArray(function (err, o) {
        if (err) {
            callback(err, null);
        } else {
            callback(err, o);
        }
    });
};

exports.getAllSiteInfoByProjNum = function (proNum, callback) {
    NsOHBasicSite.find({"ProjectID": "" + proNum}, {_id: 0}).sort({"SiteName": 1}).toArray(function (err, o) {
        if (err) {
            callback(err, null);
        } else {
            callback(err, o);
        }
    });
};

exports.getAllDeviceInfoBySiteID = function (SiteID, callback) {
    NsOHBasicDevice.find({"SiteID": "" + SiteID}, {_id: 0}).toArray(function (err, o) {
        if (err) {
            callback(err, null);
        } else {
            callback(err, o);
        }
    });
};

exports.updateMajorDatas = function (newData, callback) {
    majorDatas.remove({}, function (err, o) {
        if (err) {
            callback(e, false);
        } else {
            majorDatas.insert(newData, function (err, result) {
                if (err) {
                    callback(e, false);
                } else {
                    callback(null, true)
                }
            });
        }
    })
};

exports.getAllProjInfoName = function (callback) {
    NsOHBasicProject.find({}, {"_id": 0, ProjName: 1, ProjNum: 1}).sort({"ProjName": 1}).toArray(function (err, o) {
        if (err) {
            callback(err, null);
        } else {
            callback(err, o);
        }
    })
};

exports.getAllDeviceInfoName = function (callback) {
    NsOHBasicSite.find({}, {"_id": 0, SiteName: 1, SiteNum: 1}).sort({"SiteName": 1}).toArray(function (err, o) {
        if (err) {
            callback(err, null);
        } else {
            callback(err, o);
        }
    })
};

exports.getSiteInfoByProjNumArr = function (NumArr, callback) {

    var orQuery = [];

    if (typeof NumArr === 'undefined') {
        orQuery.push({
            "ProjectID": "none"
        })
    } else {
        for (var i = 0; i < NumArr.length; i++) {
            orQuery.push({
                "ProjectID": NumArr[i]
            })
        }
    }

    NsOHBasicSite.find({
        "$or": orQuery
    }, {_id: 0}).toArray(function (err, o) {
        if (err) {
            callback(err, null);
        } else {
            callback(err, o);
        }
    })
};

exports.getAllSiteInfo = function (callback) {
    NsOHBasicSite.find({}, {_id: 0}).toArray(function (err, o) {
        if (err) {
            callback(err, null);
        } else {
            callback(err, o);
        }
    })
};

exports.getSiteInfoBySiteID = function (siteID, callback) {
    NsOHBasicSite.find({"ID": siteID}, {_id: 0}).toArray(function (err, Site) {
        if (err) {
            callback(err, null);
        } else {
            NsOHBasicDevice.find({"SiteID": siteID}, {_id: 0, DeviceID: 1}).toArray(function (err, Device) {
                if (err) {
                    callback(err, null);
                } else {
                    var DeviceID = "";
                    if (Device[0]) {
                        try {
                            DeviceID = Device[0].DeviceID;
                            Site[0].DeviceID = DeviceID;
                            callback(err, Site);
                        } catch (err) {
                            DeviceID = "";
                            Site[0].DeviceID = DeviceID;
                            callback(err, Site);
                        }

                    } else {
                        Site[0].DeviceID = DeviceID;
                        callback(err, Site);
                    }
                }
            })
        }
    })
};

exports.getSiteInfoById = function (_id, callback) {
    NsOHBasicSite.findOne({"_id": ObjectId(_id)}, function (e, o) {
        if (e) {
            callback(e, null);
        } else callback(null, o)
    })
}

exports.getAllDevicesInfoBySiteID = function (siteID, callback) {
    NsOHBasicDevice.find({"SiteID": siteID}, {_id: 0}).toArray(function (err, o) {
        if (err) {
            callback(err, null);
        } else {
            callback(err, o);
        }
    })
};

exports.findLeftNavDatas = function (callback) {
    majorDatas.find({}, {_id: 0}).toArray(function (err, o) {
        if (o) {
            callback(o)
        } else {
            callback(null)
        }
    })
};

exports.findDataByProId = function (ProjNum, callback) {
    majorDatas.find({"ProjNum": ProjNum}).toArray(function (err, o) {
        if (o) {
            callback(o)
        } else {
            callback(null)
        }
    })
};

exports.findDataByProIdAndSiteId = function (ProjNum, siteID, callback) {
    if (ProjNum != "all") {
        if (siteID != "all") {
            majorDatas.find({"ProjNum": ProjNum, "sites.ID": siteID}, {
                _id: 0,
                "ProjNum": 1,
                "ProjName": 1,
                "sites.$": 1
            }).toArray(function (err, o) {
                if (o) {
                    callback(o)
                } else {
                    callback(null)
                }
            })
        } else {
            majorDatas.find({"ProjNum": ProjNum}, {
                _id: 0,
                "ProjNum": 1,
                "ProjName": 1
            }).toArray(function (err, o) {
                if (o) {
                    var sites = o[0].sites = [];
                    sites.push({
                        "SiteName": "全部站点"
                    });
                    callback(o)
                } else {
                    callback(null)
                }
            })
        }
    } else {
        //选择全部项目、站点
        var o = [{
            ProjName: "全部项目",
            sites: [{
                "SiteName": "全部站点"
            }]
        }];
        callback(o)
    }
};

//传入当前选中站点的项目ID 和 站点 ID 用来查出对应的所有设备数据
exports.getAllDeviceInfoByProjIDandSiteID = function (ProjID, siteID, callback) {

    var devicesInfo = [];   //用于存储找到的设备信息
    if (ProjID != "all") {
        if (siteID === "all") {
            NsOHBasicSite.find({"ProjectID": ProjID}, {
                "_id": 0,
                "SiteNum": 1
            }).sort({"SiteName": 1}).toArray(function (err, sitesNumArry) {
                if (err) {
                    callback(err)
                } else {
                    NsOHBasicDevice.find({"$or": sitesNumArry}).sort({"DeviceIndex": 1}).toArray(function (err, deviceInfo) {
                        if (err) {
                            callback(err)
                        }
                        callback(deviceInfo);
                    });
                }
            })
        } else {
            NsOHBasicDevice.find({"SiteID": siteID}, {"_id": 0}).sort({"DeviceIndex": 1}).toArray(function (err, deviceInfo) {
                if (err) {
                    callback(err)
                }
                callback(deviceInfo);
            });
        }
    } else {

        NsOHBasicSite.find({"ProjectID": {$exists: true}}, {
            "_id": 0,
            "SiteNum": 1
        }).toArray(function (err, sitesNumArry) {
            if (err) {
                callback(err)
            } else {
                NsOHBasicDevice.find({"$or": sitesNumArry}).sort({"DeviceIndex": 1}).toArray(function (err, deviceInfo) {
                    if (err) {
                        callback(err)
                    }
                    callback(deviceInfo);
                });
            }
        })

    }
};

exports.getAllProjectsRecords = function (callback) {
    NsOHBasicProject.find().toArray(
        function (e, res) {
            if (e) callback(e);
            else callback(null, res);
        });
};

exports.getAllSitesRecords = function (callback) {
    NsOHBasicSite.find().toArray(
        function (e, res) {
            if (e) callback(e);
            else callback(null, res);
        });
};

exports.getAllDevicesRecords = function (callback) {
    NsOHBasicDevice.find().toArray(
        function (e, res) {
            if (e) callback(e);
            else callback(null, res);
        });
};

exports.getAllDevicesTagRecords = function (callback) {
    NsOHBasicDevice.aggregate([
        {
            $match: {
                "RegisterTagID": {$exists: true}
            }
        },
        {
            $group: {
                _id: null,
                RegisterTagID: {$push: "$RegisterTagID"}
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

exports.getProjectByProjNum = function (ProjNum, callback) {
    NsOHBasicProject.findOne({ProjNum: ProjNum}, function (e, o) {
        callback(o);
    });
}

exports.getDeviceByDeviceID = function (DeviceID, callback) {
    NsOHBasicDevice.findOne({DeviceID: DeviceID}, function (e, o) {
        callback(o);
    });
}

exports.getDeviceByRegisterTagID = function (RegisterTagID, callback) {
    NsOHBasicDevice.findOne({RegisterTagID: RegisterTagID}, function (e, o) {
        callback(o);
    });
}

exports.getProjectByProjName = function (ProjName, callback) {
    NsOHBasicProject.findOne({ProjName: ProjName}, function (e, o) {
        callback(o);
    });
}

exports.getSiteBySiteNum = function (SiteNum, callback) {
    NsOHBasicSite.findOne({SiteNum: SiteNum}, function (e, o) {
        callback(o);
    });
}

exports.getSiteBySiteName = function (SiteName, callback) {
    NsOHBasicSite.findOne({SiteName: SiteName}, function (e, o) {
        callback(o);
    });
}

exports.addNewSite = function (newData, callback) {
    NsOHBasicSite.findOne({
        $or: [
            {ID: newData.ID},
            {SiteNum: newData.SiteNum},
            {SiteName: newData.SiteName}
        ]
    }, function (e, o) {
        if (o) {
            callback('Project-taken');
        } else {
            NsOHBasicSite.insert(newData, {safe: true}, callback);
        }
    });
}

exports.updateSite = function (newData, callback) {
    NsOHBasicSite.findOne({_id: ObjectId(newData._id)}, function (e, o) {
        o.ID = newData.ID;
        o.SiteNum = newData.SiteNum;
        o.SiteName = newData.SiteName;
        o.ProjectID = newData.ProjectID;
        o.ContactName = newData.ContactName;
        o.ContactMobile = newData.ContactMobile;
        o.ContactTel = newData.ContactTel;
        o.ContactEmail = newData.ContactEmail;
        o.SiteAddress = newData.SiteAddress;
        o.OHLongitude = newData.OHLongitude;
        o.OHLatitude = newData.OHLatitude;
        o.OHAltitude = newData.OHAltitude;
        o.OHNotes = newData.OHNotes;
        o.OHDetail = newData.OHDetail;
        NsOHBasicSite.save(o, {safe: true}, function (e) {
            if (e) callback(e);
            else callback(null, o);
        });
    });
}

exports.getProjectBy_id = function (_id, callback) {
    NsOHBasicProject.findOne({_id: ObjectId(_id)}, function (e, o) {
        callback(o);
    });
}

exports.getDeviceBy_id = function (_id, callback) {
    NsOHBasicDevice.findOne({_id: ObjectId(_id)}, function (e, o) {
        callback(o);
    });
}

exports.getSiteBy_id = function (_id, callback) {
    NsOHBasicSite.findOne({_id: ObjectId(_id)}, function (e, o) {
        NsOHBasicProject.findOne({ProjNum: o.ProjectID}, {_id: 0, ProjName: 1}, function (e, result) {
            if (result) {
                o.ProjName = result.ProjName;
                callback(o);
            } else {
                o.ProjName = "未选择项目...";
                callback(o);
            }
        });
    });
}

exports.addNewProj = function (newData, callback) {
    NsOHBasicProject.findOne({
        $or: [
            {ID: newData.ID},
            {ProjNum: newData.ProjNum},
            {ProjName: newData.ProjName}
        ]
    }, function (e, o) {
        if (o) {
            callback('Project-taken');
        } else {
            NsOHBasicProject.insert(newData, {safe: true}, callback);
        }
    });
}

exports.getProjInfoById = function (_id, callback) {
    NsOHBasicProject.findOne({"_id": ObjectId(_id)}, function (e, o) {
        if (e) {
            callback(e, null);
        } else callback(null, o)
    })
}

exports.deleteProj = function (_id, callback) {
    NsOHBasicProject.remove({_id: ObjectId(_id)}, callback);
}

exports.deleteDevice = function (_id, callback) {
    NsOHBasicDevice.remove({_id: ObjectId(_id)}, callback);
}
exports.deleteRole = function (id, callback) {
    Role.remove({_id: ObjectId(id)}, callback);
};

exports.deleteSite = function (_id, callback) {
    NsOHBasicSite.remove({_id: ObjectId(_id)}, callback);
}

exports.checkProjByProjNumAndInitialProjNum = function (ProjNum, initialProjNum, callback) {

    //比对数据库中、除原账号以外是否存在其他相同账号！
    if (ProjNum == initialProjNum) {
        callback(null);
    } else {
        NsOHBasicProject.findOne({"ProjNum": ProjNum}, function (err, o) {
            if (err) {
                callback(null);
            }
            if (!o) {
                callback(null)
            } else {
                callback(o)
            }
        })
    }
};

exports.updateProj = function (newData, callback) {
    NsOHBasicProject.findOne({_id: ObjectId(newData._id)}, function (e, o) {
        o.ID = newData.ID;
        o.ProjNum = newData.ProjNum;
        o.ProjName = newData.ProjName;
        o.ContactName = newData.ContactName;
        o.ContactMobile = newData.ContactMobile;
        o.ContactTel = newData.ContactTel;
        o.ContactEmail = newData.ContactEmail;
        o.OHNotes = newData.OHNotes;
        //o.creator 	= newData.creator;

        NsOHBasicProject.save(o, {safe: true}, function (e) {
            if (e) callback(e);
            else callback(null, o);
        });
    });
};

exports.updateDevice = function (newData, callback) {
    NsOHBasicDevice.findOne({_id: ObjectId(newData._id)}, function (e, o) {
        o.DeviceID = newData.DeviceID;
        o.RegisterTagID = newData.RegisterTagID;
        o.SiteID = newData.SiteID;

        NsOHBasicDevice.save(o, {safe: true}, function (e) {
            if (e) callback(e);
            else callback(null, o);
        });
    });
};

exports.addNewDevice = function (newData, callback) {
    var SiteNum = newData.SiteNum;
    if (SiteNum) {
        NsOHBasicSite.findOne({SiteNum: SiteNum}, function (err, oSite) {
            if (err) {
                console.log(err);
            } else {
                if (oSite) {
                    newData.SiteName = oSite.SiteName;
                }
                newData.SiteName = oSite.SiteName ? oSite.SiteName : "";
                NsOHBasicDevice.findOne({
                    $or: [
                        {DeviceID: newData.DeviceID},
                        {RegisterTagID: newData.RegisterTagID}
                    ]
                }, function (err, o) {
                    if (o) {
                        callback('Project-taken');
                    } else {
                        NsOHBasicDevice.insert(newData, {safe: true}, callback);
                    }
                });
            }
        });
    } else {
        NsOHBasicDevice.findOne({
            $or: [
                {DeviceID: newData.DeviceID},
                {RegisterTagID: newData.RegisterTagID}
            ]
        }, function (err, o) {
            if (o) {
                callback('Project-taken');
            } else {
                NsOHBasicProject.insert(newData, {safe: true}, callback);
            }
        });
    }
}