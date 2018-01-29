import {JetView} from "webix-jet";

// remember map state here (position and zoom)
let map_state = null;

export default class DashboardMapView extends JetView {
    config() {
        view_config.key = this.app.config.google_maps_api_key;

        return view_config;
    }

    init(view){

    }

    ready(view){
        console.log('main_map READY');

        // set map state if saved before
        if( map_state ){
            this.getRoot().getMap().setCenter(map_state.center);
            this.getRoot().getMap().setZoom(map_state.zoom);
        }
    }

    destroy(){
        console.log('main_map DESTROY');

        // remember map state
        map_state = {
            center: this.getRoot().getMap().getCenter()
            ,zoom: this.getRoot().getMap().getZoom()
        };
    }
};


const view_config = {
    key: '',
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
};