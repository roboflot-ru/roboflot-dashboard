import * as Cookies from "js-cookie";

export class authModel {


    /*
    status() {
        return new Promise(function(resolve, reject) {
            resolve(this.credentials);
        });
    };
    //*/

    //*
    status_server(){
        console.log('status server');
        return webix.ajax().get("/api/login").then(a => a.json());
    }

    status_local(){
        console.log('status local');
        if( !this.credentials ){
            console.log('empty data... getting cookie');
            this.credentials = Cookies.getJSON("user");
        }

        return new Promise(function(resolve, reject) {
            resolve(this.credentials);
        });
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
    };



    logout() {
        this.credentials = {};
        Cookies.remove("user");

        webix.ajax().post("/api/logout", {});

    };
}
