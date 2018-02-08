import {JetView} from "webix-jet";
import controllers from './../../controllers/mission_edit';


export default class MissionEditView extends JetView{
    config(){
        return view_config;
    }

    init(view){}

    ready(view){
        controllers.ready(view);
    }

    urlChange(view, url) {}

    destroy(){
        controllers.destroy(this);
    }
}

// Mission form
const mission_form = {
    view: 'form'
    ,borderless: true
    //,elementsConfig:{
    //    labelPosition: "left"
    //    ,labelWidth: 200
    //}
    ,rows: [
        { view: 'text', name: 'name', label: 'Name', placeholder: 'name your mission' }

        /*
        ,{
            cols: [
                { view: 'counter', name: 'def_alt', label: 'Default altitude', value: 100, bottomPadding: 25, bottomLabel: 'meters', labelWidth: 100 }
                ,{ view: 'counter', name: 'def_speed', label: 'Default speed', value: 20, bottomPadding: 25, bottomLabel: 'kph', labelWidth: 100 }
            ]
        }
        */
        ,{ view: 'counter', name: 'takeoff_alt', label: 'Takeoff alt', value: 40, bottomPadding: 25, bottomLabel: 'takeoff to altitude before going to first point', labelWidth: 100 }
        ,{ view: 'checkbox', name: 'rtl_end', label: "Return to home after mission ends", value:1, labelWidth: 240 }
    ]
};


// Waypoint form
const waypoint_form = {
    view:"form"
    ,borderless: true
    ,elements:[
        {
            cols: [
                { view: 'counter', name: 'alt', label: 'Altitude', value: 100, bottomPadding: 25, bottomLabel: 'meters', labelWidth: 100 }
                ,{ view: 'radio', name: 'alt_rel', value: 1, label: 'relative to', options: [{id: 1, value: "home"}, {id: 2, value: "ground"}], labelWidth: 80 }
            ]
        }
        ,{ view: 'counter', name: 'hold', label: 'Hold here for', value: 0, bottomPadding: 25, bottomLabel: 'seconds', labelWidth: 100  }
        ,{ view: 'counter', name: 'speed', label: 'Speed', value: 20, bottomPadding: 25, bottomLabel: 'kph', labelWidth: 100 }
        ,{
            cols: [
                {
                    view:"richselect"
                    ,width:300
                    ,label: 'Camera'
                    ,name: 'cam'
                    ,value:1, options:[
                         { id: 1, value: 'no change' }
                        ,{ id: 2, value: 'take photo' }
                        ,{ id: 3, value: 'take photos (time)' }
                        ,{ id: 4, value: 'take photos (distance)' }
                        ,{ id: 5, value: 'stop taking photos' }
                        ,{ id: 6, value: 'start video' }
                        ,{ id: 7, value: 'stop video' }
                    ]
                }
                ,{ view: 'text', name: 'cam_dist', label: 'Distance' }
            ]
        }
    ]

};


const view_config = {
    localId: 'mission_edit'
    ,borderless: true
    ,rows: [

        mission_form

        ,{ template: 'Click on map to place starting point', height: 50, borderless: true }

        // Waypoints table
        ,{
			view: "datatable"
			,select: true
            ,borderless: true
			,data: []//list_data
            ,columns:[
					{ id:"title", header:"Wayoints", template:"<b>#seq#</b> #title#", fillspace: true},
					{ id:"alt",	header:"Alt, m", width: 80},
					{ id:"spd",	header:"Speed, kph", width:80}
				]
            //,autowidth: true
			,subview: waypoint_form

		}

    ]

};