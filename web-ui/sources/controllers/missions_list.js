// controllers/missions

import MissionsCollection from './../models/MissionsCollection'


export default {

    ready: function(view){
        /*
             view = webix component view
             view.$scope = webixjet view instance
             view.queryView({ view:"datatable" }) = get child view
             view.$scope.show('/app/view') = change view
        */

        // Add new mission button
        view.$scope.$$('button:add').attachEvent('onItemClick', () => {
            webix.message('new mission create');

            //MissionsCollection.add({name: 'test ' + (new Date().getSeconds())});

            view.$scope.show('./modules.mission_edit?id=new');

        });


        const list_view = view.queryView({ view:"list" });

        //
        // Link control elements to its controllers

        // Syncing list with DataCollection
        list_view.data.sync(MissionsCollection);

        // Open on click
        list_view.attachEvent('onItemClick', (id) => {
            list_view.select(id);

            webix.message('mission item click ' + id);

            //view.$scope.show('robot?id=' + id);

        });

    }

    ,destroy: function(scope){

        const list_view = scope.getRoot().queryView({ view:"list" });

        if( !list_view ) return;

        //list_view.data.unsync();

        list_view.detachEvent('onItemClick');
        scope.$$('button:add').detachEvent("onItemClick");

    }

}
