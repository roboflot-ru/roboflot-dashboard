import {JetView, plugins} from "webix-jet";

// import map view
import main_map from 'views/modules/main_map';

// import right side panel views
import new_robot from 'views/modules/robot_form_new';
import list from 'views/modules/robots_list';
import robot from 'views/modules/robot_dashboard';
import robot_edit from 'views/modules/robot_settings';


export default class DashboardView extends JetView{
    config(){
        return view_config;
    }

    init(view){
        console.log('init dashboard view');

        /*

        //this.show('./modules.robot_form_new');
        //console.log(this.getSubView('sidepanel'));

        //this.show('modules.robots_list', { target:"sidepanel" });
        this.$$('side_view1').attachEvent('onViewChange', (prevId, nextId) => {

            console.log('dashboard view change ' + nextId);

            // TODO clear dashboard
            this.robotDashboardClear();


            let title = '';
            switch( nextId ){
                case 'robot_form_new':
                    title = 'Create new robot';
                    break;
                case 'robots_list_view':
                    title = 'List';
                    break;
                case 'robot_dashboard_view':
                    title = 'Dashboard';
                    break;
                case 'robot_settings_view':
                    title = 'Settings';
                    break;
                default:
                    title = 'List';
                    break;
            }

            //this.sideTitleUpdate(title);


        });
        //*/

        // TODO init map again

    }

    urlChange(view, url){

    }

    destroy(){

    }


    sideTitleUpdate(title){
        //this.$$('rsidepanel').define("header", title);
        //this.$$('rsidepanel').refresh();
    }

    ready(){
        console.log('DashBoard View ready');

        // TODO get all robots back to map


    }
}


const view_config = {
    padding: 0
    ,borderless: true
    ,border: false
	,cols: [
		// map
		main_map

        //side panel
		,{
            header: 'List'
			,headerAlt:'Robots list'
            ,width: 500
			,gravity: 2
            ,id: 'rsidepanel'
			,collapsed: true
            ,borderless: true
            ,body: {
                rows: [
                    { $subview: true }
                ]
            }

            /*
			,body: {
				id: 'side_view1'
				,view: "multiview"
				,fitBiggest: true
				,animate: true
				,value: 'robots_list_view'
				,cells: [
				    // List
					robot_form_new

					// List
					,robots_list

					// Dashboard
					,robot_dashboard

					// Settings
					,robot_settings

				]
			}
			//*/

        }

	]
};
