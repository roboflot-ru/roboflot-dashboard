/**
 * Created by nee on 09.01.2018.
 */

const r = require('rethinkdb');

let connection = null;

r.connect( {host: 'localhost', port: 28015}, function(err, conn) {
    if (err) throw err;
    connection = conn;


    /*
    r.db('test').tableCreate('robots').run(connection, function(err, result) {
        if (err) throw err;
        console.log(JSON.stringify(result, null, 2));
    });
    */


    r.table('robots').insert([
        { name: "William Adama", tv_show: "Battlestar Galactica",
          posts: [
            {title: "Decommissioning speech", content: "The Cylon War is long over..."},
            {title: "We are at war", content: "Moments ago, this ship received word..."},
            {title: "The new Earth", content: "The discoveries of the past few days..."}
          ]
        },
        { name: "Laura Roslin", tv_show: "Battlestar Galactica",
          posts: [
            {title: "The oath of office", content: "I, Laura Roslin, ..."},
            {title: "They look like us", content: "The Cylons have the ability..."}
          ]
        },
        { name: "Jean-Luc Picard", tv_show: "Star Trek TNG",
          posts: [
            {title: "Civil rights", content: "There are some words I've known since..."}
          ]
        }
    ]).run(connection, function(err, result) {
        if (err) throw err;
        console.log(JSON.stringify(result, null, 2));
    });

});






