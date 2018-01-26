import {JetView} from "webix-jet";
import main_toolbar	from "views/toolbars/main_toolbar";
import sidebar from "views/menus/sidebar";


export default class AppView extends JetView {
	config(){
		return layout;
	}
	init(){
		//this.ui(search);
		//this.ui(mail);
		//this.ui(message);
		//this.ui(profile);
	}
}


const layout = {
    rows:[
		main_toolbar,
		{
			cols:[
				sidebar
                ,{
					rows:[
						//{ height: 49, id: "title", css: "title", template: "<div class='header'>#title#</div><div class='details'>( #details# )</div>", data: {text: "",title: ""}},
						{
							//view: "scrollview", scroll:"native-y",
							body: { $subview: true }
						}
					]
				}
			]
		}
	]
};


/*
//import {User} from "../../libs/webix-jet-core/sources/plugins/User";
import {userModel} from "../models/userModel";


export default class TopView extends JetView{
	config() {
		var header = {
			type:"header", template:this.app.config.name
		};

		var menu = {
			view:"menu",
			id:"top:menu",
			width:180,
			layout:"y",
			select:true,
			navigation: true,
			template:"<span class='webix_icon fa-#icon#'></span> #value# ",
			data:[
				{ value:"DashBoard", id:"start", icon:"envelope-o" },
				{ value:"Data",		 id:"data",  icon:"briefcase" },
                { $template:"Separator" },
                { value: "Logout",   id: "logout", icon: "sign-out"}
            ]
		};

		var ui = {
			type:"line",
			cols:[
				{
					type:"clean",
					css:"app-left-panel",
					padding:10,
					margin:20,
					borderless:true,
					rows: [ header, menu ]
				},
				{ rows:[
					{
						height:10
					},
					{
						type:"clean",
						css:"app-right-panel",
						padding:4,
						rows:[
							{ $subview:true }
						]
					}
				]}
			]
		};


		return ui;
	};

	init() {

		this.use(plugins.Menu, {
			id: "top:menu",
			urls: {
			}
		});
	};
}
*/

