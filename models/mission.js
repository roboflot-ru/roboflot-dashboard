const thinky = require('./../util/thinky.js');
const type = thinky.type;
const r = thinky.r;



const Mission = thinky.createModel("Missions", {
    id: type.string()
    ,name: type.string().min(2).max(50).required()
    ,user_id: type.string()
    ,createdAt: type.date().default(r.now())
});

module.exports = Mission;

const User = require('./user');
Mission.belongsTo(User, "user", "user_id", "id");












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