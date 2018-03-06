//
//
//
const config = require('./config');

const http = require('http');
const express = require('express');
const session = require('express-session');
const RedisStore = require('connect-redis')(session);
const bodyParser = require('body-parser');
const app = express();
const server = new http.Server(app);

const scrypt = require("scrypt");
const scryptParameters = scrypt.paramsSync(0.1);

const crypto = require('crypto');

/*
const webpack = require('webpack');
const webpackConfig = require('./web-ui/webpack.config');
const compiler = webpack(webpackConfig);
*/

/*
//const thinky = require('thinky')(); // {db: 'test'}
//const r = thinky.r; // r: An instance of rethinkdbdash
//const tErrors = thinky.Errors;
//const r = require('rethinkdb');
 */

// Socket.io_server server init
const io_server = require('socket.io')(server);
const io_redis_adapter = require('socket.io-redis');
io_server.adapter(io_redis_adapter({ host: config.redis_host, port: config.redis_port }));


// Redis client init
const redis = require('redis');
const redisClient = redis.createClient({ host: config.redis_host, port: config.redis_port });
redisClient.on('ready',function() {
    console.log("Redis is ready");
});
redisClient.on('error',function() {
    console.log("Error in Redis");
});

const redis_sub = redisClient.duplicate();
const redis_pub = redisClient.duplicate();

redis_sub.subscribe('gcs_commands_ack');

/*
app.use(require('webpack-dev-middleware')(compiler, {
  noInfo: true,
  publicPath: webpackConfig.output.publicPath,
}));
app.use(require('webpack-hot-middleware')(compiler));
*/



// Redis session init
app.use(session({
    store: new RedisStore({host: config.redis_host, port: config.redis_port})
    ,name: 'sid'
    ,secret: config.session_secret
    //,cookie: {} // default { path: '/', httpOnly: true, secure: false, maxAge: null } (domain, expires, httpOnly, maxAge, path, secure, sameSite)
    ,resave: false
    ,saveUninitialized: false
    ,genid: function(req) {
        return crypto.randomBytes(48).toString('hex');
    }
}));


// static files init
app.use(express.static(__dirname + '/web-ui'));


// JSON parse init
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));


//
// User model
const User = require('./models/user.js');

//
// Signup
app.post('/api/signup', function (req, res) {

    // check if email already exists
    User.filter({email: req.body.email}).run().then(function(result) {
        // exists
        if( result.length ){

            res.json({status: 'error', message: 'This email already registered. Please try password reminder.'});

        }

        // not exists
        else {
            try {
                // hash user's password to save to DB
                const hashed_pass = scrypt.kdfSync(req.body.pass, scryptParameters); //should be wrapped in try catch

                // Create a new user
                const user = new User({
                    email: req.body.email
                    ,hashed_pass: hashed_pass
                });

                user.save().then(function(doc) {

                    console.log('user registered ' + doc.id);

                    res.json({status: 'success', message: ''});

                }).error(console.log);

                //console.log(hashed_pass);

            }
            catch (e){
                console.log('scrypt error');
                console.log(e);
                res.json({status: 'error', message: 'Unknown error'});
            }
        }
    });

});


// sign in
app.post('/api/login', function (req, res) {
    console.log('post login ' + req.session.id);

    User.filter({email: req.body.email}).run().then(function(result) {
        // user does not exists
        if( !result.length ){

            res.json(null);

        }

        // check password else
        else {
            if( scrypt.verifyKdfSync(result[0].hashed_pass, req.body.pass) ){

                // save user data to session
                req.session.login = true;
                req.session.userid = result[0].id;
                req.session.name = result[0].name;
                req.session.email = req.body.email;
                req.session.gcsid = crypto.randomBytes(16).toString('hex');

                // save gcsid to redis to make socket.io communication robot <=> client
                // TODO ограничить время, чтобы постоянно не висело в памяти и придумать процесс смены gcsid
                redisClient.set('user_id_for_gcs_' + req.session.gcsid, req.session.userid);

                // return data what client user.getUser() will have
                res.json({
                    email: req.session.email
                    ,name: req.session.name
                    ,gcsid: req.session.gcsid
                });

            }
            else {
                res.json(null);
            }
        }
    });

});


// check status
app.get('/api/login', function (req, res) {
    if( req.session.login ){
        res.json({
            email: req.session.email
            ,name: req.session.name
            ,gcsid: req.session.gcsid
        });
    }
    else {
        res.json(null);
    }

});


// log OUT
app.post('/api/logout', function (req, res){
    redisClient.del('gcs_id_' + req.session.gcsid);

    req.session.destroy();

    console.log('session destroyed');

    res.json(null);

});

// TODO remind password


//
// Robot model
const RobotModel = require('./models/robot.js');

//
// Creating new robot
app.post('/api/robots/', function (req, res) {
    if( !req.session.login ){
        res.status(401).json({status: 'unauthorized'});
        return;
    }

    console.log('saving new robot ' + req.session.id);

    if( req.body.name ){
        // Create new robot
        const new_robot = new RobotModel({
            name: req.body.name
            ,color: req.body.color.replace('#','') || 'ffffff'
            ,batt_v: req.body.batt_v || 11.1
            ,user_id: req.session.userid
        });

        try{
            new_robot.validate();

            new_robot.save().then(function(doc) {

                console.log('robot registered ' + doc.id);

                res.json({status: 'success', data: doc});

            }).error( e => {
                console.log(e);

                res.json({status: 'error', message: 'DB error'});
            });
        }
        catch(err) {
            console.log("robot is not valid");
            console.log(err);
            console.log(req.body);
            res.json({status: 'error', message: 'Check fields'});
        }


    } else {
        res.json({status: 'error', message: 'Check fields'});
    }

});

//
// Robots list
app.get('/api/robots/', function (req, res) {
    if( !req.session.login ){
        res.status(401).json({status: 'unauthorized'});
        return;
    }

    RobotModel.filter({user_id: req.session.userid}).run().then(function(result) {
        res.json(result);
    }).error(function(){
        res.json({status: 'error'});
    });

});

//
// Arming
app.post('/api/robots/:robot_id/arm', function (req, res) {
    if( !req.session.login ){
        res.status(401).json({status: 'unauthorized'});
        return;
    }

    // TODO
    // 1 отправить сюда нажатие кнопки
    // 2 отправить на борт сообщение arm через redis
    // сделать отправку команды с подтверждением

    /*
    Как это сделать?

    отправить в редис сообщение
    получить его в mav-server и отправить дальше на борт

    или кнопкой отправить сообщение в io и оттуда доделать сообщение и отправить на борт

    как получить подтверждение команды?

     */

    console.log('arming ' + req.params.robot_id);

    const robot_status_key = 'robot_status_' + req.params.robot_id;

    redisClient.hgetall(robot_status_key, function(err, robot_status){
        if( err ){
            res.json({status: 'error', message: 'not found'});
        }
        else {
            if( robot_status.online == 1 && robot_status.user_id == req.session.userid ){
                console.log('robot online');

                let resp_sent = false;


                const timeout_resp = setTimeout(function(){
                    console.log('timeout');
                    res.json({status: 'error', message: 'timeout'});
                    resp_sent= true;

                    redis_sub.unsubscribe('gcs_command_ack_' + req.params.robot_id);

                }, 6000);


                // подписаться на канал подтверждения команды
                redis_sub.subscribe('gcs_command_ack_' + req.params.robot_id);

                // отправить команду на борт
                console.log('sending command');
                redis_pub.publish('gcs_command_to_' + req.params.robot_id, JSON.stringify({
                    command: 'COMMAND_LONG'
                    ,params: {
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
                            }
                }));

                // подождать ответа и вернуть его
                redis_sub.on('message', function(chan, data){
                    if( chan == 'gcs_command_ack_' + req.params.robot_id ){
                        console.log('COMMAND ACK for ' + req.params.robot_id);

                        const command_resp = JSON.parse(data);

                        if( !resp_sent ){
                            resp_sent = true;
                            console.log('sending ack');
                            res.json({status: 'success', message: 'result = ' + command_resp.result});
                        }

                        clearTimeout(timeout_resp);
                        redis_sub.unsubscribe('gcs_command_ack_' + req.params.robot_id);
                    }
                });
            }

            else {
                console.log('robot offline');

                res.json({status: 'error', message: 'offline'});
            }
        }
    });



});




//
// MISSIONS
//

const MissionModel = require('./models/mission.js');
const MissionItemModel = require('./models/mission_item.js');
const thinky = require('./util/thinky.js');

// list all missions
app.get('/api/missions/', function (req, res) {
    if( !req.session.login ){
        res.status(401).json({status: 'unauthorized'});
        return;
    }

    MissionModel.filter({user_id: req.session.userid}).orderBy('createdAt').run().then(function(result) {
        res.json(result);
    }).error(function(){
        res.json({status: 'error'});
    });

});

// get single mission data
app.get('/api/missions/:mission_id', function (req, res) {
    if( !req.session.login ){
        res.status(401).json({status: 'unauthorized'});
        return;
    }

    MissionModel.get(req.params.mission_id).getJoin({
        items: {
          _apply: function (sequence) {
            return sequence.orderBy(thinky.r.asc('seq'))
          }
        }
    }).run().then(function(mission) {
        if( mission.user_id != req.session.userid ){
            res.json({status: 'error'});
        }
        else {
            let items = [], pos = null;
            for( let i = 0, k = mission.items.length; i < k; i++ ){

                if( mission.items[i].position.coordinates ) pos = {lat: mission.items[i].position.coordinates[0], lng: mission.items[i].position.coordinates[1]};

                items.push({
                    id: mission.items[i].id
                    ,seq: mission.items[i].seq
                    ,position: pos
                    ,alt: mission.items[i].alt
                    ,alt_rel: mission.items[i].alt_rel
                    ,hold_time: mission.items[i].hold_time
                    ,speed: mission.items[i].speed
                });
            }

            let home = null;
            if( mission.home && mission.home.coordinates ){
                home = { lat: mission.home.coordinates[0], lng: mission.home.coordinates[1] };
            }

            res.json({
                status: 'success'
                ,data: {
                     name: mission.name
                    ,rtl_end: mission.rtl_end
                    ,takeoff_alt: mission.takeoff_alt
                    ,home: home
                    ,items: items
                }
            });
        }
    }).error(function(){
        res.json({status: 'error'});
    });

});

// Save new mission
app.post('/api/missions/', function (req, res) {
    if( !req.session.login ){
        res.status(401).json({status: 'unauthorized'});
        return;
    }

    if( req.body.name ){
        // Create new mission
        const new_mission = new MissionModel({
            name: req.body.name
            ,user_id: req.session.userid
        });

        try{
            new_mission.validate();

            new_mission.save().then(function(doc) {
                console.log('mission saved ' + doc.id);
                res.json({ status: 'success', id: doc.id, name: req.body.name });
            }).error( e => {
                console.log('mission save error');
                res.json({status: 'error', message: 'error'});
            });
        }
        catch(err) {
            console.log("mission is not valid");
            res.json({status: 'error', message: 'Check fields'});
        }

    } else {
        res.json({status: 'error', message: 'Check fields'});
    }

});

// Update mission data
app.put('/api/missions/:mission_id/update', function (req, res) {
    if( !req.session.login ){
        res.status(401).json({status: 'unauthorized'});
        return;
    }

    //console.log('put mission update ' + req.params.mission_id);
    //console.log(req.body);

    MissionModel.get(req.params.mission_id).run().then(function(mission) {
        // Check user in mission
        if( mission.user_id != req.session.userid ){
            res.json({status: 'error', message: 'error'});
        }

        // Updating mission data
        else {

            // TODO validate fields

            // Update mission name
            if( req.body.name && req.body.name.length > 2 ){
                mission.name = req.body.name;
            }

            // Update takeoff alt
            if( req.body.takeoff_alt && parseInt(req.body.takeoff_alt) > 1 ){
                mission.takeoff_alt = parseInt(req.body.takeoff_alt);
            }

            // Update RTL on mission end
            if( req.body.rtl !== undefined ){
                console.log(req.body.rtl);
                mission.rtl_end = (req.body.rtl == 1);
            }

            // Update home position
            if( req.body.home ){
                const home_pos = JSON.parse(req.body.home);
                if( home_pos.length == 2 ){
                    mission.home = [parseFloat(home_pos[0]), parseFloat(home_pos[1])];
                }
            }

            // Saving data to DB
            mission.save().then(function(doc){
                //console.log('data saved');
                res.json({
                    status: 'success'
                    ,data: {
                        name: doc.name
                        ,rtl_end: doc.rtl_end
                        ,takeoff_alt: doc.takeoff_alt
                        ,home: [doc.home.coordinates[0], doc.home.coordinates[1]]
                    }
                });
            }).error(function(err){
                res.json({status: 'error', message: 'data error'});
            });

        }
    });

});

// Add new waypoints to mission
app.post('/api/missions/:mission_id/waypoints/', function (req, res) {
    if (!req.session.login) {
        res.status(401).json({status: 'unauthorized'});
        return;
    }

    console.log('saving waypoint');
    console.log(req.body);

    // Get mission first
    MissionModel.get(req.params.mission_id).getJoin().run().then(function(mission) {
        if( mission.user_id != req.session.userid ){
            res.json({status: 'error'});
        }
        else {

            // TODO get max seq
            if( mission.items.length ){
                for( let i = 0, k = mission.items.length; i < k; i++ ){
                    console.log(mission.items[i].seq);
                }
            }

            // Then add new waypoint
            const waypoint = new MissionItemModel({
                mission_id: req.params.mission_id
                ,seq: mission.items.length + 1 // TODO how to check?
                ,position: [parseFloat(req.body.lat), parseFloat(req.body.lon)]
                ,alt: req.body.alt
                ,alt_rel: req.body.alt_rel
                ,hold_time: req.body.hold
                ,speed: req.body.speed
            });

            waypoint.save().then(function(doc){
                console.log('waypoint saved');
                res.json({status: 'success'});
            }).error(function(err){
                console.log('error saving waypoint');
                console.log(err);
                res.json({status: 'error'});
            });
        }
    }).error(function(){
        res.json({status: 'error'});
    });


});

// Delete mission
app.delete('/api/missions/:mission_id', function (req, res) {
    if( !req.session.login ){
        res.status(401).json({status: 'unauthorized'});
        return;
    }

    console.log('delete mission ' + req.params.mission_id);


    MissionModel.get(req.params.mission_id).run().then(function(mission) {
        if( mission.user_id != req.session.userid ){
            res.json({status: 'error'});
        }
        else {
            mission.deleteAll({items: true}).then(function(result) {
                if( !result.isSaved() ){
                    res.json({status: 'success'});
                }
                else {
                    res.json({status: 'error'});
                }
            });

        }
    }).error(function(){
        res.json({status: 'error'});
    });

});



//
// Tests
app.get('/api/tests', function (req, res) {
    console.log('test  ' + req.session.id);

    if( !req.session.login ){
        res.status(401).json({status: 'unauthorized'});
        return;
    }

    RobotModel.run().then(function(result) {
        res.json(result);
    });

    //res.json({status: 'error', message: 'ERROR 1'});

});


/*
//
// Получить название робота, сгенерировать id, записать в БД
app.post('/data/robots/', function (req, res) {
    console.log('new robot to save');

    console.log(req.body);

    if( req.body.name && req.body.name.length > 2 ) {
        // Сохранить новые данные в таблицу
        r.table('robots').insert([
            {name: req.body.name}
        ]).run(connection, function (err, result) {
            if (err) throw err;
            //console.log(JSON.stringify(result, null, 2));

            res.json({status: 'success', newid: result.generated_keys[0]});
        });
    }
    else {
        res.json({status: 'error'});
    }

});

//
// Получить запрос на список роботов, отправить список
app.get('/data/robots/', function (req, res) {

    //let list = [];

    r.table('robots').run(connection, function(err, cursor) {
        if (err) throw err;
        cursor.toArray(function(err, result) {
            if (err) throw err;
            console.log(JSON.stringify(result, null, 2));

            res.json({list: result});
        });
    });


});




app.get('/data/table_sales', function (req, res) {
    let data = [
        {day: '2017-07-01', time: '13:21:23', name: 'Карп', weight: 10, price: 12, summ: 120}
        ,{day: '2017-07-01', time: '13:22:23', name: 'Карп', weight: 10, price: 12, summ: 120}
        ,{day: '2017-07-02', time: '13:23:23', name: 'Карп', weight: 10, price: 12, summ: 120}
        ,{day: '2017-07-01', time: '13:24:23', name: 'Карп', weight: 10, price: 12, summ: 120}
        ,{day: '2017-07-03', time: '13:25:23', name: 'Карп', weight: 10, price: 12, summ: 120}
    ];

    res.json(data);
});



// V. 1
// Загрузка таблицы со списком товаров
app.get('/data/table_menu', function (req, res) {

    // Вытянуть данные из таблицы и отправить на страницу
    let data = [];
    res.json(data);

});


// V. 1
// сохранить товары из списка
app.put('/data/table_menu/:menuId', function (req, res) {
    // Сохранить новые данные в таблицу
    //db.run("UPDATE products SET name=?, price=? WHERE id=?", req.body.name, req.body.price, req.body.id, function(){

    //});

    res.json({status: 'ok'});

});

*/



// On socket.io_server client connected (board or web)
io_server.on('connection', function(io_client) {
    console.log('io client connected ' + io_client.handshake.address);

    // Get parameters from socket.io_server connection to find out who is it
    let gcs_id = io_client.handshake.query.gcs_id;

    //
    // In case a web client connected
    if( gcs_id ) {
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
                        io_client.join('robot_telemetry_' + result[i].id); // telemetry room
                    }

                    console.log('gcs ' + gcs_id + ' joined ' + result.length + ' robots');

                    /*
                    io_client.on('arming', function(data){
                        console.log('arming');
                        console.log(data);

                        // TODO send arming MAVlink to board

                        myMAV.createMessage("COMMAND_LONG", {
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
                    */

                });

                // now web client will receive messages from all its robots
            }
        });

    } else {
        console.log('gcs not found ' + gcs_id);
        io_client.disconnect(true);
    }


    // client disconnected
    io_client.on('disconnect', function(){
        console.log('client disconnected');
    });

});





// V. 1
// Запуск сервера
server.listen(config.web_ui_server_port, () => {
    console.log('Listening on port ' + config.web_ui_server_port);
});


// V.1
// Движения на выходе
process.on('SIGINT', exit);
function exit() {
    process.exit();
}