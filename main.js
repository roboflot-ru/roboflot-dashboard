/**
 * Created by nee on 06.01.2018.
 */

// Получить данные с дрона

const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const mavlink = require('mavlink');

const myMAV = new mavlink(1, 1, "v1.0",["common", "ardupilotmega"]);


const redis = require('redis');
const redisClient = redis.createClient({host : 'localhost', port : 6379});

const r = require('rethinkdb');

let connection = null;
r.connect( {host: 'localhost', port: 28015}, function(err, conn) {
    if (err) throw err;
    connection = conn;
});

redisClient.on('ready',function() {
 console.log("Redis is ready");
});

redisClient.on('error',function() {
 console.log("Error in Redis");
});

/*
## SET STRING

redisClient.set("language","nodejs")

redisClient.set("language","nodejs",function(err,reply) {
 console.log(err);
 console.log(reply);
});


## GET STRING
redisClient.get("language",function(err,reply) {
 console.log(err);
 console.log(reply);
});

## HASH
redisClient.hmset("tools","webserver","expressjs","database","mongoDB","devops","jenkins",function(er$
 console.log(err);
 console.log(reply);
});

redisClient.hgetall("tools",function(err,reply) {
 console.log(err);
 console.log(reply);
});


## LIST AND SET
redisClient.rpush(["languages","angularjs","nodejs","go"],function(err,reply) {
 console.log(err);
 console.log(reply);
});

redisClient.sadd(["devopstools","jenkins","codeship","jenkins"],function(err,reply) {
 console.log(err);
 console.log(reply);
});


redisClient.exists('language',function(err,reply) {
 if(!err) {
  if(reply === 1) {
   console.log("Key exists");
  } else {
   console.log("Does't exists");
  }
 }
});


redisClient.del('redisClient',function(err,reply) {
 if(!err) {
  if(reply === 1) {
   console.log("Key is deleted");
  } else {
   console.log("Does't exists");
  }
 }
});


redisClient.expire('redisClient', 30); // Expirty time for 30 seconds.


 */



app.get('/', function(req, res){
    res.sendFile(__dirname + '/testui/index.html');
});



myMAV.on("ready", function() {
    console.log('mavlink ready');

    // Соединение с клиентом
    io.on('connection', function(socket){
        console.log('client connected');

        let robot_id = socket.handshake.query.robot_id;
        let web_id = socket.handshake.query.web_id;

        if( robot_id ){
            console.log('robot ' + robot_id);

            // TODO проверить регистрацию робота в БД
            // если ее нет, то порвать соединение

            // а если есть, то создаем канал с его телеметрией и пишем все данные туда
            socket.join('robot_' + robot_id);

            let telemetry = {
                speed: -1
                ,lon: 0
                ,lat: 0
                ,alt: -1
                ,head: 0
                ,sys_load: -1
                ,bat_v: -1 // Battery voltage, in millivolts (1 = 1 millivolt) (Units: mV)
                ,bat_c: -1 // Battery current, in 10*milliamperes (1 = 10 milliampere), -1: autopilot does not measure the current (Units: cA)
                ,bat_rem: -1 // in % 0-100
                ,time_u: -1
                ,time_b: -1
                ,gps_fix_type: -1
                ,gps_speed: -1
                ,gps_cog: -1 // Course over ground (NOT heading, but direction of movement) in degrees * 100
                ,sats: -1
                ,press_a: -1 // Absolute pressure (hectopascal) (Units: hPa)
                ,press_d: -1 // Differential pressure 1 (hectopascal) (Units: hPa)
                ,temp: -100 //
                ,roll: 0
                ,pitch: 0
                ,yaw: 0
                ,rollspeed: 0
                ,pitchspeed: 0
                ,yawspeed: 0
                ,pos_lat: 0
                ,pos_lon: 0
                ,pos_alt: 0
                ,pos_rel_alt: 0
                ,pos_vx: 0
                ,pos_vy: 0
                ,pos_vz: 0
                ,pos_hdg: 0
            };

            //
            // Принимаем расшифрованные сообщения и запоминаем
            // Потом раз в секунду веб-клиенту отдаем скомпонованную телеметрию
            // https://mavlink.io/en/messages/common.html
            myMAV.on("message", function(message) {
                //console.log(message.id + ' ' + message.checksum);
            });

            // TODO 0 !!!
            myMAV.on("HEARTBEAT", function(message, fields) {
                //console.log('heartbeat');
                //console.log(fields);
            });

            // 1
            myMAV.on("SYS_STATUS", function(message, fields) {
                telemetry.sys_load = Math.round(fields.load/10);
                telemetry.bat_v = fields.voltage_battery;
                telemetry.bat_c = fields.current_battery;
                telemetry.bat_rem = fields.battery_remaining;

            });

            // 2
            myMAV.on("SYSTEM_TIME", function(message, fields) {
                telemetry.time_u = fields.time_unix_usec;
                telemetry.time_b = fields.time_boot_ms;
            });

            // 24
            myMAV.on("GPS_RAW_INT", function(message, fields) {
                telemetry.gps_fix_type = fields.fix_type;
                telemetry.lat = fields.lat/10000000;
                telemetry.lon = fields.lon/10000000;
                telemetry.alt = fields.alt/1000;
                telemetry.gps_speed = fields.vel/100; // GPS ground speed (m/s * 100). If unknown, set to: UINT16_MAX (Units: cm/s)
                telemetry.gps_cog = fields.cog;
                telemetry.sats = fields.satellites_visible;
            });

            // TODO 25
            myMAV.on("GPS_STATUS", function(message, fields) {
                console.log('25 LOST');
            });

            // TODO 26
            myMAV.on("SCALED_IMU", function(message, fields) {
                console.log('26 LOST');
            });

            // TODO 27
            myMAV.on("RAW_IMU", function(message, fields) {
                console.log('27 LOST');
            });

            // 29
            myMAV.on("SCALED_PRESSURE", function(message, fields) {
                telemetry.press_a = Math.round(fields.press_abs);
                telemetry.press_d = fields.press_diff;
                telemetry.temp = Math.round(fields.temperature/100); // Temperature measurement (0.01 degrees celsius) (Units: cdegC)
            });

            // 30
            myMAV.on("ATTITUDE", function(message, fields) {
                const pi = Math.PI;
                telemetry.roll = Math.round(fields.roll * (180/pi)); // Roll angle (rad, -pi..+pi) (Units: rad)
                telemetry.pitch = Math.round(fields.pitch * (180/pi));
                telemetry.yaw = Math.round(fields.yaw * (180/pi));
                telemetry.rollspeed = Math.round(fields.rollspeed * (180/pi)); // Roll angular speed (rad/s) (Units: rad/s)
                telemetry.pitchspeed = Math.round(fields.pitchspeed * (180/pi));
                telemetry.yawspeed = Math.round(fields.yawspeed * (180/pi));
            });

            // TODO 32
            myMAV.on("LOCAL_POSITION_NED", function(message, fields) {
                //telemetry.press_d = fields.press_diff;
            });

            // 33
            myMAV.on("GLOBAL_POSITION_INT", function(message, fields) {
                telemetry.pos_lat = fields.lat/10000000; // Latitude, expressed as degrees * 1E7 (Units: degE7)
                telemetry.pos_lon = fields.lon/10000000;
                telemetry.pos_alt = fields.alt/1000; // Altitude in meters, expressed as * 1000 (millimeters), AMSL (not WGS84 - note that virtually all GPS modules provide the AMSL as well) (Units: mm)
                telemetry.pos_rel_alt = fields.relative_alt/1000; // Altitude above ground in meters, expressed as * 1000 (millimeters) (Units: mm)
                telemetry.pos_vx = fields.vx/100; // Ground X Speed (Latitude, positive north), expressed as m/s * 100 (Units: cm/s)
                telemetry.pos_vy = fields.vy/100;
                telemetry.pos_vz = fields.vz/100;
                telemetry.pos_hdg = Math.round(fields.hdg/100); // Vehicle heading (yaw angle) in degrees * 100, 0.0..359.99 degrees. If unknown, set to: UINT16_MAX (Units: cdeg)
            });

            // TODO 35
            myMAV.on("RC_CHANNELS_RAW", function(message, fields) {

            });

            // TODO 42
            myMAV.on("MISSION_CURRENT", function(message, fields) {

            });

            // TODO 62
            myMAV.on("NAV_CONTROLLER_OUTPUT", function(message, fields) {

            });

            // TODO 74
            myMAV.on("VFR_HUD", function(message, fields) {

            });

            // TODO 152
            myMAV.on("MEMINFO", function(message, fields) {

            });

            // TODO 163
            myMAV.on("AHRS", function(message, fields) {

            });

            // TODO 165
            myMAV.on("HWSTATUS", function(message, fields) {

            });

            // TODO 253
            myMAV.on("NNNN", function(message, fields) {

            });

            // пришло сообщение от робота
            socket.on('fromboard', function(msg){
                //console.log(msg);
                // msg - пакет MAVLink как на GCS
                myMAV.parse(msg);
            });

            setInterval(function(){
                telemetry.server_time = new Date().getTime();
                io.to('robot_' + robot_id).emit('telem', {robot_id: robot_id, telemetry: telemetry});
            }, 1000);
        }
        // Web-клиент
        else if( web_id ) {
            console.log('web');
            // TODO проверяем регистрацию веб-клиента

            // выбираем список его роботов
            r.table('robots').run(connection, function(err, cursor) {
                if (err) console.log(err);
                if( !cursor ) return;

                cursor.toArray(function(err, result) {
                    if (err) throw err;

                    for( let i = 0; i < result.length; i++ ){
                        // и подписываем на их каналы
                        socket.join('robot_' + result[i].id);
                    }
                });
            });


        }
        else {
            console.log('unknown');
        }

        // клиент отсоединился
        socket.on('disconnect', function(){
            console.log('client disconnected');
        });
    });

});






http.listen(3000, function(){
  console.log('listening on *:3000');
});
