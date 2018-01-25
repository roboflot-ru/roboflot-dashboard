import {JetView, plugins} from "webix-jet";

const menu_data = [
     {id: "dashboard", icon: "dashboard", value: "Dashboard"}
    ,{id: "missions", icon: "globe", value:"Missions"}
    ,{id: "flightlogs", icon: "file-text-o", value:"Flight logs"}
    ,{id: "reports", icon: "line-chart", value:"Reports"}
    ,{id: "tools", icon: "wrench", value:"Tools"}
    ,{id: "docs", icon: "book", value:"Documentation"}
    ,{id: "logout", value: "Logout", icon: "sign-out"}
    // Multi level menu
    /*
    {id: "forms", icon: "pencil-square-o", value:"Forms",  data:[
        { id: "buttons", value: "Buttons"},
        { id: "selects", value: "Select boxes"},
        { id: "inputs", value: "Inputs"}
    ]},
    //*/

];

//*
export default class SidebarView extends JetView{
	init(){
		webix.$$("sidebar1").parse(menu_data);
		this.use(plugins.Menu, "sidebar1");
	}
	config(){
		return {
		    id: "sidebar1"
			//,width: 200
			,view: "sidebar"
			,collapsed: true
			//,type: "menuTree2"
            //,css: "menu"
			//,activeTitle: true
            //,select: true
            //,data: menu_data
			//,tooltip: {
			//	template: function(obj){
			//		return obj.$count ? "" : obj.details;
			//	}
			//}
			,on:{
				onBeforeSelect:function(id){
				    //console.log(this.getItem(id).$count);
					if(this.getItem(id).$count){
						return false;
					}
				},
				onAfterSelect:function(id){
					//const item = this.getItem(id);
					//webix.$$("title").parse({title: item.value, details: 'item.details'});
				}
			}
		};
	}
}
//*/



/*
const sidebar = {
    view: "sidebar"
    ,id: 'sidebar1'
    ,data: menu_data
    ,on:{
        onAfterSelect: function(id){
            webix.message("Selected: "+this.getItem(id).value)
        }
    }
};

export default sidebar;

//*/
