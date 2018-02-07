import {JetView} from "webix-jet";
import controllers from './../../controllers/missions_list';


export default class RobotsListView extends JetView{
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


const view_config = {
    localId: 'missions_list_view'
    ,rows: [

        // list itself
        {
            view: 'list'
            ,localId: 'missions_list'
            ,template: '#name#'
            ,type:{
                height:50
            }
            ,select:true
        }

        // bottom toolbar
        ,{
            view: 'toolbar'
            ,elements: [
                {view:'button', localId: 'button:add', type: 'iconButton', icon: 'plus', label: 'New', tooltip: 'Create new mission', autowidth: true}
            ]
        }

    ]

};