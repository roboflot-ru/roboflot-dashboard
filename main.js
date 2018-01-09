/**
 * Created by nee on 06.01.2018.
 */

// Получить данные с дрона

var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mavlink = require('mavlink');

var myMAV = new mavlink(1, 1, "v1.0",["common", "ardupilotmega"]);


var redis = require('redis');
var redisClient = redis.createClient({host : 'localhost', port : 6379});

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
        console.log('a user connected');

        // приветсвенное сообщение
        socket.emit('chat', 'hello from server');

        // клиент отсоединился
        socket.on('disconnect', function(){
            console.log('user disconnected');
        });

        // пришло сообщение
        socket.on('chat', function(msg){
            //console.log(msg);
            // msg - пакет MAVLink как на GCS
            myMAV.parse(msg);
        });
    });

	//listen for messages
	myMAV.on("message", function(message) {
		console.log(message.id + ' ' + message.checksum);
	});



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