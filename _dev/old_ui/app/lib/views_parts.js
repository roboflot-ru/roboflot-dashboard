define({

    //
    // main top toolbar
    top_toolbar: {
        view: 'toolbar'
        ,css:"bg_panel_raised bg_primary"
        ,elements: [
            {gravity: 4}

            // user button
            ,{view: 'button', label: 'User', type: 'iconButton', icon: 'user', id: 'user_button', width: 180}

        ]
    }


    //
    // side list of robots
    ,robots_list: {
        id: 'robots_list_view'
        ,rows: [

            // list itself
            {
                view: 'list'
                ,id: 'robots_list'
                ,template: '#name#' // '<div class="list_mark">#online#</div> #name#'
                ,scheme:{
                    $change:function(obj){
                        if( 'online' == obj.status ){
                            obj.$css = 'list_bg_green';
                        }
                        else if( 'online-nogps' == obj.status ){
                            obj.$css = 'list_bg_yellow';
                        }
                        else{
                            obj.$css = 'list_bg_red';
                        }
                    }
                }
                ,type:{
                    height:50
                }
                ,select:true
            }

            // bottom toolbar
            ,{
                view: 'toolbar'
                ,elements: [
                    {gravity: 4}
                    // + button to add new robot
                    ,{view:'icon', id: 'add_robot', icon: 'plus', css: 'action_icon', tooltip: 'Add new'}
                ]
            }

        ]

    }


    //
    // robot dashboard (it comes out when list item is clicked)
    ,robot_dashboard: {
        id: 'robot_dashboard_view'
        ,rows: [
            // top toolbar with controls
            {
                view: 'toolbar'
                ,elements: [
                    {view:'icon', id: 'robots_list_return', icon: 'bars', css: 'action_icon', tooltip: 'Return to list'}
                    ,{view: 'label', label: '[Robot name]', width: 100}
                    ,{gravity: 4}
                    ,{view:'icon', id: 'robot_settings_in', icon: 'cog', tooltip: 'Settings'}
                ]
            }

            // video part
            ,{
                height: 270
                ,template: '<div style="align: center"><img id="robot_video" style="display:block; width:320px; height:240px;" src="" /></div>'
            }

            // dashboard
            ,{
                height: 150
                ,cols: [
                    // Speed
                    {
                        view: "gage",
                        id:"robot_speed_gage",
                        value: 0,
                        width: 160,
                        minRange: 0,
                        maxRange: 100,
                        label: 'speed',
                        placeholder: "км/ч",
                        scale:4,
                        stroke:9,
                        color:function(val){
                            if (val > 80) return "red";
                            if (val > 50) return "orange";
                            return "green";
                        }
                    }

                    // Кол-во спутников
                    ,{
                        view: "gage",
                        id:"robot_sats_gage",
                        value: 0,
                        width: 160,
                        minRange: 0,
                        maxRange: 20,
                        label: 'Спутники',
                        placeholder: "шт",
                        scale:4,
                        stroke:9,
                        color:function(val){
                            if (val < 5) return "red";
                            if (val < 8) return "orange";
                            return "green";
                        }
                    }

                    // Температура процессора
                    ,{
                        view: "gage",
                        id:"robot_sys_load_gage",
                        value: 0,
                        width: 160,
                        minRange: 0,
                        maxRange: 100,
                        label: 'Системная нагрузка',
                        placeholder: "%",
                        scale:4,
                        stroke:9,
                        color:function(val){
                            if (val > 90) return "red";
                            if (val > 70) return "orange";
                            return "green";
                        }
                    }

                ]
            }

            // telemetry data
            ,{
                id: 'robot_telemetry_list'
                ,view: 'template'
                ,scroll: 'y'
                ,template: '' +
                    'GPS speed: #gps_speed# м/с<br/>' +
                    'Coords: #lat#, #lon# <br/>' +
                    'GPS alt: #alt# м<br/>' +
                    'Sats num: #sats# <br/>' +
                    'GPS Fix: #gps_fix_type# <br/>' +
                    'Sys load: #sys_load# %<br/>' +
                    'Uptime: #uptime_formatted# <br/>'
                    + '<br/>'
                    + 'Air pressure: #press_a# гПа<br/>'
                    + 'Air temp: #temp#<sup>o</sup>C <br/>'
                    + 'Roll: #roll#<sup>o</sup>, Pitch: #pitch#<sup>o</sup>, Compass: #yaw#<sup>o</sup> <br/>'
                    + '<br/>'
                    + 'PLat: #pos_lat#, PLon: #pos_lon#<br/>'
                    + 'PAlt: #pos_alt#, PRelAlt: #pos_rel_alt#<br/>'
                    + 'VX: #pos_vx#, VY: #pos_vy#, VZ: #pos_vz#<br/>'
                    + 'PHDG: #pos_hdg#<br/>'
                    // + 'Бортовое время: #time_formatted# <br/>'
                ,data: []
            }

            // controll buttons
            ,{
                height: 50
                ,cols: [
                    {
                        view: 'button'
                        ,type: 'icon'
                        ,id: 'takeoff_button'
                        ,label: 'TakeOFF'
                        ,icon: 'arrow-up'
                        ,css: 'button_danger'
                    }

                    ,{
                        view: 'button'
                        ,type: 'icon'
                        ,id: 'mission_button'
                        ,label: 'FlyOVER'
                        ,icon: 'globe'
                        ,css: 'button_primary'
                    }

                    ,{
                        view: 'button'
                        ,type: 'icon'
                        ,id: 'landing_button'
                        ,label: 'Land'
                        ,icon: 'arrow-down'
                        ,css: 'button_danger'
                    }
                ]
            }

            // statuses list
            /*,{
                view: 'list'
                ,id: 'robot_status_list'
                ,template: '#time# #text#'
                ,data: []
            }*/

        ]
    }


    //
    // Settings form
    ,robot_settings: {
        id: 'robot_settings_view'
        ,rows: [

            // Верхняя панель с кнопками
            {
                view: 'toolbar'
                ,elements: [
                    {view:'icon', id: 'robots_dashboard_return', icon: 'tachometer', css: 'action_icon', tooltip: 'Панель управления'}
                    ,{gravity: 4}
                    ,{view:'icon', id: 'robot_share', icon: 'share-alt', tooltip: 'Добавить пользователей', hidden: true}
                ]
            }

            // Форма редактирования
            ,{
                view: 'form'
                ,id: 'robot_form'
                ,elements: [
                    {view: 'text', name: 'name', label: 'Название', invalidMessage: "только буквы и цифры длиной не менее 3 символов"}
                    ,{view: 'colorpicker', name: 'color', label: 'Цвет'}
                    ,{view: 'text', name: 'id', label: 'ID', readonly: true, css: 'text_muted'}
                    ,{
                        cols: [
                            {view: 'button', id: 'robot_save', value: 'Сохранить', width: 130, css: 'button_primary'}
                            ,{gravity:4}
                            ,{view: 'button', id: 'robot_remove', value: 'Удалить', width: 100, css: 'button_warning'}
                        ]
                    }
                ]
                ,rules: {
                    name: function(value){
                        return /^[a-zа-яё]+[a-zа-яё0-9 -]+[a-zа-яё0-9]+$/i.test(value);
                    }
                }
            }


        ]
    }


    //
    // Main map
    ,main_map: {
        key:"AIzaSyASK9IHky3keeBM5aFQIiMt23e1KOsbJHk",
        view:"google-map",
        id:"map1",
        zoom:13,
        mapType: 'SATELLITE',
        gravity: 3,
        center:[ 55.751244, 37.618423 ], // Центр карты при загрузке страницы
        mapTypeControl: true,
        scaleControl: false,
        streetViewControl: false,
        rotateControl: false
    }


    //
    // Popup with a form to add new robot
    ,add_robot_popup: {
        view: 'popup'
        ,id: 'add_robot_popup'
        ,type: 'material'
        ,width: 300
        ,height: 200
        ,body: {
            rows: [ // TODO добавить валидацию на значение длина больше 2 и меньше 30
                {
                    view: 'form'
                    ,id: 'robot_add_form'
                    ,borderless: true
                    ,elements: [
                        {view: 'text', id: 'new_robot_name', name: 'new_robot_name', placeholder: 'название робота', width: 200, validateEvent:"key",
                                tooltip: 'Введите удобное название для робота, например Трактор Беларусь 1',
                                invalidMessage: "только буквы и цифры длиной не менее 3 символов"
                        },
                        {view: 'button', id: 'new_robot_save', label: 'Добавить', type: 'form', autowidth: true}
                    ]
                    ,rules: {
                        new_robot_name: function(value){
                            return /^[a-zа-яё]+[a-zа-яё0-9 -]+[a-zа-яё0-9]+$/i.test(value);
                        }
                    }
                }

            ]
        }
    }


    //
    // Popup with email text field to share your robot with other user
    ,robot_share_popup: {
        view: 'popup'
        ,id: 'robot_share_popup'
        ,type: 'material'
        ,width: 300
        ,height: 400
        ,body: {
            rows: [
                {
                    type: 'header'
                    ,template: 'Пользователи'
                    ,css: 'bg_panel'
                    ,border: false
                    ,borderless: true
                }
                // Список допущенных пользователей
                ,{
                    view: 'activeList'
                    ,id: 'robot_share_list'
                    ,template: '#email# <span class="list_buttons">{common.deleteIcon()}</span>'
                    ,data: []
                    ,activeContent:{
                        deleteIcon:{
                            id:"robot_unshare",
                            view:"icon",
                            icon: 'trash-o'
                        }
                    }
                }
                ,{
                    type: 'header'
                    ,template: 'Открыть доступ'
                    ,css: 'bg_panel'
                }
                // Добавление нового пользователя
                ,{
                    view: 'form'
                    ,id: 'robot_share_form'
                    ,borderless: true
                    ,elements: [
                        {view: 'text', id: 'robot_share_email', name: 'robot_share_email', placeholder: 'email пользователя', width: 200,
                                invalidMessage: "неверный формат email"
                        },
                        {view: 'button', id: 'robot_share_save', label: 'Добавить', type: 'form', autowidth: true}
                    ]
                    ,rules: {
                        "robot_share_email": webix.rules.isEmail
                    }
                }
            ]
        }
    }


});