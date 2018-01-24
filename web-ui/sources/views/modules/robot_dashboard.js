
export default {
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
};