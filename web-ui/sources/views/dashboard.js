import {JetView, plugins} from "webix-jet";

// import map view
import main_map from 'views/modules/main_map';

// import right side panel views
import robot_form_new from 'views/modules/robot_form_new';
import robots_list from 'views/modules/robots_list';
import robot_dashboard from 'views/modules/robot_dashboard';
import robot_settings from 'views/modules/robot_settings';


export default class DashboardView extends JetView{
    config(){
        return view_config;
    }

    init(view){

        //this.show('./modules.robot_form_new');
        //console.log(this.getSubView('sidepanel'));

        //this.show('modules.robots_list', { target:"sidepanel" });
        this.$$('side_view1').attachEvent('onViewChange', (prevId, nextId) => {
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

            this.sideTitleUpdate(title);

        });
    }

    sideTitleUpdate(title){
        this.$$('rsidepanel').define("header", title);
        this.$$('rsidepanel').refresh();
    }

    ready(){
        this.$$('side_view1').setValue('robots_list_view');
        //this.show('modules.robots_list', { target:"sidepanel" });
        //this.app.getSubView('sidepanel').show('modules.robots_list');
    }
}


const view_config = {
    padding: 0
    ,borderless: true
    ,border: false
	,cols: [
		// map
		main_map

		//,{ $subview: 'modules.robots_list' }

		,{
            header: 'List'
			,headerAlt:'Robots list'
			,gravity: 2
            ,localId: 'rsidepanel'
			,collapsed: true
            ,borderless: true
            //,body: { $subview: true, name: 'sidepanel' }
            //*
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
