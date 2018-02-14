const thinky = require('./../util/thinky.js');
const type = thinky.type;
const r = thinky.r;



const MissionItem = thinky.createModel("MissionItems", {
    id: type.string()
    ,mission_id: type.string().required()
    ,title: type.string().max(50).optional()
    ,seq: type.number().min(0).integer().required()
    ,position: type.point().required()
    ,alt: type.number().required()
    ,alt_rel: type.string().enum('ground', 'home').default('home')
    ,hold_time: type.number().min(0).max(10000).default(0)
    ,speed: type.number().min(0).max(1000).default(0)
    ,camera: type.object()
});

module.exports = MissionItem;

const Mission = require('./mission');
MissionItem.belongsTo(Mission, "mission", "mission_id", "id");












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