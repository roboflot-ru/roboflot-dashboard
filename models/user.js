const thinky = require('./../util/thinky.js');
const type = thinky.type;
const r = thinky.r;

const User = thinky.createModel("User", {
    id: type.string(),
    name: type.string().min(2).max(50),
    email: type.string().email().min(2).max(60).required(),
    hashed_pass: type.buffer().required(),
    createdAt: type.date().default(r.now())
    //age: type.number()
});

module.exports = User;


//var Account = require(__dirname+'/models/account.js');
//User.hasOne(Account, "user", "id", "userId");

/*

// file: models/all.js
module.exports = {
    Account: require(__dirname+'/models/account.js');
    User: require(__dirname+'/models/user.js');
};

var User = thinky.createModel("User", {
    id: type.string(),
    contact: {
        email: type.string(),
        phone: type.string()
    },
    age: type.number()
    nickname: type.string().default(function() {
        return this.firstname;
    }}
});


var Game = thinky.createModel("Game", {
    id: type.string(),
    name: type.string(),
    scores: [type.number()]
    game: [{
        score: type.number(),
        winner: type.string()
    }]
});



 */