/**

 About this script

 This is mavlink(board)->socket.io->mavlink(server) bridge

 It receives mavlink messages via socket.io, decodes them and transmits to client browser (web-based GCS).
 Also it can send mavlink messages back to board with commands or data

 */

//
//  CONFIGURATION
//

// system_id and component_id as set on your board (both defaults to 1)
const BOARD_SYS_ID = 1;
const BOARD_COMP_ID = 1;

const MAVLINK_VERSION = "v1.0";
const MAVLINK_MSG_DEF = ["common", "ardupilotmega"];

// Redis server config
const REDIS_SERVER = 'localhost';
const REDIS_PORT = 6379;

// RethinkDB server config
const RETHINKDB_SERVER = 'localhost';
const RETHINKDB_PORT = 28015;



// HTTP server init
const app = require('express')();
const http = require('http').Server(app);

// Socket.io_server server init
const io_server = require('socket.io')(http);

// Redis server init
const redis = require('redis');
const redisClient = redis.createClient({ host: REDIS_SERVER, port: REDIS_PORT });
redisClient.on('ready',function() {
    console.log("Redis is ready");
});
redisClient.on('error',function() {
    console.log("Error in Redis");
});

// Rethink DB init
const rethinkdb = require('rethinkdb');
let rethinkdb_connection = null;
rethinkdb.connect( {host: RETHINKDB_SERVER, port: RETHINKDB_PORT}, function(err, conn) {
    if (err) throw err;
    rethinkdb_connection = conn;
});

// Node-mavlink init
const mavlink = require('mavlink');
const myMAV = new mavlink(BOARD_SYS_ID, BOARD_COMP_ID, MAVLINK_VERSION, MAVLINK_MSG_DEF);

// Counting messages
let mavlink_msg_counter = 0;
let video_frames_counter = 0;


// After mavlink has parsed message definition XML files, it is ready to decode incoming messages
myMAV.on("ready", function() {
    console.log('mavlink ready');

    // On socket.io_server client connected (board or web)
    io_server.on('connection', function(io_client){
        console.log('client connected');

        // Get parameters from socket.io_server connection to find out who is it
        let robot_id = io_client.handshake.query.robot_id;
        let web_id = io_client.handshake.query.web_id;

        // The handshake details:
        /*

        {
            headers: // the headers sent as part of the handshake,
            time: // the date of creation (as string),
            address: // the ip of the client ,
            xdomain: // whether the connection is cross-domain ,
            secure: // whether the connection is secure ,
            issued: // the date of creation (as unix timestamp) ,
            url: // the request URL string ,
            query: // the query object
        }
        */


        //
        // In case we have board connected
        if( robot_id ){
            console.log('robot ' + robot_id);

            // TODO
            /*
                Here we check if this robot id is in our database
                If it's not, then we break connection and put it's IP to blacklist (time-limited)

                const client_ip = io_client.handshake.address
                io_client.disconnect(true)
             */

            // Joining to socket.io room with robot id. It is used to communicate with web-client
            io_client.join('robot_' + robot_id);

            // Telemetry hash
            // After mavlink message parsed the values are collected here.
            // Then this hash is sent to web-client on some interval
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

            // When we get incoming message from socket.io client
            io_client.on('fromboard', function(msg){

                // it is parsed by node-mavlink (mavlink issues 'message' event once it's ready
                myMAV.parse(msg);

                // count this message
                mavlink_msg_counter++;

            });

            // After mavlink message is parsed, we can use its data to fill telemetry fields
            // https://mavlink.io/en/messages/common.html
            myMAV.on("message", function(message) {
                // 'message' event is for every message with raw data
                // Fortunately node-mavlink has events for single messages (below)
                //console.log(message.id);
            });


            //
            // Here we save data from mavlink messages to our telemetry hash

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

            // 4
            myMAV.on("PING", function(message, fields) {
                console.log('PING ');
            });

            // TODO 22
            myMAV.on("PARAM_VALUE", function(message, fields) {
                //console.log('PARAM VALUE 22');
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
                //console.log('25 LOST');
            });

            // TODO 26
            myMAV.on("SCALED_IMU", function(message, fields) {
                //console.log('26 LOST');
            });

            // TODO 27
            myMAV.on("RAW_IMU", function(message, fields) {
                //console.log('27 LOST');
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

            // 44
            myMAV.on("MISSION_COUNT", function(message, fields) {
                console.log('44 MISSION COUNT');
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


            // TODO отправить PING на борт и получить ответ, посчитать время
            /*

            setInterval(function(){


                myMAV.createMessage("MISSION_REQUEST_LIST",
                    {
                        'target_system': 1
                        ,'target_component': 1
                        ,'mission_type': 0
                    },
                    function(out_msg) {
                        //console.log(out_msg);
                        io_client.emit('fromserver', out_msg.buffer);
                        console.log('ping sent ' + ping_seq);
                        ping_seq++;
                    }
                );


            }, 20000);
            */


            //
            // Send telemetry hash to socket.io room with its robot id
            setInterval(function(){
                // update server time
                telemetry.server_time = (new Date()).getTime();
                // send message to room (web client uses this data to update realtime telemetry on screen
                io_server.to('robot_' + robot_id).emit('telem', {robot_id: robot_id, telemetry: telemetry});
            }, 500); // 500 msec = 2 times in a second


            //
            // Video transmition implemetation
            io_client.on('video', function(frame){
               io_server.to('robot_' + robot_id).emit('video_frame', frame);
               video_frames_counter++;
            });

        }

        //
        // In case a web client connected
        else if( web_id ) {
            console.log('web');
            // TODO
            /*
                web client gets its id after authorization
                here we need to check if this id in our memory and client is authorized to connect
                if not we need to break connection and blacklist IP address for some time

                const client_ip = io_client.handshake.address
                io_client.disconnect(true)
             */

            // get all robots of our client
            rethinkdb.table('robots').run(rethinkdb_connection, function(err, cursor) {
                if (err) console.log(err);
                if( !cursor ) return;

                cursor.toArray(function(err, result) {
                    if (err) throw err;

                    // and joining to their socket.io rooms
                    for( let i = 0; i < result.length; i++ ){
                        io_client.join('robot_' + result[i].id);
                    }
                });

                // now web client will receive messages from all its robots
            });


        }


        // client disconnected
        io_client.on('disconnect', function(){
            console.log('client disconnected');
        });

    });

});


// Logging counters to console
setInterval(function(){
    console.log(mavlink_msg_counter + ' mavlink msgs received on last 60sec');
    console.log(video_frames_counter + ' video frames received on last 60sec');
    mavlink_msg_counter = 0;
    video_frames_counter = 0;
}, 60000);


http.listen(3000, function(){
  console.log('listening on *:3000');
});
