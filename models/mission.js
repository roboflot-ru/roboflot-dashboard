const thinky = require('./../util/thinky.js');
const type = thinky.type;
const r = thinky.r;



const Mission = thinky.createModel("Missions", {
    id: type.string()
    ,name: type.string().min(2).max(50).required()
    ,user_id: type.string()
    ,home: type.point()
    ,rtl_end: type.boolean().default(true)
    ,takeoff_alt: type.number().min(0).max(1000).default(10)
    ,createdAt: type.date().default(r.now())
});

module.exports = Mission;

const User = require('./user');
Mission.belongsTo(User, "user", "user_id", "id");

const MissionItem = require('./mission_item');
Mission.hasMany(MissionItem, "items", "id", "mission_id");











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