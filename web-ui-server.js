//
//
//
const config = require('./config');

const express = require('express');
const session = require('express-session');
const RedisStore = require('connect-redis')(session);
const bodyParser = require('body-parser');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

const scrypt = require("scrypt");
const scryptParameters = scrypt.paramsSync(0.1);

const crypto = require('crypto');

/*
//const thinky = require('thinky')(); // {db: 'test'}
//const r = thinky.r; // r: An instance of rethinkdbdash
//const tErrors = thinky.Errors;
//const r = require('rethinkdb');
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

                // TODO save user data to session and redis

                req.session.login = true;
                req.session.userid = result[0].id;
                req.session.name = result[0].name;
                req.session.email = req.body.email;
                req.session.gcsid = crypto.randomBytes(16).toString('hex');

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
    req.session.destroy();

    console.log('session destroyed');

    res.json(null);

});

// TODO remind password




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




// V. 1
// Запуск сервера
const http_server = app.listen(config.web_ui_server_port, () => {
    console.log('Listening on port ' + config.web_ui_server_port);
});


// V.1
// Движения на выходе
process.on('SIGINT', exit);
function exit() {
    process.exit();
}