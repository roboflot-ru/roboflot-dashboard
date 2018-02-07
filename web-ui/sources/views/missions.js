import {JetView} from "webix-jet";

// import map view
import missions_map from 'views/modules/missions_map';



export default class MissionsView extends JetView{
    config(){
        return view_config;
    }

    init(view, url){}

    ready(view, url){}

    urlChange(view, url){}

    destroy(){}

}


const view_config = {
    padding: 0
    ,borderless: true
    ,border: false
	,cols: [
		// map
		missions_map

        //side panel
		,{
            width: 500
			,gravity: 2
            ,id: 'missions_side_panel'
            ,borderless: true
            ,body: {
                borderless: true
                ,rows: [
                    { $subview: true }
                ]
            }
        }

	]
};