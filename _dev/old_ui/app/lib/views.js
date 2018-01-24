define(['views_parts', 'helpers'], function(parts, helpers){

    // active list init
    webix.protoUI({name:"activeList"}, webix.ui.list, webix.ActiveContent);

    // init popup windows
    webix.ui(parts.add_robot_popup);
    webix.ui(parts.robot_share_popup);


    // return object
    return {

        //
        // main view
        main_view: {
            type:"material",
            id: 'main_view',
            disabled: false,
            rows: [

                // top toolbar on screen
                parts.top_toolbar

                // map, robots list and dashboard
                ,{
                    cols: [
                        // map
                        parts.main_map

                        // multiview side panel with list switching to dashboard and settings form
                        ,{
                            header:'Robots'
                            ,gravity: 2
                            ,collapsed: true
                            ,body: {
                                id: 'side_view1'
                                ,view: "multiview"
                                ,fitBiggest: true
                                ,animate: true
                                ,value: 'robots_list_view'
                                ,cells: [
                                    // List
                                    parts.robots_list

                                    // Dashboard
                                    ,parts.robot_dashboard

                                    // Settings
                                    ,parts.robot_settings

                                ]
                            }
                        }

                    ]
                }

            ]
        }


        //
        // Init views with controllers and events. It is called in app.js after loading webix lib
        ,init: function(controllers){

            //
            // Открываем окошко для добавления устройства
            $$('add_robot').attachEvent('onItemClick', controllers.open_add_window);

            //
            // Сохраняем новое устройство в БД
            $$('new_robot_save').attachEvent('onItemClick', controllers.add_new_robot);

            //
            // Редактирование формы устройства
            $$('robot_save').attachEvent('onItemClick', controllers.save_robot);

            //
            // Редактирование формы устройства
            $$('robot_remove').attachEvent('onItemClick', controllers.remove_robot);

            //
            // Открываем панель приборов с ID устройства
            $$('robots_list').attachEvent('onItemClick', controllers.open_robot_dashboard);

            //
            // Возвращаемся в список
            $$('robots_list_return').attachEvent('onItemClick', controllers.open_robots_list);

            //
            // В панели управления кнопка для входа в настройки устройства
            $$('robot_settings_in').attachEvent('onItemClick', controllers.open_robot_settings);

            //
            // Возврат в панель приборов из настроек
            $$('robots_dashboard_return').attachEvent('onItemClick', controllers.open_robot_dashboard);

            //
            // Логаут пользователя
            $$('user_button').attachEvent('onItemClick', controllers.user_logout);

            //
            // Открываем окошко для добавления нового пользовтаеля
            $$('robot_share').attachEvent('onItemClick', controllers.open_share_popup);

            //
            // Сохраняем нового пользователя в списке допуска
            $$('robot_share_save').attachEvent('onItemClick', controllers.robot_share_save);

        }

    }
});


// трекер времени
            /*
            ,{
                view: 'toolbar'
                //,css:"bg_panel_raised bg_primary"
                ,elements: [
                    // Список дней
                    {
                        view: 'richselect'
                        ,id: 'day-select'
                        ,width: 170
                        ,value: 'd-0'
                        ,options: [{id:'d-0', value: 'Сегодня'},{id:'d-1', value: 'Вчера'},{id:'d-2', value: 'Позавчера'},{id:'d-3', value: 'Позапозавчера'}]
                    }

                    // Время трекера
                    ,{view: 'label', label: '00:00:)0', id: 'time-label', width: 100}

                    // Кнопка плей-топ
                    ,{view: 'toggle', type: 'icon', offIcon:'play', onIcon: 'stop', id: 'playstop', css:"solid_icon", width: 50}

                    // Трекер
                    ,{ view:"slider", id:"time-slider", min:0, max: 86399, step: 60, value: 0, css: 'slider_css'}

                ]
            }
            */


