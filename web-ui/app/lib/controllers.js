define(['models'], function(models){
    // Объект в котором хранятся экземпляры Device
    window.robots_list = {};

    //
    // Инициализация пользователя после соединения с БД
    const robots_init = function(){

        webix.ajax().get('/data/robots/', {}, function(t, d) {
            let res = d.json();

            for( let i = 0; i < res.list.length; i++ ){
                console.log(res.list[i].id);
                robots_list[res.list[i].id] = new models.Robot(res.list[i]);
            }

        });

        // СПИСОК УСТРОЙСТВ ПОЛЬЗОВАТЕЛЯ

        /*
        // Подключаемся к списку устройств
        const user_robots = firebase.database().ref('users/' + firebase.auth().currentUser.uid + '/robots');

        // При добавлении нового устройства в БД, добавляем его в список
        user_robots.on('child_added', function(data) {
            // Объект устройства добавляем в общий хеш для дальнейшего использования
            const values = data.val();
            values.id = data.key;
            robots_list[data.key] = new models.Device(values);
        });

        // При изменении объекта
        user_robots.on('child_changed', function(data) {
            if( !robots_list[data.key] ) return;
            robots_list[data.key].update(data.val());
        });

        // При удалении, удаляем из списка
        user_robots.on('child_removed', function(data) {
            if( !robots_list[data.key] ) return;
            robots_list[data.key].remove();
        });
        */

    };

    // Отвязка пользователя от устройства
    const robot_unshare = function(id, e){
        console.log('unshare confirm');
        const item_id = $$('robot_share_list').locate(e),
              email = item_id.replace('**', '.');

        webix.confirm({
            text: 'Пользователю <b>' + email + '</b> будет закрыт доступ к устройству',
            type:"confirm-warning",
            ok: 'Закрыть доступ',
            cancel: 'Отмена',
            width: 350,
            callback: function(result){
                if( !result ) return;

                robots_list[$$('robot_form').getValues().id].unshare(email);

            }
        });
    };

    const reset_dashboard = function(){
        //$$('robot_status_list').clearAll();
        //$$('robot_status_list').data.unsync();

        $$('robot_telemetry_list').unbind();
        $$('robot_speed_gage').unbind();
        $$('robot_sats_gage').unbind();
        $$('robot_sys_load_gage').unbind();
    };

    const reset_form = function(){
        $$('robot_form').clear();
        $$('robot_form').clearValidation();
    };

    const open_robot_list = function(){
        $$('side_view1').setValue('robots_list_view');
        $$('robots_list').unselectAll();

        reset_dashboard();
        reset_form();

    };

    //
    // Функции
    return {
        //
        // Открыть окно для добавления устройства
        open_add_window: function(){
            $$('add_robot_popup').enable();
            $$('add_robot_popup').show(this.getNode());
            $$('robot_add_form').clearValidation();
            $$('robot_add_form').clear();
        }

        //
        // Сохранить новое устройство
        ,add_new_robot: function(){
            const new_name = $$('new_robot_name').getValue();

            if( !$$('robot_add_form').validate() ){
                return;
            }

            $$('add_robot_popup').disable();

            // сохраняем робота на сервер
            webix.ajax().post('/data/robots/', {name: new_name}, function (t, d) {
                let res = d.json();

                if( 'success' == res.status ){
                    robots_list[res.newid] = new models.Device({id: res.newid, name: new_name});
                    webix.message('Новый робот сохранен');
                }
                else {
                    webix.message('Ошибка');
                }

                $$('add_robot_popup').hide();

            });
        }

        //
        // Сохранить устройство после редактирования
        ,save_robot: function(){
            const user_robots = firebase.database().ref('users/' + firebase.auth().currentUser.uid + '/robots');

            if( !$$('robot_form').validate() ){
                return;
            }

            const values = $$('robot_form').getValues();
            $$('robot_form').disable();
            user_robots.child(values.id).update({
                name: values.name,
                color: values.color
            }).then(function(){
                $$('robot_form').enable();
                webix.message('Устройство изменено');
                // TODO обновить данные при изменении
            }).catch(function(error){
                $$('robot_form').enable();
                webix.message('Ошибка сохранения');
            });

        }

        //
        // Удалить устройство
        ,remove_robot: function(){
            const user_robots = firebase.database().ref('users/' + firebase.auth().currentUser.uid + '/robots');
            const values = $$('robot_form').getValues();

            webix.confirm({
                text: 'Устройство <b>' + values.name + '</b> будет безвозвратно удалено!',
                type:"confirm-warning",
                ok: 'Удалить',
                cancel: 'Отмена',
                width: 350,
                callback: function(result){
                    if( !result ) return;
                    $$('robot_form').disable();

                    user_robots.child(values.id).set(null).then(function(){
                        webix.message('Устройство удалено');
                        open_robot_list();
                    }).catch(function (error) {
                        webix.message('Ошибка удаления');
                        $$('robot_form').enable();
                        console.log(error);
                    });
                }
            });
        }

        //
        // Открыть панель приборов для устройства
        ,open_robot_dashboard: function(item){
            // открываем саму панель
            $$('side_view1').setValue('robot_dashboard_view');

            let robot_id = item.toString(),
                robot = null;

            // Если нет параметра, то оставляем старые данные
            if( item == 'robots_dashboard_return' ){
                robot_id = $$('robot_form').getValues().id;
            }


            if( robot_id in robots_list ){
                robot = robots_list[robot_id];
            }
            else {
                $$('side_view1').setValue('robots_list_view');
            }

            // Загружаем данные нового объекта из списка и подвязываем к изменениям
            //$$('robot_status_list').data.sync(robot.status_list());
            $$('robot_telemetry_list').bind(robot.telemetry_record());
            $$('robot_speed_gage').bind(robot.gages_data('speed'));
            $$('robot_sats_gage').bind(robot.gages_data('sats'));
            $$('robot_sys_load_gage').bind(robot.gages_data('sys_load'));

            // Загрузить в форму id объекта (форма потом каждый раз загружает данные по id)
            $$('robot_form').setValues(robot.form_data());

            // Переместить карту на место маркера или сообщить, что координаты не обнаружены
            robot.move_in_view();

        }

        //
        // Открыть лист настройки
        ,open_robot_settings: function(){
            // Перво-наперво чтобы не глючили приборы
            reset_dashboard();
            //
            $$('side_view1').setValue('robot_settings_view');

            $$('robot_form').setValues(robots_list[$$('robot_form').getValues().id].form_data());
            $$('robot_form').enable();

            if( robots_list[$$('robot_form').getValues().id].isSharable() ){
                $$('robot_share').show();
            }
            else {
                $$('robot_share').hide();
            }

        }

        //
        // Открыть список устройств
        ,open_robots_list: open_robot_list

        //
        // Открыть окошко добавления пользователя в устройство
        ,open_share_popup: function(){
            $$('robot_share_form').clear();
            $$('robot_share_form').clearValidation();

            $$('robot_share_list').data.unsync();
            $$('robot_share_list').data.sync(robots_list[$$('robot_form').getValues().id].shares_list());

            $$('robot_share_popup').show(this.getNode());

            // Навешиваем событие на кнопку-иконку в списке
            if( $$('robot_unshare') && !$$('robot_unshare').hasEvent('onItemClick') ){
                $$('robot_unshare').attachEvent("onItemClick", robot_unshare);
            }
        }

        //
        // Добавить нового пользователя в устройство
        ,robot_share_save: function(){
            if( !$$('robot_share_form').validate() ) return;

            const values = $$('robot_share_form').getValues();

            robots_list[$$('robot_form').getValues().id].share(values.robot_share_email);

            // TODO сохранить пользователя и включить ему доступ, если он есть

        }

        //
        // Отвязывание пользователя от устройства
        ,robot_unshare: robot_unshare

        //
        // Логин пользователя
        ,user_login: function(){

            // Инициализация пользователя и его устройств
            robots_init();

        }

        //
        // Логаут пользователя
        ,user_logout: function(){

        }

    }
});
