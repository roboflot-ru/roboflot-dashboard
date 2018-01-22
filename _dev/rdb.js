/**
 * Created by nee on 09.01.2018.
 */

const r = require('rethinkdb');

let connection = null;

r.connect( {host: 'localhost', port: 28015}, function(err, conn) {
    if (err) throw err;
    connection = conn;


    r.db('test').tableCreate('robots').run(connection, function(err, result) {
        if (err) throw err;
        console.log(JSON.stringify(result, null, 2));
    });

});






