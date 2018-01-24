import "./styles/app.css";
import {JetApp, plugins} from "webix-jet";
import {authModel} from "models/authModel";
import {auth} from "plugins/auth";

webix.ready(() => {
	console.log('webix ready');

	var app = new JetApp({
		start: '/app/dashboard'
        //,routerPrefix: ''
        ,debug: true
        //,views: {
        //    "start" : "area.list" // load /views/area/list.js
        //}
        //routes: {
        //    "/hi"     : "/top/about",
        //    "/form" : "/top/area.left.form",
        //    "/list" : "/top/area.list",
        //}
	});

	window.testapp = app;

    app.render();

    app.use(auth, {model: new authModel()});
    //app.use(auth, {model: session});


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
