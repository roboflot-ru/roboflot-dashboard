//
//  Вебсервер для общения с панелью управления
//
const port_to_listen = 8081;

const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io_server')(http);

const r = require('rethinkdb');


app.use(express.static('web-ui'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));


// TODO

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
            console.log(JSON.stringify(result, null, 2));

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


/*

https://rethinkdb.com/docs/guide/javascript/


rethinkdb.table('authors').run(connection, function(err, cursor) {
    if (err) throw err;
    cursor.toArray(function(err, result) {
        if (err) throw err;
        console.log(JSON.stringify(result, null, 2));
    });
});

rethinkdb.table('authors').filter(rethinkdb.row('name').eq("William Adama")).
    run(connection, function(err, cursor) {
        if (err) throw err;
        cursor.toArray(function(err, result) {
            if (err) throw err;
            console.log(JSON.stringify(result, null, 2));
        });
    });

rethinkdb.table('authors').get('7644aaf2-9928-4231-aa68-4e65e31bf219').
    run(connection, function(err, result) {
        if (err) throw err;
        console.log(JSON.stringify(result, null, 2));
    });


 */

// Web-клиент подписывается на телеметрию робота и показывает ее

/*
// Соединение с клиентом
io_server.on('connection', function(socket){
    console.log('a user connected');

    // приветсвенное сообщение
    socket.emit('hello', 'hello from server');

    // клиент отсоединился
    socket.on('disconnect', function(){
        console.log('user disconnected');
    });

    // пришло сообщение
    socket.on('hello', function(msg){
        console.log(msg);
    });

    socket.join('some_room');

    io_server.to('some_room').emit('some event');

    /*
    io_server.on('connection', function(socket){
      socket.on('say to someone', function(id, msg){
        socket.broadcast.to(id).emit('my message', msg);
      });
    });
     *

});
*/


let connection = null;
r.connect( {host: 'localhost', port: 28015}, function(err, conn) {
    if (err) throw err;
    connection = conn;
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


// V. 1
// Запуск сервера
const http_server = app.listen(port_to_listen, () => {
    console.log('Listening on port ' + port_to_listen);
});


// V.1
// Движения на выходе
process.on('SIGINT', exit);
function exit() {
    process.exit();
}