import {JetView, plugins} from "webix-jet";
import main_map from 'views/modules/main_map';
import robots_list from 'views/modules/robots_list';
import robot_dashboard from 'views/modules/robot_dashboard';
import robot_settings from 'views/modules/robot_settings';


export default {
    padding: 0
	,cols: [
		// map
		main_map

		// multiview side panel with list switching to dashboard and settings form
		,{
			header:'List'
			,gravity: 2
			,collapsed: true
			,body: {
				id: 'side_view1'
				,view: "multiview"
				,fitBiggest: true
				,animate: true
				,value: 'robots_list_view'
				,cells: [
					// List
					robots_list

					// Dashboard
					,robot_dashboard

					// Settings
					,robot_settings

				]
			}
		}

	]
};
