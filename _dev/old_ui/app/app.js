/*
    This is starting point of app
 */


// Connecting to IO server
const socket = io('http://hub.roboflot.ru:3000?web_id=1');

// Get config file
require(['config'], function() {

    // And then get webix
    require(['webix'], function() {

        //
        // starting app on webix ready
        webix.ready(function() {
            require(['views', 'controllers'], function(views, controllers){

                //
                // start main view
                webix.ui(views.main_view);

                //
                // init views with controllers and events
                views.init(controllers);

                //
                // authorizing user and load robots list
                controllers.user_login();

                //
                // Log io connection state
                socket.on('connect', function(){
                    console.log('socket connected');
                });
                socket.on('disconnect', function(){
                    console.log('socket disconnected');
                });

            });
        });
    });
});