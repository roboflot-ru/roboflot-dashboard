import MissionsCollection from './MissionsCollection';


export default class Mission {

    // Creating new mission
    static create(){
        return new webix.promise(function(success, fail){
            webix.ajax().post('/api/missions/', { name: Mission.newName() }, (t, d) => {
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

    // Generate new mission name
    static newName(){
        const now = new Date();
        return 'New mission ' + now.format('short');
    }

    // FIXME
    static clearMapAll(){
        MissionsCollection.data.each(function(mission){
            mission.ref.clearMap();
        });
    }


    // Mission object construction
    constructor(id) {
        if( !id ) return;

        this.id = id;
        this.name = '';
        this.map = null;
        this.points_table = null;
        this.mission_way = new google.maps.Polyline({
            strokeColor: '#ffbd4d'
            ,strokeOpacity: 0.8
            ,strokeWeight: 2
            ,geodesic: true
            ,zIndex: 1
        });
        this.home_marker = null;
        this.takeoff_alt = 0;
        this.rtl_end = true;
        this.new_points_locked = true;
        this.rtl_path = new google.maps.Polyline({
            path: [],
            strokeOpacity: 0,
            geodesic: true,
            icons: [{
                icon: {
                    path: 'M 0,-1 0,1',
                    strokeOpacity: 1.0,
                    strokeColor: '#120dff',
                    scale: 3
                },
                offset: '0',
                repeat: '20px'
            }]
        });

        // Waypoints collection
        this.waypoints = new webix.DataCollection();

        /*
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
            //webix.message('path insert_at ' + i);
        });

        this.mission_way.getPath().addListener('remove_at', (i) => {
            //webix.message('path remove_at ' + i);
        });

        this.mission_way.getPath().addListener('set_at', (i) => {
            //console.log('path set_at ' + i);
        });

        */




    }

    addWaypoint(){
        // TODO сохранить точку на сервере
    }

    remove(){
        // Remove this mission

        webix.ajax().bind(this).del('/api/missions/' + this.id, null, function(t, d){
            const resp = d.json();

            if( 'success' == resp.status ){

                // TODO remove from collection
                MissionsCollection.remove(this.id);

                this.returnToList();
            }
            else {
                webix.message('Error deleting mission');
            }
        });
    }

    editName(new_name){
        const form = this.view.$scope.$$('mission:form');

        // TODO validate mission name

        if( new_name.length > 2 ){

            form.markInvalid('name', false);

            webix.ajax().bind(this).put('/api/missions/' + this.id + '/update', {name: new_name}, function(t,d){
                const resp = d.json();

                console.log(resp);

                if( 'success' == resp.status ){
                    //webix.message('New name saved');
                    let item = MissionsCollection.getItem(this.id);
                    if( item ){
                        item.name = resp.data.name;
                        MissionsCollection.updateItem(this.id, item);
                    }
                }
                else {
                    webix.message('Error saving mission name');
                }

            });
        }
        else {
            form.markInvalid('name', true);
        }
    }

    editAlt(new_alt){
        const form = this.view.$scope.$$('mission:form');

        // TODO validate mission takeoff alt

        if( new_alt > 1 ){

            form.markInvalid('takeoff_alt', false);

            webix.ajax().put('/api/missions/' + this.id + '/update', {takeoff_alt: new_alt}, function(t,d){
                const resp = d.json();

                console.log(resp);

                if( 'success' == resp.status ){
                    //webix.message('New alt saved');
                }
                else {
                    webix.message('Error saving mission takeoff alt');
                }

            });
        }
        else {
            form.markInvalid('takeoff_alt', true);
        }
    }

    editRTL(rtl){

        if( rtl == 1 ){
            this.rtl_path.setMap(this.map);
        }
        else {
            this.rtl_path.setMap(null);
        }

        webix.ajax().put('/api/missions/' + this.id + '/update', {rtl: rtl}, function(t,d){
            const resp = d.json();

            console.log(resp);

            if( 'success' == resp.status ){
                //webix.message('RTL saved');
            }
            else {
                webix.message('Error saving mission rtl');
            }

        });
    }

    updateHomePosition(){

        // save mission home position
        webix.ajax().bind(this).put('/api/missions/' + this.id + '/update', {home: [this.home_marker.getPosition().lat(), this.home_marker.getPosition().lng()]}, function(t,d){
            const resp = d.json();

            console.log(resp);

            if( 'success' == resp.status ){
                webix.message('Home updated');

            }
            else {
                webix.message('Error updating home');
            }

        });
    }

    unlockNewPoints(state){
        if( state == 1 ){
            this.new_points_locked = false;
            this.view.$scope.$$('waypoint_add_label').setValue('click on map to add new waypoint');
        }
        else {
            this.new_points_locked = true;
            this.view.$scope.$$('waypoint_add_label').setValue('');
        }
    }

    addWaypointMarker(data){
        const path = this.mission_way.getPath();

        // add marker
        const marker = new google.maps.Marker({
            position: data.position
            ,zIndex: 2000
            ,icon: marker_icon_normal
            ,clickable: true
            ,crossOnDrag: true
            ,title: data.seq > 0 ? 'Alt: ' + data.alt + ', Speed: ' + data.speed : 'Home and takeoff'
        });

        marker.seq = path.push(marker.getPosition()) - 1;

        marker.setLabel( marker.seq > 0 ? marker.seq.toString() : 'H' );

        marker.sid = ( marker.seq == 0 ? 'home' : (data.id ? data.id : webix.uid()) );

        marker.addListener('click', e => {
            this.editWaypoint(marker.sid);
        });

        marker.addListener('dragstart', () => {
            //webix.message('marker dragstart');
        });

        marker.addListener('dragend', () => {
            //webix.message('marker dragend');

            // TODO save new position of marker
            if( 'home' == marker.sid ){
                this.updateHomePosition();
            }
        });

        // move polyline point with marker
        marker.addListener('drag', (e) => {

            // move polyline points on marker drag
            path.setAt(marker.seq, e.latLng);

            if( this.waypoints.getLastId() ) {
                const last_marker = this.waypoints.getItem(this.waypoints.getLastId()).marker;

                // move rtl path if home or last point moved
                if (last_marker && ('home' == marker.sid || marker.seq == last_marker.seq)) {
                    this.rtl_path.setPath([this.home_marker.getPosition(), last_marker.getPosition()]);
                }
            }

        });

        // insert to data collection
        if( marker.seq > 0 ) {
            this.waypoints.add({
                id: marker.sid
                ,seq: marker.seq
                ,title: 'Waypoint'
                ,alt: data.alt
                ,spd: data.speed
                ,marker: marker
            });

            this.rtl_path.setPath([this.home_marker.getPosition(), marker.getPosition()]);
        }

        return marker;

    }

    openEditor(view){
        const _this = this;
        this.view = view;
        this.map = webix.$$('map2').getMap();
        this.points_table = view.queryView({ view:"datatable" });
        const mission_form = view.$scope.$$('mission:form');

        this.waypoints.clearAll();

        // Reset controls and event listeners
        this.points_table.detachEvent('onItemClick');
        mission_form.clear();
        mission_form.elements['name'].detachEvent("onChange");
        mission_form.elements['takeoff_alt'].detachEvent("onChange");
        mission_form.elements['rtl_end'].detachEvent("onChange");
        view.$scope.$$('add_new_point').detachEvent('onChange');

        // lock adding new waypoints
        this.new_points_locked = true;

        // Disabling view while loading data
        view.$scope.$$('mission_edit_module').disable();

        // Loading current mission data from server
        webix.ajax().bind(this).get('/api/missions/' + this.id, {}, function(t, d){
            const resp = d.json();

            if( 'success' == resp.status ){
                this.name = resp.data.name;
                this.rtl_end = resp.data.rtl_end;
                this.takeoff_alt = resp.data.takeoff_alt;

                // clear polyline
                this.mission_way.getPath().clear();

                // Place home marker
                if( resp.data.home ){
                    // home marker
                    this.home_marker = this.addWaypointMarker({
                        position: resp.data.home
                    });

                    // waypoints markers
                    if( resp.data.items.length ){
                        let marker = null;

                        for( let i = 0, k = resp.data.items.length; i < k; i++ ){
                            // place each on map
                            marker = this.addWaypointMarker({
                                 id: resp.data.items[i].id
                                ,position: resp.data.items[i].position
                                ,alt: resp.data.items[i].alt
                                ,speed: resp.data.items[i].speed
                            });

                        }
                    }
                }

                console.log(resp.data.items);

                // Waypoints table
                this.points_table.sync(this.waypoints);

                // Form
                mission_form.setValues(resp.data);

                // Attaching listeners
                view.$scope.$$('button:return').attachEvent('onItemClick', () => {
                    this.returnToList();
                });

                view.$scope.$$('button:trash').attachEvent('onItemClick', () => {
                    webix.confirm({
                        ok: "DELETE",
                        cancel: "cancel",
                        text: "Delete this mission completely?",
                        callback: function(result){ //setting callback
                            if( result ) _this.remove();
                       }
                    });
                });

                this.points_table.attachEvent('onItemClick', id => this.editWaypoint(id) );
                mission_form.elements['name'].attachEvent("onChange", new_name => this.editName(new_name));
                mission_form.elements['takeoff_alt'].attachEvent("onChange", new_alt => this.editAlt(new_alt));
                mission_form.elements['rtl_end'].attachEvent("onChange", rtl_end => this.editRTL(rtl_end));

                view.$scope.$$('add_new_point').attachEvent('onChange', state => this.unlockNewPoints(state));

                // Setting map for all mission items
                this.setMap();

                // Enabling editor
                view.$scope.$$('mission_edit_module').enable();

            }
            else {
                console.log('Error while loading mission ' + this.id);
                this.returnToList();
            }
        });

    }

    editWaypoint(id){
        const dt = this.points_table;
        const sub = dt.getSubView(id);
        const wp = this.waypoints.getItem(id);

        // if subview is opened, we need to close it
        if( sub && sub.isVisible() ){
            dt.closeSub(id);
            dt.unselectAll();
            wp.marker.setIcon(marker_icon_normal);
            wp.marker.setDraggable(false);
        }

        // else close all and open this one
        else {
            // normalize home marker
            if( 'home' != id ){
                this.home_marker.setIcon(marker_icon_normal);
                this.home_marker.setDraggable(false);
            }

            // normalize other waypoints
            dt.data.each( obj => {
                dt.closeSub(obj.id);
                obj.marker.setIcon(marker_icon_normal);
                obj.marker.setDraggable(false);

            } );

            dt.unselectAll();

            // edit selected
            if( wp ) {
                dt.select(id);
                dt.openSub(id);
                dt.showItem(id);
                // change marker color
                wp.marker.setIcon(marker_icon_edit);
                wp.marker.setDraggable(true);
            }

            // if HOME marker clicked
            else if( 'home' == id ){
                if( this.home_marker.getDraggable() ){
                    // turn to normal mode
                    this.home_marker.setIcon(marker_icon_normal);
                    this.home_marker.setDraggable(false);
                }
                else {
                    // turn to edit mode
                    this.home_marker.setIcon(marker_icon_edit);
                    this.home_marker.setDraggable(true);
                }
            }
        }
    }

    closeEditor(){
        this.points_table.detachEvent('onItemClick');
    }

    returnToList(){
        this.clearMap();
        this.view.$scope.show('./modules.missions_list');
    }

    // set all mission items to map
    setMap(){
        // polyline mission path
        this.mission_way.setMap(this.map);

        // set home marker
        if( this.home_marker ) this.home_marker.setMap(this.map);

        // set all other waypoints
        this.waypoints.data.each( point => {
            point.marker.setMap(this.map);
        });

        // show RTL path if checkbox set
        if( this.rtl_end ) this.rtl_path.setMap(this.map);

        // click event on map to add new waypoints
        this.mapListener = this.map.addListener('click', event => {
            this.mapClick(event);
        });

    }

    clearMap(){
        this.mission_way.setMap(null);

        if( this.home_marker ) this.home_marker.setMap(null);

        this.waypoints.data.each( point => {
            point.marker.setMap(null);
        });

        if( this.rtl_end ) this.rtl_path.setMap(null);

        if( this.mapListener ) this.mapListener.remove();

        console.log(this.map);

    }

    mapClick(event){
        // do nothing if adding locked
        if( this.new_points_locked ) return;

        // place marker to map
        const marker = this.addWaypointMarker({
             position: event.latLng
            ,alt: 101 // TODO get from previous point
            ,speed: 21 // TODO get from previous point
        });

        marker.setMap(this.map);

        // add to waypoints collection
        if( marker.seq > 0 ){

            const waypoint_data = {
                lat: event.latLng.lat()
                ,lon: event.latLng.lng()
                ,alt: 100 // TODO
                ,alt_rel: 'home'
                ,hold: 0
                ,speed: 20 // TODO
            };

            webix.ajax().post('/api/missions/' + this.id + '/waypoints/', waypoint_data, function(t,d){
                const resp = d.json();

                if( 'success' == resp.status ){
                    webix.message('point saved');
                }
                else {
                    webix.message('error saving point');
                }
            });
        }

        // or set home position
        else {
            // set mission home position
            this.home_marker = marker;
            this.updateHomePosition();

        }

        // turn waypoint to editable mode
        this.editWaypoint(marker.sid);


    }

}


const marker_icon_normal = {
    path: google.maps.SymbolPath.CIRCLE
    ,scale: 11
    ,fillColor: '#ffbd4d'
    ,fillOpacity: 1.0
    ,strokeColor: '#000000'
    ,strokeWeight: 2
    ,zIndex: 2000
};

const marker_icon_edit = {
    path: google.maps.SymbolPath.CIRCLE
    ,scale: 11
    ,fillColor: '#4aff0e'
    ,fillOpacity: 1.0
    ,strokeColor: '#000000'
    ,strokeWeight: 3
    ,zIndex: 2000
};