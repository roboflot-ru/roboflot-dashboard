import RobotsCollection from './RobotsCollection';

// Robot front-end model

export default class Robot {
    constructor(data){

        this.id = data.id;
        this.name = data.name;

        console.log('robot constructor ' + this.name + ': ' + this.id);

        // Marker and track color on map
        this.color = data.color ? data.color : '#ff0000';

        this.last_telemetry = null;

        // map marker config
        this.icon_params = {
            path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW
            ,scale: 5
            ,strokeColor: '#160e01'
            ,fillColor: this.color
            ,fillOpacity: 1.0
            ,strokeWeight: 3
            ,rotation: 180
        };

        // map track config
        this.track_params = {
            strokeColor: this.color,
            strokeOpacity: 0.8,
            strokeWeight: 3
        };

        // Gages data
        this.gages_data = {
            speed: new webix.DataValue(0)
            ,sats: new webix.DataValue(0)
            ,sys_load: new webix.DataValue(0)
            //,EMPTY: new webix.DataValue('')
        };

        // telemetry record
        this.telemetry_record = new webix.DataRecord({ss:'dd'});

        // last position
        this.last_position = {coords: null, track: null, time: null};

        // map marker
        this.marker = new google.maps.Marker({
            position: { lat: 0, lng: 0 }
            ,icon: this.icon_params
            ,title: this.name
        });

        // moving marker and adding marker
        this.set_marker_position = function(){
            if( !this.last_position.coords ) return;

            // position
            this.marker.setPosition(this.last_position.coords);
            // rotation
            this.icon_params.rotation = Math.round(this.last_position.track);
            this.icon_params.fillColor = this.color;
            this.marker.setIcon(this.icon_params);

        };


        // Telemetry
        // Подключаемся к каналу телеметрии этого робота по его id
        window.jetapp.socketio.on('telem_' + this.id, telemetry => {

            // TODO
            // получить heartbeat и поменять состояние панели

            //console.log('telem from ' + this.id);
            console.log(''
                + 'b_mode:' + telemetry.b_mode + '   '
                + 'c_mode:' + telemetry.c_mode + '   '
                + 'type:' + telemetry.type + '   '
                + 'autopilot:' + telemetry.autopilot + '   '
                + 'ss:' + telemetry.sys_status + '   '
                + 'mav:' + telemetry.mav_v + '   '
            );

            this.last_telemetry = telemetry;


            // Объект в списке хранит все данные
            let item = RobotsCollection.getItem(this.id);

            //let robot_time = new Date(Math.round(last_telemetry.time_u/1000));
            //console.log(last_telemetry.time_b + '   -   ' + last_telemetry.time_u + '   -   ' + last_telemetry.server_time + '   -   ' + new Date().getTime());

            //last_telemetry.time_formatted = helpers.time_string(robot_time.getHours(), robot_time.getMinutes(), robot_time.getSeconds());
            //last_telemetry.uptime_formatted = helpers.readable_seconds(Math.round(last_telemetry.time_b/1000));

            this.telemetry_record.setValues(telemetry);


            // Переписываем нужные данные (gps_data, system_data)
            let gps_speed = Math.round(telemetry.gps_speed ? telemetry.gps_speed : 0);
            if( gps_speed < 0 ) gps_speed = 0;

            //item.speed = gps_speed;
            //item.sats = last_telemetry.sats > 0 ? last_telemetry.sats  : 0;
            //item.time = last_telemetry.time_formatted;
            item.status = 'online';

            this.gages_data.speed.setValue(gps_speed.toString());
            this.gages_data.sats.setValue(telemetry.sats);
            this.gages_data.sys_load.setValue(telemetry.sys_load);


            // Если вдруг из точек не получилось добыть местоположение
            if( telemetry.lat != 0 && telemetry.lon != 0 ){
                this.last_position.coords = new google.maps.LatLng({lat: telemetry.lat, lng: telemetry.lon});
                // console.log(last_position.coords);

                this.last_position.track = telemetry.head;

                this.set_marker_position();
            }

            item.last_data = Math.round(new Date().getTime()/1000);

            // Сохраняем текущую информацию в списке
            //RobotsCollection.updateItem(this.id, item);

        });


        // Video
        /*
        // Картинка
        socket.on('video_frame', function (image) {
            let video_div = document.getElementById('robot_video');
            if( !video_div ) return;

            video_div.setAttribute("src", "data:image/jpeg;base64," + image.toString("base64") );
        });
        */


        this.set_marker_position();
        this.putOnMap();

    }

    activateDashboard(){
        console.log('activate dashboard for ' + this.id);

        console.log(webix.$$('robot_telemetry_list'));

        webix.$$('robot_telemetry_list').bind(this.telemetry_record);

        //webix.$$('robot_speed_gage').bind(this.gages_data.speed);
        //webix.$$('robot_sats_gage').bind(this.gages_data.sats);
        webix.$$('robot_sys_load_gage').bind(this.gages_data.sys_load);

        //console.log(this);

        //if( webix.$$('side_view1') ){
        //    webix.$$('side_view1').setValue('robot_dashboard_view');
        //}
        //else {
         //   console.log('VIEW NOT FOUND');
        //}

        // it's cleared in onViewChange event in dashboard.js

        // set title
        //webix.$$('rsidepanel').define("header", this.name);
        //webix.$$('rsidepanel').refresh();






        //this.telemetry_record.bind(webix.$$('robot_telemetry_list'));

        //webix.$$('robot_speed_gage').bind(this.gages_data.speed);
        //webix.$$('robot_sats_gage').bind(this.gages_data.sats);
        //webix.$$('robot_sys_load_gage').bind(this.gages_data.sys_load);


        this.set_marker_position();

        //if( this.marker.getPosition() ){
        //    console.log('panning map');
            //console.log(webix.$$('map1').getMap());
            //this.marker.setMap(webix.$$('map1').getMap());
        webix.$$('map1').getMap().panTo(this.marker.getPosition());
        //}

    }

    putOnMap(){
        console.log('refresh map for ' + this.id);

        // TODO
        // Сделать перерисовку всех данных на карту в зависимости от состояния

        // if marker not yet put to map, then put it
        if( webix.$$('map1').getMap() ) {
            console.log('MAP OK');
            this.marker.setMap(webix.$$('map1').getMap());
            // and pan map to its position
            //webix.$$('map1').getMap().panTo(this.marker.getPosition());
        } else {
            console.log('MAP ERR');
        }

    }

    arm(){
        webix.message('arming ' + this.id);

        //window.jetapp.socketio.emit('arming', this.id);

        webix.ajax().post('/api/robots/' + this.id + '/arm', {}, function(t,d){
            const resp = d.json();

            webix.message(resp.message);
        });
    }

}

