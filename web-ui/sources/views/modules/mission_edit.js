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
    ,localId: 'mission:form'
    ,elementsConfig:{
        labelWidth: 110
    }
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
        ,{ view: 'counter', name: 'takeoff_alt', label: 'Takeoff alt, m', value: 40, title: 'takeoff to altitude before going to first point' }
        ,{ view: 'checkbox', name: 'rtl_end', label: "Return to home after mission ends", value:1, labelWidth: 240 }
    ]
};


// Waypoint form
const waypoint_form = {
    view:"form"
    ,borderless: true
    ,elementsConfig:{
        labelWidth: 90
    }
    ,elements:[
        {
            cols: [
                { view: 'counter', name: 'alt', label: 'Altitude, m', value: 100, title: 'Waypoint altitude in meters reletive to home or ground' }

            ]
        }
        ,{ view: 'radio', name: 'alt_rel', value: 1, label: 'relative to', options: [{id: 1, value: "home"}, {id: 2, value: "ground"}], vertical: false }
        ,{ view: 'counter', name: 'hold', label: 'Hold for, sec', value: 0, title: 'How long stay here (in seconds) before going to next waypoint' }
        ,{ view: 'counter', name: 'speed', label: 'Speed, kph', value: 20, title: 'Speed to achive (in km/h) at this point' }
        ,{
            cols: [
                {
                    view:"richselect"
                    ,width: 230
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
    localId: 'mission_edit_module'
    ,borderless: true
    ,rows: [

        // top toolbar with controls
        {
            view: 'toolbar'
            ,type: 'clean'
            //,height: 60
            ,elements: [
                {view:'icon', localId: 'button:return', icon: 'chevron-left', tooltip: 'Return to list'}
                ,{}
                ,{ view: 'icon', localId: 'button:trash', icon: 'trash', width: 60 }
            ]
        }

        ,mission_form

        // Lock button
        ,{
            cols: [
                {
                    view:"toggle",
                    type:"iconButton",
                    localId:"add_new_point",
                    offIcon:"lock",
                    onIcon:"unlock",
                    label:"Add new waypoint",
                    //onLabel:"Click on map to add",
                    width: 180
                }
                ,{
                    view: 'label'
                    ,localId: 'waypoint_add_label'
                    ,label: '' //
                }
            ]
        }

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