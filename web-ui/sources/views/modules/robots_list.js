export default {
    id: 'robots_list_view'
    ,rows: [

        // list itself
        {
            view: 'list'
            ,id: 'robots_list'
            ,template: '#name#' // '<div class="list_mark">#online#</div> #name#'
            ,scheme:{
                $change:function(obj){
                    if( 'online' == obj.status ){
                        obj.$css = 'list_bg_green';
                    }
                    else if( 'online-nogps' == obj.status ){
                        obj.$css = 'list_bg_yellow';
                    }
                    else{
                        obj.$css = 'list_bg_red';
                    }
                }
            }
            ,type:{
                height:50
            }
            ,select:true
        }

        // bottom toolbar
        ,{
            view: 'toolbar'
            ,elements: [
                {gravity: 4}
                // + button to add new robot
                ,{view:'icon', id: 'add_robot', icon: 'plus', css: 'action_icon', tooltip: 'Add new'}
            ]
        }

    ]

};