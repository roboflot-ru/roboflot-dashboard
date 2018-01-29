import {JetView} from "webix-jet";
import controllers from './../../controllers/robots_list';


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
    id: 'robots_list_view'
    ,rows: [

        // list itself
        {
            view: 'list'
            ,id: 'robots_list'
            ,template: '#name#' // '<div class="list_mark">#online#</div> #name#'
            ,scheme:{
                $change:function(obj){
                    /*
                    if( 'online' == obj.status ){
                        obj.$css = 'list_bg_green';
                    }
                    else if( 'online-nogps' == obj.status ){
                        obj.$css = 'list_bg_yellow';
                    }
                    else{
                        obj.$css = 'list_bg_red';
                    }
                    */
                }
            }
            ,type:{
                height:50
            }
            ,select:true
            //,ready:function(){
            //    if (!this.count()){
            //        webix.extend(this, webix.OverlayBox);
            //       this.showOverlay("<div style='margin:75px; font-size:20px;'>There is no data</div>");
            //    }
            //}
        }

        // bottom toolbar
        ,{
            view: 'toolbar'
            ,elements: [
                // + button to add new robot
                {view:'button', localId: 'button:add', type: 'iconButton', icon: 'plus', label: 'New', tooltip: 'Create new robot', autowidth: true}
            ]
        }

    ]

};