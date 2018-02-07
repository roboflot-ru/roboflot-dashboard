import {JetView} from "webix-jet";
import RobotsCollection from './../../models/RobotsCollection'
import controllers from './../../controllers/robot_dashboard';


export default class RobotsDashboardView extends JetView{
    config(){
        return view_config;
    }

    init(view){}

    ready(view){
        controllers.ready(this);
    }

    //urlChange(view, url){}

    destroy(){
        controllers.destroy(this);
    }

}


const view_config = {
    id: 'robot_dashboard_view'
    ,borderless: true
    ,rows: [
        // top toolbar with controls
        {
            view: 'toolbar'
            ,type: 'clean'
            ,height: 60
            ,elements: [
                {view:'icon', localId: 'button:return', icon: 'chevron-left', tooltip: 'Return to list'}
                ,{}
                ,{view: 'icon', icon: 'bullhorn', badge: 1, width: 60}
                ,{view: 'icon', icon: 'thermometer-half', badge: 2, width: 60}
                ,{view: 'icon', icon: 'location-arrow', badge: 3, width: 60}
                ,{view: 'icon', icon: 'battery-half', badge: '23.56', width: 60}
                ,{}
                ,{view: 'label', label: 'Disamed', width: 70}
                ,{view: 'button', value: 'ARM', localId: 'button:arm', type: 'danger', width: 70}
                ,{view:'icon', localId: 'button:settings', icon: 'cog', tooltip: 'Settings'}
            ]
        }

        ,{
            view: 'scrollview'
            ,scroll: 'y'
            ,borderless: true
            ,body: {
                borderless: true
                ,rows: [

                    // video screen
                    {
                        height: 270
                        ,template: '<div style="text-align: center"><img id="robot_video" style="width:320px; height:240px;" src="/static/images/novideo2.gif" /></div>'
                    }

                    // dashboard
                    ,{
                        height: 150
                        ,borderless: true
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
                                placeholder: "kph",
                                scale:4,
                                stroke:9,
                                color:function(val){
                                    if (val > 80) return "red";
                                    if (val > 50) return "orange";
                                    return "green";
                                }
                                ,borderless: true
                            }

                            // num of sats
                            ,{
                                view: "gage",
                                id:"robot_sats_gage",
                                value: 0,
                                width: 160,
                                minRange: 0,
                                maxRange: 20,
                                label: 'num of sats',
                                placeholder: "sats",
                                scale:4,
                                stroke:9,
                                color:function(val){
                                    if (val < 5) return "red";
                                    if (val < 8) return "orange";
                                    return "green";
                                }
                                ,borderless: true
                            }

                            // sys load
                            ,{
                                view: "gage",
                                id:"robot_sys_load_gage",
                                value: 0,
                                width: 160,
                                minRange: 0,
                                maxRange: 100,
                                label: 'sys load',
                                placeholder: "%",
                                scale:4,
                                stroke:9,
                                smoothFlow: true
                                ,color: function(val){
                                    if (val > 90) return "red";
                                    if (val > 70) return "orange";
                                    return "green";
                                }
                                ,borderless: true
                            }

                        ]
                    }

                    // telemetry data
                    ,{
                        id: 'robot_telemetry_list'
                        ,localId: 'telem'
                        ,view: 'template'
                        ,autoheight:true
                        ,template: '' +
                            'GPS speed: #gps_speed# м/с<br/>' +
                            'Coords: #lat#, #lon# <br/>' +
                            'GPS alt: #alt# м<br/>' +
                            'Sats num: #sats# <br/>' +
                            'GPS Fix: #gps_fix_type# <br/>' +
                            'Sys load: #sys_load# %<br/>' +
                            'Uptime: #uptime_formatted# <br/>'
                            + '<br/>'
                            + 'Battery: #bat_v# V<br/>'
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
                        cols: [
                            {
                                view: 'button'
                                ,type: 'iconButton'
                                ,id: 'takeoff_button'
                                ,label: 'TakeOFF'
                                ,icon: 'arrow-up'
                            }

                            ,{
                                view: 'button'
                                ,type: 'iconButton'
                                ,id: 'mission_button'
                                ,label: 'FlyOVER'
                                ,icon: 'globe'
                            }

                            ,{
                                view: 'button'
                                ,type: 'iconButton'
                                ,id: 'landing_button'
                                ,label: 'Land'
                                ,icon: 'arrow-down'
                            }
                        ]
                    }

                ]
            }
        }



    ]
};