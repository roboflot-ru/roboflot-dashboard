import MissionsCollection from './MissionsCollection';

export default class Mission {

    // Создать новое задание
    static create(){
        return new webix.promise(function(success, fail){
            webix.ajax().post('/api/missions/', {}, (t, d) => {
                const resp = d.json();

                if( 'success' == resp.status ){
                    MissionsCollection.add({id: resp.id, name: resp.name, ref: new Mission(resp.id) });

                    success(resp.id);
                }
                else {
                    fail();
                }
            });
        });
    }

    static clearMapAll(){
        MissionsCollection.data.each(function(mission){
            mission.ref.clearMap();
        });
    }



    constructor(id) {
        if( !id ) return;

        this.id = id;
        this.name = '';
        this.map = null;
        this.points_table = null;
        this.mission_way = new google.maps.Polyline({
            strokeColor: '#ffbd4d'
            ,strokeOpacity: 0.9
            ,strokeWeight: 2
            ,geodesic: true
            ,zIndex: 1
        });
        this.home_marker = null;

        this.mission_way.addListener('click', () => {
            webix.message('poly click');
        });

        this.mission_way.addListener('dragstart', () => {
            webix.message('poly dragstart');
        });

        this.mission_way.addListener('dragend', () => {
            webix.message('poly dragend');
        });

        this.mission_way.getPath().addListener('insert_at', (i) => {
            webix.message('path insert_at ' + i);
        });

        this.mission_way.getPath().addListener('remove_at', (i) => {
            webix.message('path remove_at ' + i);
        });

        this.mission_way.getPath().addListener('set_at', (i) => {
            console.log('path set_at ' + i);
        });


        // Waypoints collection
        this.waypoints = new webix.DataCollection();

        // загружаем данные существующего задания
        webix.ajax().get('/api/missions/' + id, {}, function(t, d){
            const resp = d.json();

            if( 'success' == resp.status ){
                this.name = resp.name;
            }
            else {
                webix.message({type: 'error', text: 'Error while loading mission'});
                this.returnToList();
            }
        });

    }

    addWaypoint(){

    }

    openEditor(view){

        this.view = view;
        this.map = webix.$$('map2').getMap();
        this.points_table = view.queryView({ view:"datatable" });

        this.points_table.sync(this.waypoints);
        /*
        this.points_table.attachEvent('onItemClick', function(id){
            let sub = this.getSubView(id);

            if( sub && sub.isVisible() ){
                this.closeSub(id);
            }
            else {
                this.data.each( obj => this.closeSub(obj.id) );
                this.openSub(id);
            }

        });
        */
        this.setMap();

    }

    closeEditor(){
        this.points_table.detachEvent('onItemClick');
    }

    returnToList(){
        this.view.$scope.show('./modules.missions_list');
    }

    setMap(){

        this.mission_way.setMap(this.map);

        if( this.home_marker ) this.home_marker.setMap(this.map);

        this.waypoints.data.each( point => {
            point.marker.setMap(this.map);
        });

        // добавить точки
        this.mapListener = this.map.addListener('click', event => {
            this.mapClick(event);
        });

    }

    clearMap(){
        this.mission_way.setMap(null);

        this.home_marker.setMap(null);

        this.waypoints.data.each( point => {
            point.marker.setMap(null);
        });

        if( this.mapListener ) this.map.removeListener(this.mapListener);

    }

    mapClick(event){

        const path = this.mission_way.getPath();

        // add waypoint to polyline
        let num_of_points = path.push(event.latLng);

        // add marker
        const marker = new google.maps.Marker({
            position: event.latLng
            ,label: num_of_points > 1 ? (num_of_points-1).toString() : 'H'
            ,map: this.map
            ,zIndex: 2000
            ,icon: {
                path: google.maps.SymbolPath.CIRCLE
                ,scale: 11
                ,fillColor: '#ffbd4d'
                ,fillOpacity: 1.0
                ,strokeColor: '#000000'
                ,strokeWeight: 3
                ,zIndex: 2000
            }
            ,clickable: true
            ,draggable: true
            ,crossOnDrag: true
            ,title: 'Alt: 100m, speed: 20kpm'
        });
        marker.seq = num_of_points-1;

        marker.addListener('click', () => {
            webix.message('marker click');
        });

        marker.addListener('dragstart', () => {
            webix.message('marker dragstart');
        });

        marker.addListener('drag', (e) => {
            //webix.message('marker dragend ' + marker.seq);
            path.setAt(marker.seq, e.latLng);
        });


        // add to waypoints table
        if( num_of_points > 1 ){
            this.waypoints.add({seq: path.getLength()-1, title: 'Waypoint', alt: 100, spd: 20, pos: event.latLng, marker: marker});
        }
        else {
            // set mission home position
            // TODO
            this.home_marker = marker;
        }


    }

}
