/**

 About this script

 This is mavlink(board)->socket.io->mavlink(server) bridge

 It receives mavlink messages via socket.io, decodes them and transmits to client browser (web-based GCS).
 Also it can send mavlink messages back to board with commands or data

 */

//
//  CONFIGURATION
//

const config = require('./config');

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

// Redis client init
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

const RobotModel = require('./models/robot.js');

// After mavlink has parsed message definition XML files, it is ready to decode incoming messages
myMAV.on("ready", function() {
    console.log('mavlink ready');

    // On socket.io_server client connected (board or web)
    io_server.on('connection', function(io_client){
        console.log('client connected ' + io_client.handshake.address );

        // Get parameters from socket.io_server connection to find out who is it
        let robot_id = io_client.handshake.query.robot_id;
        let gcs_id = io_client.handshake.query.gcs_id;

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

                User.get("0e4a6f6f-cc0c-4aa5-951a-fcfc480dd05a").getJoin({account: true})
                .run().then(function(user) {
             */

            RobotModel.get(robot_id).run().then(function(robot){
                if( !robot ){
                    console.log('robot not found ' + robot_id);
                    io_client.disconnect(true);
                }
                else {
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

                    // TODO !! 22
                    myMAV.on("PARAM_VALUE", function(message, fields) {
                        //console.log('PARAM VALUE 22');
                        /*
                        param_id	char[16]	Onboard parameter id, terminated by NULL if the length is less than 16 human-readable chars and WITHOUT null termination (NULL) byte if the length is exactly 16 chars - applications have to provide 16+1 bytes storage if the ID is stored as string
                        param_value	float	Onboard parameter value
                        param_type	uint8_t	Onboard parameter type: see the MAV_PARAM_TYPE enum for supported data types. (Enum:MAV_PARAM_TYPE )
                        param_count	uint16_t	Total number of onboard parameters
                        param_index	uint16_t	Index of this onboard parameter

                        1	MAV_PARAM_TYPE_UINT8	8-bit unsigned integer
                        2	MAV_PARAM_TYPE_INT8	8-bit signed integer
                        3	MAV_PARAM_TYPE_UINT16	16-bit unsigned integer
                        4	MAV_PARAM_TYPE_INT16	16-bit signed integer
                        5	MAV_PARAM_TYPE_UINT32	32-bit unsigned integer
                        6	MAV_PARAM_TYPE_INT32	32-bit signed integer
                        7	MAV_PARAM_TYPE_UINT64	64-bit unsigned integer
                        8	MAV_PARAM_TYPE_INT64	64-bit signed integer
                        9	MAV_PARAM_TYPE_REAL32	32-bit floating-point
                        10	MAV_PARAM_TYPE_REAL64	64-bit floating-point
                         */
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

                    // TODO !! 62
                    myMAV.on("NAV_CONTROLLER_OUTPUT", function(message, fields) {
                        /*
                        nav_roll	float	Current desired roll in degrees (Units: deg)
                        nav_pitch	float	Current desired pitch in degrees (Units: deg)
                        nav_bearing	int16_t	Current desired heading in degrees (Units: deg)
                        target_bearing	int16_t	Bearing to current waypoint/target in degrees (Units: deg)
                        wp_dist	uint16_t	Distance to active waypoint in meters (Units: m)
                        alt_error	float	Current altitude error in meters (Units: m)
                        aspd_error	float	Current airspeed error in meters/second (Units: m/s)
                        xtrack_error	float	Current crosstrack error on x-y plane in meters (Units: m)
                         */
                    });

                    // TODO 74
                    myMAV.on("VFR_HUD", function(message, fields) {

                    });

                    // TODO !! 77
                    myMAV.on("COMMAND_ACK", function(message, fields) {
                        /*
                        command	uint16_t	Command ID, as defined by MAV_CMD enum. (Enum:MAV_CMD )
                        result	uint8_t	See MAV_RESULT enum (Enum:MAV_RESULT )
                        progress **	uint8_t	WIP: Also used as result_param1, it can be set with a enum containing the errors reasons of why the command was denied or the progress percentage or 255 if unknown the progress when result is MAV_RESULT_IN_PROGRESS.
                        result_param2 **	int32_t	WIP: Additional parameter of the result, example: which parameter of MAV_CMD_NAV_WAYPOINT caused it to be denied.
                        target_system **	uint8_t	WIP: System which requested the command to be executed
                        target_component **	uint8_t	WIP: Component which requested the command to be executed

                        ** MAV_CMD


                        ** MAV_RESULT


                         */
                    });

                    // TODO !! 125
                    myMAV.on("POWER_STATUS", function(message, fields) {
                        /*
                        Vcc	uint16_t	5V rail voltage in millivolts (Units: mV)
                        Vservo	uint16_t	servo rail voltage in millivolts (Units: mV)
                        flags	uint16_t	power supply status flags (see MAV_POWER_STATUS enum) (Enum:MAV_POWER_STATUS )
                         */
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

                    // TODO 241
                    myMAV.on("VIBRATION", function(message, fields) {
                        /*
                        time_usec	uint64_t	Timestamp (micros since boot or Unix epoch) (Units: us)
                        vibration_x	float	Vibration levels on X-axis
                        vibration_y	float	Vibration levels on Y-axis
                        vibration_z	float	Vibration levels on Z-axis
                        clipping_0	uint32_t	first accelerometer clipping count
                        clipping_1	uint32_t	second accelerometer clipping count
                        clipping_2	uint32_t	third accelerometer clipping count
                         */
                    });

                    // TODO !! 242
                    myMAV.on("HOME_POSITION", function(message, fields) {
                        /*
                        This message can be requested by sending the MAV_CMD_GET_HOME_POSITION command.
                        The position the system will return to and land on. The position is set automatically by
                        the system during the takeoff in case it was not explicitely set by the operator before or after.
                        The position the system will return to and land on. The global and local positions encode
                        the position in the respective coordinate frames, while the q parameter encodes the orientation of
                        the surface. Under normal conditions it describes the heading and terrain slope, which can be used
                        by the aircraft to adjust the approach. The approach 3D vector describes the point to which the system
                        should fly in normal flight mode and then perform a landing sequence along the vector.

                        latitude	int32_t	Latitude (WGS84), in degrees * 1E7 (Units: degE7)
                        longitude	int32_t	Longitude (WGS84, in degrees * 1E7 (Units: degE7)
                        altitude	int32_t	Altitude (AMSL), in meters * 1000 (positive for up) (Units: mm)
                        x	float	Local X position of this position in the local coordinate frame (Units: m)
                        y	float	Local Y position of this position in the local coordinate frame (Units: m)
                        z	float	Local Z position of this position in the local coordinate frame (Units: m)
                        q	float[4]	World to surface normal and heading transformation of the takeoff position. Used to indicate the heading and slope of the ground
                        approach_x	float	Local X position of the end of the approach vector. Multicopters should set this position based on their takeoff path. Grass-landing fixed wing aircraft should set it the same way as multicopters. Runway-landing fixed wing aircraft should set it to the opposite direction of the takeoff, assuming the takeoff happened from the threshold / touchdown zone. (Units: m)
                        approach_y	float	Local Y position of the end of the approach vector. Multicopters should set this position based on their takeoff path. Grass-landing fixed wing aircraft should set it the same way as multicopters. Runway-landing fixed wing aircraft should set it to the opposite direction of the takeoff, assuming the takeoff happened from the threshold / touchdown zone. (Units: m)
                        approach_z	float	Local Z position of the end of the approach vector. Multicopters should set this position based on their takeoff path. Grass-landing fixed wing aircraft should set it the same way as multicopters. Runway-landing fixed wing aircraft should set it to the opposite direction of the takeoff, assuming the takeoff happened from the threshold / touchdown zone. (Units: m)
                        time_usec **	uint64_t	Timestamp (microseconds since UNIX epoch or microseconds since system boot) (Units: us)
                         */

                    });




                    // TODO !! 253
                    myMAV.on("STATUSTEXT", function(message, fields) {
                        /*
                        severity	uint8_t	Severity of status. Relies on the definitions within RFC-5424. See enum MAV_SEVERITY. (Enum:MAV_SEVERITY )
                        text	char[50]	Status text message, without null termination character

                            0	MAV_SEVERITY_EMERGENCY	System is unusable. This is a "panic" condition.
                            1	MAV_SEVERITY_ALERT	Action should be taken immediately. Indicates error in non-critical systems.
                            2	MAV_SEVERITY_CRITICAL	Action must be taken immediately. Indicates failure in a primary system.
                            3	MAV_SEVERITY_ERROR	Indicates an error in secondary/redundant systems.
                            4	MAV_SEVERITY_WARNING	Indicates about a possible future error if this is not resolved within a given timeframe. Example would be a low battery warning.
                            5	MAV_SEVERITY_NOTICE	An unusual event has occured, though not an error condition. This should be investigated for the root cause.
                            6	MAV_SEVERITY_INFO	Normal operational messages. Useful for logging. No action is required for these messages.
                            7	MAV_SEVERITY_DEBUG	Useful non-operational messages that can assist in debugging. These should not occur during normal operation.

                         */

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
                        io_server.to('robot_' + robot_id).emit('telem_' +  robot_id, telemetry);
                    }, 1000); // 500 msec = 2 times in a second


                    //
                    // Video transmition implemetation
                    io_client.on('video', function(frame){
                       io_server.to('robot_' + robot_id).emit('video_frame', frame);
                       video_frames_counter++;
                    });

                }
            }).error(function(err){
                console.log(err);
                console.log('robot not found ' + robot_id);
                io_client.disconnect(true);
            });



        }

        //
        // In case a web client connected
        else if( gcs_id ) {
            console.log('GCS');

            redisClient.get('gcs_id_' + gcs_id, function(err, user_id) {
                if( !user_id ){
                    console.log('gcs not found ' + gcs_id);
                    io_client.disconnect(true);
                }
                else {
                    // get all robots of our client
                    RobotModel.filter({user_id: user_id}).run().then(function(result) {
                        for( let i = 0; i < result.length; i++ ){
                            io_client.join('robot_' + result[i].id);
                        }

                        console.log('gcs ' + gcs_id + ' joined ' + result.length + ' robots');

                    });

                    // now web client will receive messages from all its robots
                }
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
