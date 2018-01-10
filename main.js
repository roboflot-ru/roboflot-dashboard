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
            };

            //
            // Принимаем расшифрованные сообщения и запоминаем
            // Потом раз в секунду веб-клиенту отдаем скомпонованную телеметрию
            myMAV.on("message", function(message) {
                //console.log(message.id + ' ' + message.checksum);
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

            // TODO 29
            myMAV.on("SCALED_PRESSURE", function(message, fields) {
                //telemetry.lat = fields.lat;
                //telemetry.lon = fields.lon;
                //telemetry.alt = fields.alt;
            });

            // TODO 30
            myMAV.on("ATTITUDE", function(message, fields) {

            });

            // TODO 32
            myMAV.on("LOCAL_POSITION_NED", function(message, fields) {

            });

            // TODO 33
            myMAV.on("GLOBAL_POSITION_INT", function(message, fields) {

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



    /*
    Итак, сюда пришла телеметрия, ее нужно передать web-клиенту, если он есть
    У каждого робота должен быть свой ID и подключение к сокету должно быть с его использованием
    После соединения с роботом проверяем его регистрацию и создаем канал для записи туда его телеметрии
     */

    /*

	myMAV.on("GPS_STATUS", function(message, fields) {
	    console.log('gps status');
		console.log(fields);
	});

	myMAV.on("GPS_RAW_INT", function(message, fields) {
	    console.log('gps raw');
		console.log(fields);
	});



	myMAV.on("STATUSTEXT", function(message, fields) {
	    console.log('status text');
		console.log(fields);
	});

	myMAV.on("ATTITUDE", function(message, fields) {
	    console.log('attitude');
		console.log(fields);
	});


	myMAV.on("INFO", function(message, fields) {
	    console.log('info');
		console.log(fields);
	});



	myMAV.on("HEARTBEAT", function(message, fields) {
	    console.log('heartbeat');
		console.log(fields);
	});

	myMAV.on("SYS_STATUS", function(message, fields) {
	    console.log('sys status');
		console.log(fields);
	});

    myMAV.on("SYSTEM_TIME", function(message, fields) {
	    console.log('system time');
		console.log(fields);
	});

    myMAV.on("SCALED_IMU", function(message, fields) {
	    console.log('scaled imu');
		console.log(fields);
	});

    myMAV.on("GLOBAL_POSITION_INT", function(message, fields) {
	    console.log('GLOBAL_POSITION_INT');
		console.log(fields);
	});
	*/

});






http.listen(3000, function(){
  console.log('listening on *:3000');
});

    /*
var app = require('express')();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
io.on('connection', function(){
    console.log('connected');
});
server.listen(3000);

var socket = require('engine.io-client')('ws://localhost:3000');
socket.on('open', function(){
    console.log('opened');
    socket.on('message', console.log);
    socket.on('close', function(){
        console.log('closed');
    });
});
        */