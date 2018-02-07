// controllers / mission_edit

import MissionsCollection from './../models/MissionsCollection'


export default {

    ready: function(view){
        /*
             view = webix component view
             view.$scope = webixjet view instance
             view.queryView({ view:"datatable" }) = get child view
             view.$scope.show('/app/view') = change view
        */

        webix.message(view.$scope.getParam("id"));

        const points_table = view.queryView({ view:"datatable" });

        points_table.attachEvent('onItemClick', function(id){
            points_table.data.each( obj => points_table.closeSub(obj.id) );
            points_table.openSub(id);
        });

    }

    ,destroy: function(scope){


    }

}
