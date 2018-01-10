/*

 */

const socket = io('http://hub.roboflot.ru:3000?web_id=1');

require(['config'], function() {
    console.log('2');
    require(['webix'], function() {

        //
        // Когда все готово, запускаем приложение
        webix.ready(function() {
            require(['views','controllers'], function(views, controllers){
                console.log('4');
                //
                // Запускаем главный вид
                webix.ui(views.main_view);

                //
                // Навешиваем события на объекты и инициализируем окошки
                views.init(controllers);

                //
                // Авторизуем пользователя
                controllers.user_login();

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