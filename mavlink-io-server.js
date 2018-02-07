/**

 About this script

 This is mavlink(board)->socket.io->mavlink(server) bridge

 It receives mavlink messages via socket.io, decodes them and transmits to client browser (web-based GCS).
 Also it can send mavlink messages back to board with commands or data

 */

const config = require('./config');


// HTTP server init
const app = require('express')();
const http = require('http').Server(app);


// Socket.io_server server init
const io_server = require('socket.io')(http);
const io_redis_adapter = require('socket.io-redis');
io_server.adapter(io_redis_adapter({ host: config.redis_host, port: config.redis_port }));

//io_server.set('transports', [ 'jsonp-polling' ]);

// Redis client init
const redis = require('redis');
const redisClient = redis.createClient({ host: config.redis_host, port: config.redis_port });
redisClient.on('ready',function() {
    console.log("Redis is ready");
});
redisClient.on('error',function() {
    console.log("Error in Redis");
});


// Rethink DB init
const rethinkdb = require('rethinkdb');
let rethinkdb_connection = null;
rethinkdb.connect( {host: config.RETHINKDB_SERVER, port: config.RETHINKDB_PORT}, function(err, conn) {
    if (err) throw err;
    rethinkdb_connection = conn;
});


// Node-mavlink init
const MAVlink = require('mavlink');


// Counting messages
let mavlink_msg_counter = 0;
let video_frames_counter = 0;


// Robot DB model
const RobotModel = require('./models/robot.js');



// On client connected
io_server.on('connection', function(io_client){
    console.log('Client connected addr=' + io_client.handshake.address + '  id=' + io_client.id );

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

    // Local vars
    let robot_id = io_client.handshake.query.robot_id
        ,robot_params_key = null
        ,robot_status_key = null
        ,robot_telem_key = null
        ,robot_io_telemetry_room = null
        ,telem_interval = null
        ,redis_sub = null
        ,redis_pub = null;

    //
    // In case we have board connected
    if( robot_id ){
        console.log('robot ' + robot_id);

        // check if this robot id is in the database
        RobotModel.get(robot_id).run().then(function(robot){
            // If it's not, then break connection
            if( !robot ){
                console.log('no robot in db, id=' + robot_id);
                io_client.disconnect(true);

                // TODO blacklist IP address if it tries to connect too often
            }

            // robot in DB
            else {
                
                // TODO get mavlink params from robot db
                robot.sys_id = config.BOARD_SYS_ID;
                robot.comp_id = config.BOARD_COMP_ID;
                robot.mav_v = config.MAVLINK_VERSION;
                robot.mav_msg = config.MAVLINK_MSG_DEF;

                const robotMAV = new MAVlink(robot.sys_id, robot.comp_id, robot.mav_v, robot.mav_msg);

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

                    ,type: null //
                    ,autopilot: null //
                    ,b_mode: null // base mode from heartbeat
                    ,c_mode: null // custom mode from heartbeat
                    ,sys_status: null // system status from heartbeat
                    ,mav_v: null

                    ,last_msg_timestamp: 0
                };

                redis_sub = redisClient.duplicate();
                redis_pub = redisClient.duplicate();

                // After mavlink has parsed message definition XML files, it is ready to decode incoming messages
                robotMAV.on("ready", function() {
                    console.log('mavlink ready');

                    // set redis and io keys
                    robot_params_key = 'robot_params_' + robot_id;
                    robot_status_key = 'robot_status_' + robot_id;
                    robot_telem_key = 'robot_telem_' + robot_id;
                    robot_io_telemetry_room = 'robot_telemetry_' + robot_id;
    
                    // set robot status online and user_id
                    redisClient.hmset(robot_status_key, {'online': 1, 'user_id': robot.user_id, 'io_id': io_client.id });
                    
                    // Joining to socket.io room with robot id. It is used to communicate with web-client
                    io_client.join(robot_io_telemetry_room);

                    // слушать канал с командами
                    redis_sub.subscribe('gcs_command_to_' + robot_id);

                    // When we get incoming message from board
                    io_client.on('fromboard', function(msg){
                        robotMAV.parse(msg);
                        mavlink_msg_counter++;
                    });

                    // emits message to board
                    const send_to_board = function(message){
                        io_client.emit('fromserver', message.buffer);
                    };

                    // если получена команда для этого робота
                    redis_sub.on('message', function(channel, cd){ // robot_id, command_data
                        if( channel == 'gcs_command_to_' + robot_id ){

                            console.log('GOT COMMAND for ' + robot_id + '    ' + io_client.id);

                            // parse command data
                            const com_data = JSON.parse(cd);

                            // Compose mavlink message
                            robotMAV.createMessage(com_data.command, com_data.params, send_to_board);
                        }
                    });

                    // send message to board to get params list
                    robotMAV.createMessage("PARAM_REQUEST_LIST", {
                        'target_system': robot.sys_id
                        ,'target_component': robot.comp_id
                    }, send_to_board);

                });


                // After mavlink message is parsed, we can use its data to fill telemetry fields
                // https://mavlink.io/en/messages/common.html
                robotMAV.on("message", function(message) {
                    telemetry.last_msg_timestamp = (new Date()).getTime();
                });


                //
                // Here we save data from mavlink messages to our telemetry hash

                // TODO 0 !!!
                robotMAV.on("HEARTBEAT", function(message, fields) {
                    /*
                        type	uint8_t	Type of the MAV (quadrotor, helicopter, etc., up to 15 types, defined in MAV_TYPE ENUM) (Enum:MAV_TYPE )
                        autopilot	uint8_t	Autopilot type / class. defined in MAV_AUTOPILOT ENUM (Enum:MAV_AUTOPILOT )
                        base_mode	uint8_t	System mode bitfield, see MAV_MODE_FLAG ENUM in mavlink/include/mavlink_types.h (Enum:MAV_MODE_FLAG )
                        custom_mode	uint32_t	A bitfield for use for autopilot-specific flags.
                        system_status	uint8_t	System status flag, see MAV_STATE ENUM (Enum:MAV_STATE )
                        mavlink_version	uint8_t_mavlink_version	MAVLink version, not writable by user, gets added by protocol because of magic data type: uint8_t_mavlink_version

                        MAV_MODE_FLAG
                            128	MAV_MODE_FLAG_SAFETY_ARMED	0b10000000 MAV safety set to armed. Motors are enabled / running / can start. Ready to fly. Additional note: this flag is to be ignore when sent in the command MAV_CMD_DO_SET_MODE and MAV_CMD_COMPONENT_ARM_DISARM shall be used instead. The flag can still be used to report the armed state.
                            64	MAV_MODE_FLAG_MANUAL_INPUT_ENABLED	0b01000000 remote control input is enabled.
                            32	MAV_MODE_FLAG_HIL_ENABLED	0b00100000 hardware in the loop simulation. All motors / actuators are blocked, but internal software is full operational.
                            16	MAV_MODE_FLAG_STABILIZE_ENABLED	0b00010000 system stabilizes electronically its attitude (and optionally position). It needs however further control inputs to move around.
                            8	MAV_MODE_FLAG_GUIDED_ENABLED	0b00001000 guided mode enabled, system flies waypoints / mission items.
                            4	MAV_MODE_FLAG_AUTO_ENABLED	0b00000100 autonomous mode enabled, system finds its own goal positions. Guided flag can be set or not, depends on the actual implementation.
                            2	MAV_MODE_FLAG_TEST_ENABLED	0b00000010 system has a test mode enabled. This flag is intended for temporary system tests and should not be used for stable implementations.
                            1	MAV_MODE_FLAG_CUSTOM_MODE_ENABLED	0b00000001 Reserved for future use.

                        MAV_STATE
                            MAV_STATE_UNINIT	Uninitialized system, state is unknown.
                            MAV_STATE_BOOT	System is booting up.
                            MAV_STATE_CALIBRATING	System is calibrating and not flight-ready.
                            MAV_STATE_STANDBY	System is grounded and on standby. It can be launched any time.
                            MAV_STATE_ACTIVE	System is active and might be already airborne. Motors are engaged.
                            MAV_STATE_CRITICAL	System is in a non-normal flight mode. It can however still navigate.
                            MAV_STATE_EMERGENCY	System is in a non-normal flight mode. It lost control over parts or over the whole airframe. It is in mayday and going down.
                            MAV_STATE_POWEROFF	System just initialized its power-down sequence, will shut down now.
                            MAV_STATE_FLIGHT_TERMINATION	System is terminating itself.
                     */

                    telemetry.type = fields.type;
                    telemetry.autopilot = fields.autopilot;
                    telemetry.b_mode = '';
                    telemetry.c_mode = fields.custom_mode;
                    telemetry.sys_status = fields.system_status;
                    telemetry.mav_v = fields.mavlink_version;

                    if( 1 & fields.base_mode ) telemetry.b_mode = telemetry.b_mode + 'MAV_MODE_FLAG_CUSTOM_MODE_ENABLED ';
                    if( 2 & fields.base_mode ) telemetry.b_mode = telemetry.b_mode + 'MAV_MODE_FLAG_TEST_ENABLED ';
                    if( 4 & fields.base_mode ) telemetry.b_mode = telemetry.b_mode + 'MAV_MODE_FLAG_AUTO_ENABLED ';
                    if( 8 & fields.base_mode ) telemetry.b_mode = telemetry.b_mode + 'MAV_MODE_FLAG_GUIDED_ENABLED ';
                    if( 16 & fields.base_mode ) telemetry.b_mode = telemetry.b_mode + 'MAV_MODE_FLAG_STABILIZE_ENABLED ';
                    if( 32 & fields.base_mode ) telemetry.b_mode = telemetry.b_mode + 'MAV_MODE_FLAG_HIL_ENABLED ';
                    if( 64 & fields.base_mode ) telemetry.b_mode = telemetry.b_mode + 'MAV_MODE_FLAG_MANUAL_INPUT_ENABLED ';
                    if( 128 & fields.base_mode ) telemetry.b_mode = telemetry.b_mode + 'MAV_MODE_FLAG_SAFETY_ARMED ';

                });

                // 1
                robotMAV.on("SYS_STATUS", function(message, fields) {
                    telemetry.sys_load = Math.round(fields.load/10);
                    telemetry.bat_v = fields.voltage_battery / 1000;
                    telemetry.bat_c = fields.current_battery;
                    telemetry.bat_rem = fields.battery_remaining;

                    /*
                        onboard_control_sensors_present	uint32_t	Bitmask showing which onboard controllers and sensors are present. Value of 0: not present. Value of 1: present. Indices defined by ENUM MAV_SYS_STATUS_SENSOR (Enum:MAV_SYS_STATUS_SENSOR )
                        onboard_control_sensors_enabled	uint32_t	Bitmask showing which onboard controllers and sensors are enabled: Value of 0: not enabled. Value of 1: enabled. Indices defined by ENUM MAV_SYS_STATUS_SENSOR (Enum:MAV_SYS_STATUS_SENSOR )
                        onboard_control_sensors_health	uint32_t	Bitmask showing which onboard controllers and sensors are operational or have an error: Value of 0: not enabled. Value of 1: enabled. Indices defined by ENUM MAV_SYS_STATUS_SENSOR (Enum:MAV_SYS_STATUS_SENSOR )
                        load	uint16_t	Maximum usage in percent of the mainloop time, (0%: 0, 100%: 1000) should be always below 1000 (Units: d%)
                        voltage_battery	uint16_t	Battery voltage, in millivolts (1 = 1 millivolt) (Units: mV)
                        current_battery	int16_t	Battery current, in 10*milliamperes (1 = 10 milliampere), -1: autopilot does not measure the current (Units: cA)
                        battery_remaining	int8_t	Remaining battery energy: (0%: 0, 100%: 100), -1: autopilot estimate the remaining battery (Units: %)
                        drop_rate_comm	uint16_t	Communication drops in percent, (0%: 0, 100%: 10'000), (UART, I2C, SPI, CAN), dropped packets on all links (packets that were corrupted on reception on the MAV) (Units: c%)
                        errors_comm	uint16_t	Communication errors (UART, I2C, SPI, CAN), dropped packets on all links (packets that were corrupted on reception on the MAV)
                        errors_count1	uint16_t	Autopilot-specific errors
                        errors_count2	uint16_t	Autopilot-specific errors
                        errors_count3	uint16_t	Autopilot-specific errors
                        errors_count4	uint16_t	Autopilot-specific errors
                     */

                });

                // 2
                robotMAV.on("SYSTEM_TIME", function(message, fields) {
                    telemetry.time_u = fields.time_unix_usec;
                    telemetry.time_b = fields.time_boot_ms;
                });

                // 4
                robotMAV.on("PING", function(message, fields) {
                    console.log('PING ');
                });

                // 22
                robotMAV.on("PARAM_VALUE", function(message, fields) {
                    //console.log('PARAM VALUE ' + fields.param_id + ' = ' + fields.param_value + ' (' + fields.param_count + ')');

                    // save params to redis hash with robot_id key
                    redisClient.hset(robot_params_key, fields.param_id.replace(/\0/g, ''), fields.param_value);
                    redisClient.hset(robot_params_key, 'params_count', fields.param_count);

                    /*
                    param_id	char[16]	Onboard parameter id, terminated by NULL if the length is less than 16
                    human-readable chars and WITHOUT null termination (NULL) byte if the length is exactly 16 chars -
                    applications have to provide 16+1 bytes storage if the ID is stored as string

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
                robotMAV.on("GPS_RAW_INT", function(message, fields) {
                    telemetry.gps_fix_type = fields.fix_type;
                    telemetry.lat = fields.lat/10000000;
                    telemetry.lon = fields.lon/10000000;
                    telemetry.alt = fields.alt/1000;
                    telemetry.gps_speed = fields.vel/100; // GPS ground speed (m/s * 100). If unknown, set to: UINT16_MAX (Units: cm/s)
                    telemetry.gps_cog = fields.cog;
                    telemetry.sats = fields.satellites_visible;
                });

                // TODO 25
                robotMAV.on("GPS_STATUS", function(message, fields) {
                    //console.log('25 LOST');
                });

                // TODO 26
                robotMAV.on("SCALED_IMU", function(message, fields) {
                    //console.log('26 LOST');
                });

                // TODO 27
                robotMAV.on("RAW_IMU", function(message, fields) {
                    //console.log('27 LOST');
                });

                // 29
                robotMAV.on("SCALED_PRESSURE", function(message, fields) {
                    telemetry.press_a = Math.round(fields.press_abs);
                    telemetry.press_d = fields.press_diff;
                    telemetry.temp = Math.round(fields.temperature/100); // Temperature measurement (0.01 degrees celsius) (Units: cdegC)
                });

                // 30
                robotMAV.on("ATTITUDE", function(message, fields) {
                    const pi = Math.PI;
                    telemetry.roll = Math.round(fields.roll * (180/pi)); // Roll angle (rad, -pi..+pi) (Units: rad)
                    telemetry.pitch = Math.round(fields.pitch * (180/pi));
                    telemetry.yaw = Math.round(fields.yaw * (180/pi));
                    telemetry.rollspeed = Math.round(fields.rollspeed * (180/pi)); // Roll angular speed (rad/s) (Units: rad/s)
                    telemetry.pitchspeed = Math.round(fields.pitchspeed * (180/pi));
                    telemetry.yawspeed = Math.round(fields.yawspeed * (180/pi));
                });

                // TODO 32
                robotMAV.on("LOCAL_POSITION_NED", function(message, fields) {
                    //telemetry.press_d = fields.press_diff;
                });

                // 33
                robotMAV.on("GLOBAL_POSITION_INT", function(message, fields) {
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
                robotMAV.on("RC_CHANNELS_RAW", function(message, fields) {

                });

                // TODO 39
                robotMAV.on("MISSION_ITEM", function(message, fields) {
                    console.log("39 MISSION_ITEM");
                    //console.log(fields);
                });

                // TODO 42
                robotMAV.on("MISSION_CURRENT", function(message, fields) {
                    //console.log('42 MISSION_CURRENT ' + fields.seq);
                });

                // TODO 44
                robotMAV.on("MISSION_COUNT", function(message, fields) {
                    console.log('44 MISSION COUNT ' + fields.count);
                });

                // TODO 46
                robotMAV.on("MISSION_ITEM_REACHED", function(message, fields) {
                    /*
                        A certain mission item has been reached.
                        The system will either hold this position (or circle on the orbit) or
                        (if the autocontinue on the WP was set) continue to the next waypoint.

                        seq	uint16_t	Sequence
                     */
                    console.log('46 MISSION_ITEM_REACHED ' + fields.seq);
                });

                // TODO 47
                robotMAV.on("MISSION_ACK", function(message, fields) {
                    /*
                        Ack message during waypoint handling. The type field states if this message is a positive ack (type=0)
                        or if an error happened (type=non-zero).

                        target_system	uint8_t	System ID
                        target_component	uint8_t	Component ID
                        type	uint8_t	See MAV_MISSION_RESULT enum (Enum:MAV_MISSION_RESULT )
                        mission_type **	uint8_t	Mission type, see MAV_MISSION_TYPE (Enum:MAV_MISSION_TYPE )
                     */
                    console.log('47 MISSION_ACK ' + fields.type);
                });

                // TODO !! 62
                robotMAV.on("NAV_CONTROLLER_OUTPUT", function(message, fields) {
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

                // TODO 73
                robotMAV.on("MISSION_ITEM_INT", function(message, fields) {
                    /*
                        Message encoding a mission item. This message is emitted to announce the presence of a mission item and to set a mission item on the system. The mission item can be either in x, y, z meters (type: LOCAL) or x:lat, y:lon, z:altitude. Local frame is Z-down, right handed (NED), global frame is Z-up, right handed (ENU). See alsohttp://qgroundcontrol.org/mavlink/waypoint_protocol.+

                            Field Name	Type	Description
                            target_system	uint8_t	System ID
                            target_component	uint8_t	Component ID
                            seq	uint16_t	Waypoint ID (sequence number). Starts at zero. Increases monotonically for each waypoint, no gaps in the sequence (0,1,2,3,4).
                            frame	uint8_t	The coordinate system of the waypoint. see MAV_FRAME in mavlink_types.h (Enum:MAV_FRAME )
                            command	uint16_t	The scheduled action for the waypoint. see MAV_CMD in common.xml MAVLink specs (Enum:MAV_CMD )
                            current	uint8_t	false:0, true:1
                            autocontinue	uint8_t	autocontinue to next wp
                            param1	float	PARAM1, see MAV_CMD enum
                            param2	float	PARAM2, see MAV_CMD enum
                            param3	float	PARAM3, see MAV_CMD enum
                            param4	float	PARAM4, see MAV_CMD enum
                            x	int32_t	PARAM5 / local: x position in meters * 1e4, global: latitude in degrees * 10^7
                            y	int32_t	PARAM6 / y position: local: x position in meters * 1e4, global: longitude in degrees *10^7
                            z	float	PARAM7 / z position: global: altitude in meters (relative or absolute, depending on frame.
                            mission_type **	uint8_t	Mission type, see MAV_MISSION_TYPE (Enum:MAV_MISSION_TYPE )

                     */

                    console.log('73 MISSION_ITEM_INT');
                });

                // TODO 74
                robotMAV.on("VFR_HUD", function(message, fields) {
                    /*
                        Metrics typically displayed on a HUD for fixed wing aircraft
                            Field Name	Type	Description
                            airspeed	float	Current airspeed in m/s (Units: m/s)
                            groundspeed	float	Current ground speed in m/s (Units: m/s)
                            heading	int16_t	Current heading in degrees, in compass units (0..360, 0=north) (Units: deg)
                            throttle	uint16_t	Current throttle setting in integer percent, 0 to 100 (Units: %)
                            alt	float	Current altitude (MSL), in meters (Units: m)
                            climb	float	Current climb rate in meters/second (Units: m/s)
                     */
                });

                // TODO !! 77
                robotMAV.on("COMMAND_ACK", function(message, fields) {
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

                    redis_pub.publish('gcs_command_ack_' + robot_id, JSON.stringify(fields));

                    console.log('77 COMMAND_ACK   com:' + fields.command + ', res: ' + fields.result);

                });

                // TODO !! 125
                robotMAV.on("POWER_STATUS", function(message, fields) {
                    /*
                    Vcc	uint16_t	5V rail voltage in millivolts (Units: mV)
                    Vservo	uint16_t	servo rail voltage in millivolts (Units: mV)
                    flags	uint16_t	power supply status flags (see MAV_POWER_STATUS enum) (Enum:MAV_POWER_STATUS )
                     */
                });

                // TODO 141
                robotMAV.on("ALTITUDE", function(message, fields) {
                    console.log('141 ALTITUDE');
                });

                // TODO 148
                robotMAV.on("AUTOPILOT_VERSION", function(message, fields) {
                    console.log('148 AUTOPILOT_VERSION');
                });

                // TODO 149
                robotMAV.on("LANDING_TARGET", function(message, fields) {
                    console.log('149 LANDING_TARGET');
                });

                // TODO 152
                robotMAV.on("MEMINFO", function(message, fields) {

                });

                // TODO 163
                robotMAV.on("AHRS", function(message, fields) {

                });

                // TODO 165
                robotMAV.on("HWSTATUS", function(message, fields) {

                });

                // TODO 241
                robotMAV.on("VIBRATION", function(message, fields) {
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
                robotMAV.on("HOME_POSITION", function(message, fields) {
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

                // TODO 244
                robotMAV.on("MESSAGE_INTERVAL", function(message, fields) {
                    /*
                        message_id	uint16_t	The ID of the requested MAVLink message. v1.0 is limited to 254 messages.
                        interval_us	int32_t	The interval between two messages, in microseconds. A value of -1 indicates this stream is disabled, 0 indicates it is not available, > 0 indicates the interval at which it is sent. (Units: us)
                     */
                });

                // TODO !! 253
                robotMAV.on("STATUSTEXT", function(message, fields) {
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

                    console.log('253 STATUSTEXT:     ' + fields.severity + ' ' + fields.text + '    io:' + io_client.id);

                    // TODO
                    // сохранить текстовые сообщения в БД по дате и вывести в панель последние 10


                });


                // TODO отправить PING на борт и получить ответ, посчитать время
                /*

                setInterval(function(){


                    robotMAV.createMessage("MISSION_REQUEST_LIST",
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
                telem_interval = setInterval(function(){
                    let timestamp_now = (new Date()).getTime();

                    if( timestamp_now < telemetry.last_msg_timestamp + 3000 ){
                        // update server time
                        telemetry.server_time = timestamp_now;
                        // send message to room (web client uses this data to update realtime telemetry on screen
                        io_client.volatile.to(robot_io_telemetry_room).emit('telem_' +  robot_id, telemetry);
                    }

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

    // client disconnected
    io_client.on('disconnect', function(){
        console.log('client disconnected');

        // TODO проверить онлайн по таймеру

        if( robot_id ){
            io_client.leave(robot_io_telemetry_room);

            redisClient.hset(robot_status_key, 'online', 0);
            redisClient.hset(robot_status_key, 'io_id', 0);

            if( redis_sub ){
                redis_sub.unsubscribe('gcs_command_to_' + robot_id);
            }
        }

        if( telem_interval ) clearInterval(telem_interval);

        io_client.disconnect(true);

        redis_sub = null;
        redis_pub = null;

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



/*
com 11 = set mode
SET_MODE ( #11 )   THIS INTERFACE IS DEPRECATED



 */



/*

        //
        // In case a web client connected
        else if( gcs_id ) {
            console.log('GCS');

            redisClient.get('user_id_for_gcs_' + gcs_id, function(err, user_id) {
                if( !user_id ){
                    console.log('gcs user not found ' + gcs_id);
                    io_client.disconnect(true);
                }
                else {
                    // get all robots of our client
                    RobotModel.filter({user_id: user_id}).run().then(function(result) {
                        for( let i = 0; i < result.length; i++ ){
                            io_client.join('robot_' + result[i].id);
                        }

                        console.log('gcs ' + gcs_id + ' joined ' + result.length + ' robots');

                        io_client.on('arming', function(data){
                            console.log('arming');
                            console.log(data);

                            // TODO send arming MAVlink to board

                            robotMAV.createMessage("COMMAND_LONG", {
                                'target_system': config.BOARD_SYS_ID
                                ,'target_component': config.BOARD_COMP_ID
                                ,'command': 400 // arm/disarm
                                ,'confirmation': 0
                                ,'param1': 1 // arm
                                ,'param2': null
                                ,'param3': null
                                ,'param4': null
                                ,'param5': null
                                ,'param6': null
                                ,'param7': null
                            }, function(message){
                                io_server.to('robot_' + data).emit('fromserver', message.buffer);

                                // TODO зарегистрировать отправку сообщения и подождать подтверждения

                            });



                        });

                    });

                    // now web client will receive messages from all its robots
                }
            });

        }


 */



// Server useful MAVLINK commands
/*
    PARAM_REQUEST_READ ( #20 )
    PARAM_REQUEST_LIST ( #21 )

    PARAM_SET ( #23 )
        Set a parameter value TEMPORARILY to RAM. It will be reset to default on system reboot.
        ** Send the ACTION MAV_ACTION_STORAGE_WRITE to PERMANENTLY write the RAM contents to EEPROM. **

    COMMAND_INT ( #75 )
        Message encoding a command with parameters as scaled integers. Scaling depends on the actual command value.

    COMMAND_LONG ( #76 )
        Send a command with up to seven parameters to the MAV

    MISSION_REQUEST_LIST ( #43 )
        Request the overall list of mission items from the system/component.

        MISSION_COUNT ( #44 )
        This message is emitted as response to MISSION_REQUEST_LIST by the MAV and to initiate a write transaction.
        The GCS can then request the individual mission item based on the knowledge of the total number of waypoints.
        count	uint16_t	Number of mission items in the sequence

    MISSION_REQUEST_PARTIAL_LIST ( #37 )

    MISSION_WRITE_PARTIAL_LIST ( #38 )

    MISSION_REQUEST ( #40 )
        Request the information of the mission item with the sequence number seq.
        The response of the system to this message should be a MISSION_ITEM message.

    MISSION_REQUEST_INT ( #51 )
        Request the information of the mission item with the sequence number seq.
        The response of the system to this message should be a MISSION_ITEM_INT message.

    MISSION_SET_CURRENT ( #41 )
        Set the mission item with sequence number seq as current item.
        This means that the MAV will continue to this mission item on the shortest path
        (not following the mission items in-between).

    MISSION_CLEAR_ALL ( #45
        Delete all mission items at once.



COMMANDS


21	MAV_CMD_NAV_LAND	Land at location
    Mission Param #1	Abort Alt
    Mission Param #2	Precision land mode. (0 = normal landing, 1 = opportunistic precision landing, 2 = required precsion landing)
    Mission Param #3	Empty
    Mission Param #4	Desired yaw angle. NaN for unchanged.
    Mission Param #5	Latitude
    Mission Param #6	Longitude
    Mission Param #7	Altitude (ground level)


22	MAV_CMD_NAV_TAKEOFF	Takeoff from ground / hand
    Mission Param #1	Minimum pitch (if airspeed sensor present), desired pitch without sensor
    Mission Param #2	Empty
    Mission Param #3	Empty
    Mission Param #4	Yaw angle (if magnetometer present), ignored without magnetometer. NaN for unchanged.
    Mission Param #5	Latitude
    Mission Param #6	Longitude
    Mission Param #7	Altitude


176	MAV_CMD_DO_SET_MODE	Set system mode.
    Mission Param #1	Mode, as defined by ENUM MAV_MODE
    Mission Param #2	Custom mode - this is system specific, please refer to the individual autopilot specifications for details.
    Mission Param #3	Custom sub mode - this is system specific, please refer to the individual autopilot specifications for details.
    Mission Param #4	Empty
    Mission Param #5	Empty
    Mission Param #6	Empty
    Mission Param #7	Empty

        MAV_MODE
            0	MAV_MODE_PREFLIGHT	System is not ready to fly, booting, calibrating, etc. No flag is set.
            80	MAV_MODE_STABILIZE_DISARMED	System is allowed to be active, under assisted RC control.
            208	MAV_MODE_STABILIZE_ARMED	System is allowed to be active, under assisted RC control.
            64	MAV_MODE_MANUAL_DISARMED	System is allowed to be active, under manual (RC) control, no stabilization
            192	MAV_MODE_MANUAL_ARMED	System is allowed to be active, under manual (RC) control, no stabilization
            88	MAV_MODE_GUIDED_DISARMED	System is allowed to be active, under autonomous control, manual setpoint
            216	MAV_MODE_GUIDED_ARMED	System is allowed to be active, under autonomous control, manual setpoint
            92	MAV_MODE_AUTO_DISARMED	System is allowed to be active, under autonomous control and navigation (the trajectory is decided onboard and not pre-programmed by waypoints)
            220	MAV_MODE_AUTO_ARMED	System is allowed to be active, under autonomous control and navigation (the trajectory is decided onboard and not pre-programmed by waypoints)


179	MAV_CMD_DO_SET_HOME	Changes the home location either to the current location or a specified location.
    Mission Param #1	Use current (1=use current location, 0=use specified location)
    Mission Param #2	Empty
    Mission Param #3	Empty
    Mission Param #4	Empty
    Mission Param #5	Latitude
    Mission Param #6	Longitude
    Mission Param #7	Altitude


209	MAV_CMD_DO_MOTOR_TEST	Mission command to perform motor test
    Mission Param #1	motor number (a number from 1 to max number of motors on the vehicle)
    Mission Param #2	throttle type (0=throttle percentage, 1=PWM, 2=pilot throttle channel pass-through. See MOTOR_TEST_THROTTLE_TYPE enum)
    Mission Param #3	throttle
    Mission Param #4	timeout (in seconds)
    Mission Param #5	motor count (number of motors to test to test in sequence, waiting for the timeout above between them; 0=1 motor, 1=1 motor, 2=2 motors...)
    Mission Param #6	motor test order (See MOTOR_TEST_ORDER enum)
    Mission Param #7	Empty


300	MAV_CMD_MISSION_START	start running a mission
    Mission Param #1	first_item: the first mission item to run
    Mission Param #2	last_item: the last mission item to run (after this item is run, the mission ends)



400	MAV_CMD_COMPONENT_ARM_DISARM	Arms / Disarms a component
    Mission Param #1	1 to arm, 0 to disarm


410	MAV_CMD_GET_HOME_POSITION	Request the home position from the vehicle.
    Mission Param #1	Reserved
    Mission Param #2	Reserved
    Mission Param #3	Reserved
    Mission Param #4	Reserved
    Mission Param #5	Reserved
    Mission Param #6	Reserved
    Mission Param #7	Reserved


510	MAV_CMD_GET_MESSAGE_INTERVAL	Request the interval between messages for a particular MAVLink message ID
    Mission Param #1	The MAVLink message ID


511	MAV_CMD_SET_MESSAGE_INTERVAL	Request the interval between messages for a particular MAVLink message ID. This interface replaces REQUEST_DATA_STREAM
    Mission Param #1	The MAVLink message ID
    Mission Param #2	The interval between two messages, in microseconds. Set to -1 to disable and 0 to request default rate.







MAV_TYPE

CMD ID	Field Name	Description
0	MAV_TYPE_GENERIC	Generic micro air vehicle.
1	MAV_TYPE_FIXED_WING	Fixed wing aircraft.
2	MAV_TYPE_QUADROTOR	Quadrotor
3	MAV_TYPE_COAXIAL	Coaxial helicopter
4	MAV_TYPE_HELICOPTER	Normal helicopter with tail rotor.
5	MAV_TYPE_ANTENNA_TRACKER	Ground installation
6	MAV_TYPE_GCS	Operator control unit / ground control station
7	MAV_TYPE_AIRSHIP	Airship, controlled
8	MAV_TYPE_FREE_BALLOON	Free balloon, uncontrolled
9	MAV_TYPE_ROCKET	Rocket
10	MAV_TYPE_GROUND_ROVER	Ground rover
11	MAV_TYPE_SURFACE_BOAT	Surface vessel, boat, ship
12	MAV_TYPE_SUBMARINE	Submarine
13	MAV_TYPE_HEXAROTOR	Hexarotor
14	MAV_TYPE_OCTOROTOR	Octorotor
15	MAV_TYPE_TRICOPTER	Tricopter
16	MAV_TYPE_FLAPPING_WING	Flapping wing
17	MAV_TYPE_KITE	Kite
18	MAV_TYPE_ONBOARD_CONTROLLER	Onboard companion controller
19	MAV_TYPE_VTOL_DUOROTOR	Two-rotor VTOL using control surfaces in vertical operation in addition. Tailsitter.
20	MAV_TYPE_VTOL_QUADROTOR	Quad-rotor VTOL using a V-shaped quad config in vertical operation. Tailsitter.
21	MAV_TYPE_VTOL_TILTROTOR	Tiltrotor VTOL
22	MAV_TYPE_VTOL_RESERVED2	VTOL reserved 2
23	MAV_TYPE_VTOL_RESERVED3	VTOL reserved 3
24	MAV_TYPE_VTOL_RESERVED4	VTOL reserved 4
25	MAV_TYPE_VTOL_RESERVED5	VTOL reserved 5
26	MAV_TYPE_GIMBAL	Onboard gimbal
27	MAV_TYPE_ADSB	Onboard ADSB peripheral
28	MAV_TYPE_PARAFOIL	Steerable, nonrigid airfoil
29	MAV_TYPE_DODECAROTOR	Dodecarotor




MAV_AUTOPILOT

Micro air vehicle / autopilot classes. This identifies the individual model.
CMD ID	Field Name	Description
0	MAV_AUTOPILOT_GENERIC	Generic autopilot, full support for everything
1	MAV_AUTOPILOT_RESERVED	Reserved for future use.
2	MAV_AUTOPILOT_SLUGS	SLUGS autopilot, http://slugsuav.soe.ucsc.edu
3	MAV_AUTOPILOT_ARDUPILOTMEGA	ArduPilotMega / ArduCopter, http://diydrones.com
4	MAV_AUTOPILOT_OPENPILOT	OpenPilot, http://openpilot.org
5	MAV_AUTOPILOT_GENERIC_WAYPOINTS_ONLY	Generic autopilot only supporting simple waypoints
6	MAV_AUTOPILOT_GENERIC_WAYPOINTS_AND_SIMPLE_NAVIGATION_ONLY	Generic autopilot supporting waypoints and other simple navigation commands
7	MAV_AUTOPILOT_GENERIC_MISSION_FULL	Generic autopilot supporting the full mission command set
8	MAV_AUTOPILOT_INVALID	No valid autopilot, e.g. a GCS or other MAVLink component
9	MAV_AUTOPILOT_PPZ	PPZ UAV - http://nongnu.org/paparazzi
10	MAV_AUTOPILOT_UDB	UAV Dev Board
11	MAV_AUTOPILOT_FP	FlexiPilot
12	MAV_AUTOPILOT_PX4	PX4 Autopilot - http://pixhawk.ethz.ch/px4/
13	MAV_AUTOPILOT_SMACCMPILOT	SMACCMPilot - http://smaccmpilot.org
14	MAV_AUTOPILOT_AUTOQUAD	AutoQuad -- http://autoquad.org
15	MAV_AUTOPILOT_ARMAZILA	Armazila -- http://armazila.com
16	MAV_AUTOPILOT_AEROB	Aerob -- http://aerob.ru
17	MAV_AUTOPILOT_ASLUAV	ASLUAV autopilot -- http://www.asl.ethz.ch
18	MAV_AUTOPILOT_SMARTAP	SmartAP Autopilot - http://sky-drones.com



MAV_MODE_FLAG

These flags encode the MAV mode.
CMD ID	Field Name	Description
128	MAV_MODE_FLAG_SAFETY_ARMED	0b10000000 MAV safety set to armed. Motors are enabled / running / can start. Ready to fly. Additional note: this flag is to be ignore when sent in the command MAV_CMD_DO_SET_MODE and MAV_CMD_COMPONENT_ARM_DISARM shall be used instead. The flag can still be used to report the armed state.
64	MAV_MODE_FLAG_MANUAL_INPUT_ENABLED	0b01000000 remote control input is enabled.
32	MAV_MODE_FLAG_HIL_ENABLED	0b00100000 hardware in the loop simulation. All motors / actuators are blocked, but internal software is full operational.
16	MAV_MODE_FLAG_STABILIZE_ENABLED	0b00010000 system stabilizes electronically its attitude (and optionally position). It needs however further control inputs to move around.
8	MAV_MODE_FLAG_GUIDED_ENABLED	0b00001000 guided mode enabled, system flies waypoints / mission items.
4	MAV_MODE_FLAG_AUTO_ENABLED	0b00000100 autonomous mode enabled, system finds its own goal positions. Guided flag can be set or not, depends on the actual implementation.
2	MAV_MODE_FLAG_TEST_ENABLED	0b00000010 system has a test mode enabled. This flag is intended for temporary system tests and should not be used for stable implementations.
1	MAV_MODE_FLAG_CUSTOM_MODE_ENABLED	0b00000001 Reserved for future use.



 */