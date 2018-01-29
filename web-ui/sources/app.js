/*

    This is starting point of the web-app

 */

import "./styles/app.css";
import config from './config';

import {JetApp, plugins} from "webix-jet";
import {authModel} from "models/authModel";
import {auth} from "plugins/auth";

import io from 'socket.io-client';


//
// On webix loaded and ready
webix.ready(() => {
	console.log('webix ready');


	//
	// new app constructor
	const app = new JetApp({
		start: '/app/dashboard/list'
        ,io_server: config.io_server
        ,google_maps_api_key: config.google_maps_api_key
        //,routerPrefix: ''
        ,debug: true
        ,views: {
            "new_robot" : "modules.robot_form_new" // load /views/area/list.js
            ,'list': 'modules.robots_list'
            ,'robot': 'modules.robot_dashboard'
        }
        ,routes: {
		    //'/app/dashboard': '/app/dashboard/list'
            //"/app/dashboard/robot": "/app/dashboard/modules.robot_dashboard"
            //"/form" : "/top/area.left.form",
            //"/list" : "/top/area.list",
        }
	});

	app.io = io;
    window.jetapp = app;

	//
	// Handle window resizing
    /*
	const size =  () => document.body.offsetWidth > 800 ? "wide" : "small";
    app.config.size = size();
    webix.event(window, "resize", function(){
        console.log('window resize');

        let newSize = size();
        if (newSize != app.config.size){
            app.config.size = newSize;
            app.refresh();
        }
    });
    */

    //
    // Render app
    app.render();

    //
    // Setting auth plugin
    app.use(auth, {model: new authModel()});




    //app.getService('auth').io_connect();

    //
    //error handlers
	app.attachEvent("app:error:resolve", function(name, error){
		window.console.error(error);
	});
	app.attachEvent("app:error:initview", function(view, error){
		window.console.error(error);
	});
	app.attachEvent("app:error:server", function(error){
		webix.alert({
			width: 450,
			title:"Data saving error",
			text: "Please try to repeat the action <br> if error still occurs, please try to reload the page."
		});
	});

});


// Future features
/*

Responsive layout recipes
    https://webix.gitbooks.io/webix-jet/practice/recipes.html

Dynamic Layout Rebuilding
    https://webix.gitbooks.io/webix-jet/practice/unrecommended.html

 */