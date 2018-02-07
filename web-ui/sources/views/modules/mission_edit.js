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


const list_data = [
            { id:1, title:"Point", year:1994, rank:1, markCheckbox:1},
            { id:2, title:"Point", year:1972,  rank:2, markCheckbox:0},
            { id:3, title:"Point", year:1974, rank:3},
            { id:4, title:"Point", year:1966, rank:4, markCheckbox:1},
            { id:5, title:"Point", year:1964, rank:5, markCheckbox:1},
            { id:6, title:"Point", year:1957, rank:6, markCheckbox:0}
        ];


const view_config = {
    localId: 'mission_edit'
    ,borderless: true
    ,rows: [

        // form
        {
            view: 'form'
            ,borderless: true
            ,rows: [
                // Mission name
                { view: 'text', name: 'name', label: 'Name', placeholder: 'name your mission' }

                //

                /*
                ,{
                    view:"richselect", width:300, yCount:2,
                    label: 'Fruit',  name:"fruit1",
                    value:1, options:[
                        { id:1, value:"Banana"   },
                        { id:2, value:"Papaya"   },
                        { id:3, value:"Apple" }
                    ]
                }
                 */
            ]
        }
        ,{ template: 'Click on map to place starting point', height: 50, borderless: true }
        ,{
			view: "datatable"
			,select: true
            ,borderless: true
			,data: list_data
            /*
			activeContent:{
				contextMenuIcon: {
					id: "contextMenuIconId",
					view: "icon",
					icon: "bars",
					width: 40,
					//click: editClick
				}
			}

			,template: "<div class='mission_seq'>#id#.</div><div class='seq_title'>#title#</div>"+
                    "<div class='seq_button'>{common.contextMenuIcon()}</div>"

			,type: {
				height:65
			}
			*/
            ,columns:[
					{ id:"title",	header:"Wayoints", template:"<b>#id#</b> #title#", fillspace: true},
					{ id:"year",	header:"Alt, m", width: 80},
					{ id:"rank",	header:"Speed, kph", width:80}
				]
            //,autowidth: true
			,subview:{
                view:"form",
                elements:[
                    { view:"text", name:"title", label:"Title"},
                    { view:"text", name:"year", label:"Year"}
                ]
            }

		}

    ]

};