/**
 * Created by Liuwei on 2016/8/15.
 */
module.exports = {
    port: 3000,
    mongodb: {
        dbName: "shanxi",
        dbHost: "localhost",
        dbPort: 27017,
        DB_USER: "shanxiDbUser",
        DB_PASS: "2qHc0uPp"
    },
    tcpSocket: {
        HOST: "123.57.215.156",     //实时数据
        PORT: 8904,
        HOST2: "123.57.215.156",    //彩条
        PORT2: 8905
    },
    historicalAudioDataPath: "./app/public/historicalAudioData",//历史音频存放地址!
    NODE_ENV: "live"
};