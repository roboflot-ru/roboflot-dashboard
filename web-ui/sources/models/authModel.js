import * as Cookies from "js-cookie";

export class authModel {
    constructor(){
        this.credentials = null;

        this.io_connected = false;

    }

    status_server(){
        console.log('status server');
        return webix.ajax().get("/api/login").then(a => a.json());
    }

    status_local(){
        console.log('status local');

        if( !this.credentials ){
            console.log('empty data... getting cookie');

            this.credentials = Cookies.getJSON("user");
            console.log(this.credentials);
        }
        // TODO сделать проверку времени

        return this.credentials;
    }


    login(email, pass) {
        console.log('auth model');

        /*
        return webix.ajax().post("/api/login", {
            email, pass
        }).then(a => a.json());
        */


        return new Promise((resolve, reject) => {
            webix.ajax().post("/api/login", {
                email, pass
            }).then(a => {
                this.credentials = a.json();
                Cookies.set("user", this.credentials);
                resolve(this.credentials)
            });

        });
    }


    logout() {
        this.credentials = {};
        Cookies.remove("user");

        webix.ajax().post("/api/logout", {});

    }


    getGCSid() {
        return this.credentials ? this.credentials.gcsid : null;
    }

    io_connect(app){
        /*
        const socketio = io('http://localhost:3000?web_id=11');

        socketio.on('connect', function(){
            console.log('socket connected');
        });
        socketio.on('disconnect', function(){
            console.log('socket disconnected');
        });
        */

        //console.log(this.credentials);

        if( this.credentials ){
            console.log('io connect with gcsid ' + this.credentials.gcsid);

            app.socketio = app.io({query: {gcs_id: this.credentials.gcsid}});

            app.socketio.on('connect', function(){
                console.log('socketio CONNECTED');
            });
            app.socketio.on('disconnect', function(){
                console.log('socketio DISCONNECTED');
            });
        }
        else {
            console.log('io NOT connected');
        }

        //console.log('io connect');
        //console.log(this);
        //console.log(app);
    }

}

/*
    status() {
        return new Promise(function(resolve, reject) {
            resolve(this.credentials);
        });
    };
    //*/