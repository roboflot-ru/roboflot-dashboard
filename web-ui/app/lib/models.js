define(['helpers', 'controllers'], function(helpers, controllers){

    return {
        //
        // Класс устройства
        // инициализируется при создании нового устройства
        Robot: function(robot) { // id, name, color
            // Цвет маркера и трека по умолчанию
            robot.color = robot.color ? robot.color : '#87faff';

            let last_telemetry = null;
            //var markers_counter = 1;

            //
            //     ID устройства = robot.id      //

            // Общие параметры подвижного маркера устройства
            const icon_params = {
                path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW
                ,scale: 5
                ,strokeColor: '#160e01'
                ,fillColor: robot.color
                ,fillOpacity: 1.0
                ,strokeWeight: 3
                ,rotation: 180
            };

            // Общие параметры трека
            const path_params = {
                strokeColor: robot.color,
                strokeOpacity: 0.8,
                strokeWeight: 3
            };

            // Объект карты Google
            const map_obj = $$('map1').getMap();

            // Список с событиями-статусами
            const status_list = new webix.DataCollection();
            // Список доступа пользователей
            const shares_list = new webix.DataCollection();

            let gages_data = {
                speed: new webix.DataValue(0),
                sats: new webix.DataValue(0),
                cpu_temp: new webix.DataValue(0),
                sys_load: new webix.DataValue(0),
                EMPTY: new webix.DataValue('')
            };

            // Запись телеметрии для панели информации
            const telemetry_record = new webix.DataRecord();

            // Информация о последнем положении
            const last_position = {coords: 0, track: 0, time: 0};

            // Функция отрисовки и перемещения маркера
            const set_marker_position = function(){
                // Обновляем положение маркера
                marker.setPosition(last_position.coords);
                // Поворот маркера
                icon_params.rotation = Math.round(last_position.track);
                icon_params.fillColor = robot.color;
                marker.setIcon(icon_params);

                // Если это первая точка, то рисуем маркер
                if( !marker.getMap() && map_obj ) {
                    marker.setMap(map_obj);
                    map_obj.panTo(marker.getPosition());
                }
            };

            // добавляем устройство в список
            $$('robots_list').add({
                id: robot.id,
                name: robot.name,
                status: 'offline'
            });

            // Подключаемся к каналу телеметрии этого робота по его id
            socket.on('telem', function (data) {
                if( data.robot_id == robot.id ){

                    last_telemetry = data.telemetry;

                    // Объект в списке хранит все данные
                    let item = $$('robots_list').getItem(robot.id);
                    let robot_time = new Date(Math.round(last_telemetry.time_u/1000));
                    //console.log(last_telemetry.time_b + '   -   ' + last_telemetry.time_u + '   -   ' + last_telemetry.server_time + '   -   ' + new Date().getTime());

                    //last_telemetry.time_formatted = helpers.time_string(robot_time.getHours(), robot_time.getMinutes(), robot_time.getSeconds());
                    last_telemetry.uptime_formatted = helpers.readable_seconds(Math.round(last_telemetry.time_b/1000));

                    telemetry_record.setValues(last_telemetry);

                    // Переписываем нужные данные (gps_data, system_data)
                    let gps_speed = Math.round(last_telemetry.gps_speed ? last_telemetry.gps_speed : 0);
                    if( gps_speed < 0 ) gps_speed = 0;

                    //item.speed = gps_speed;
                    //item.sats = last_telemetry.sats > 0 ? last_telemetry.sats  : 0;
                    //item.time = last_telemetry.time_formatted;
                    item.status = 'online';

                    gages_data.speed.setValue(gps_speed);
                    gages_data.sats.setValue(last_telemetry.sats);
                    gages_data.sys_load.setValue(last_telemetry.sys_load);

                    // Если вдруг из точек не получилось добыть местоположение
                    if( last_telemetry.lat != 0 && last_telemetry.lon != 0 ){
                        last_position.coords = new google.maps.LatLng({lat: last_telemetry.lat, lng: last_telemetry.lon});
                        // console.log(last_position.coords);

                        last_position.track = last_telemetry.head;

                        set_marker_position();
                    }

                    robot.last_data = Math.round(new Date().getTime()/1000);

                    // Сохраняем текущую информацию в списке
                    $$('robots_list').updateItem(robot.id, item);
                }
            });

            // Картинка
            socket.on('video_frame', function (image) {
                 document.getElementById('robot_video').setAttribute("src", "data:image/jpeg;base64," + image.toString("base64") );
            });


            /*


            //
            // Подключаемся к данным статуса
            const status_ref = robot_ref.child('status_log').orderByKey().limitToLast(10);

            // Чтобы не возникало ошибки, проверим наличие записи
            if( status_ref ){
                status_ref.on('child_added', function(snap){
                    const dt = new Date(snap.val().time*1000);
                    const list_item = {
                        time: dt.getDate() + '.' + (dt.getMonth()+1) + ' в ' + dt.getHours() + ':' + dt.getMinutes()
                    };

                    if( snap.val().status == 'online' ){
                        list_item.text = 'ВКЛючился после ' + helpers.readable_seconds(snap.val().downtime) + ' простоя';
                    }

                    if( snap.val().status == 'offline' ){
                        list_item.text = 'ВЫКЛючился после ' + helpers.readable_seconds(snap.val().uptime) + ' работы';
                    }

                    status_list.add(list_item);

                });
            }


            //
            // подключаемся к данным пользователей для вывода в список
            const shared_ref = robot_ref.child('shared');

            // Проверим доступ к этой папке. Если его нет, то этим устройством поделились
            // TODO сразу после добавления устройства это поле еще не доступно и поэтому не включает добавление пользователей
            shared_ref.child('_').set(true).then(function(){
                robot.share = true;
                shared_ref.child('_').set(null);
            }).catch(function(){
                robot.share = false;
            });

            shared_ref.on('child_added', function (snap) {
                const email = snap.key.replace('**', '.');
                shares_list.add({id: snap.key, email: email});
            });

            shared_ref.on('child_removed', function (snap) {
                shares_list.remove(snap.key);
            });

            shared_ref.on('child_changed', function (snap) {
                if( !snap.val() ) shares_list.remove(snap.key);
            });
            */

            //
            // Задаем начальные параметры маркера,
            // но пока не ставим его на карту. На карте он появится, при поступлении данных о положении
            const marker = new google.maps.Marker({
                position: {lat:0,lng:0}
                ,icon: icon_params
                ,title: robot.name
            });

            //
            // Отрисовка трека текущей поездки
            //const robot_way = new google.maps.Polyline(path_params);
            //robot_way.setMap(map_obj);

            //
            // подключаемся к списку точек и рисуем линию
            /*
            const travel_points_ref = robot_ref.child('current_travel/points').orderByChild('time');
            // Рисуем линию и маркеры из сохраненных данных
            travel_points_ref.on('child_added', function(snap){
                const path = robot_way.getPath();
                const point_data = snap.val();


                // Если есть координаты и время точки больше предыдущей
                if( point_data.lat > 0 && point_data.lon > 0 && point_data.time > last_position.time ){
                    last_position.coords = new google.maps.LatLng({lat: point_data.lat, lng: point_data.lon});
                    last_position.track = point_data.track;
                    last_position.time = point_data.time;

                    set_marker_position();

                    // Рисуем линию
                    path.push(last_position.coords);

                    // Если стоянка больше 10 минут
                    if( point_data.stay && point_data.stay > 10*60 ){

                        // Рисуем маркер стоянки
                        const park_started = new Date((point_data.time - point_data.stay)*1000);
                        const time_string = helpers.time_string(park_started.getHours(), park_started.getMinutes());

                        const mark1 = new google.maps.Marker({
                            position: last_position.coords,
                            title: robot.name + ' остановился ' + time_string + ', стоянка ' + helpers.readable_seconds(point_data.stay),
                            label: '' + markers_counter++,
                            map: map_obj
                        });
                    }

                }


            });

            // автоматически ставить точки остановки
            const stop_markers = {};
            travel_points_ref.on('child_changed', function(snap){
                const point_data = snap.val();

                const position = new google.maps.LatLng({lat: point_data.lat, lng: point_data.lon});
                const park_started = new Date((point_data.time - point_data.stay)*1000);
                const time_string = helpers.time_string(park_started.getHours(), park_started.getMinutes());

                // Проверяем есть ли на этой точке маркер
                if( stop_markers[snap.key] ){
                    //console.log('update marker');
                    // Обновить маркер
                    stop_markers[snap.key].setTitle(robot.name + ' остановился ' + time_string + ', стоянка ' + helpers.readable_seconds(point_data.stay));
                }
                else {
                    //console.log('new marker');
                    // Поставить новый
                    // Как только обновлять существующие маркеры??
                    if( point_data.stay && point_data.stay > 10*60 ){
                         stop_markers[snap.key] = new google.maps.Marker({
                             position: position,
                             title: robot.name + ' остановился ' + time_string + ', стоянка ' + helpers.readable_seconds(point_data.stay),
                             label: '' + markers_counter++,
                             map: map_obj
                        });
                    }
                }

            });
            */

            // // TODO обновить данные при изменении

            //
            // Возвращаем управление устройством
            return {

                // Удаляем маркер с карты и из списка (вызывается при удалении объекта из БД)
                remove: function(){
                    // Удаляем устройство из списка
                    const list_item = $$('robots_list').getItem(robot.id);
                    if( !list_item ) return;
                    $$('robots_list').remove(robot.id);

                    // Удаляем маркер с карты
                    marker.setMap(null);
                    robot_way.setMap(null);

                    // И из общего массива экземпляров
                    robots_list[robot.id] = null;
                }

                // Обновляем информацию об объекте (вызывается при изменении объекта в БД)
                ,update: function(data){
                    const list_item = $$('robots_list').getItem(robot.id);
                    if( !list_item ) return;

                    robot.name = data.name;
                    robot.color = data.color;

                    list_item.name = data.name;
                    $$('robots_list').updateItem(robot.id, list_item);
                    // Если у маркера есть информация, обновляем ее здесь
                    // обновить цвет маркера
                    set_marker_position();

                    // Обнвить цвет линии
                    path_params.strokeColor = robot.color;
                    //robot_way.setOptions(path_params);
                }

                // Коллекция списка для статусов
                ,status_list: function(){
                    return status_list;
                }

                ,shares_list: function(){
                    return shares_list
                }

                ,share: function(email){
                    const key = email.replace('.', '**');
                    shared_ref.child(key).set(true).then(function(){
                        webix.message('Пользователь ' + email + ' получил доступ к устройству ' + robot.name);
                    }).catch(function(){
                        webix.message('Нет доступа');
                    });
                }

                ,unshare: function(email){
                    const key = email.replace('.', '**');
                    shared_ref.child(key).set(null).then(function(){
                        webix.message('Пользователь ' + email + ' удален из доступа к устройству ' + robot.name);
                    }).catch(function(){
                        webix.message('Нет доступа');
                    });
                }

                ,isSharable: function(){
                    return robot.share ? robot.share : false;
                }

                // Запись с параметрами телеметрии
                ,telemetry_record: function(){
                    return telemetry_record;
                }

                // Данные для формы
                ,form_data: function(){
                    return {
                        id: robot.id,
                        name: robot.name,
                        color: robot.color ? robot.color : '#000000'
                    }
                }

                // Передвинуть карту на место робота
                ,move_in_view: function(){
                    if( last_position.coords ){
                        map_obj.setCenter(last_position.coords);
                        map_obj.setZoom(18);
                    }
                    else {
                        webix.message('Координаты робота неизвестны');
                    }
                }

                ,down_time: function(){
                    return Math.round(new Date().getTime()/1000) - (robot.last_data ? robot.last_data : 0);
                }

                ,gages_data: function(gage){
                    return gages_data[gage] ? gages_data[gage] : gages_data.EMPTY;
                }

            };

        }

    }
});