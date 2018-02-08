// controllers/missions

import MissionsCollection from './../models/MissionsCollection';
import Mission from './../models/Mission';


export default {

    ready: function(view){

        //
        // New mission button
        view.$scope.$$('button:add').attachEvent('onItemClick', function(){
            const _this = this;

            _this.disable();

            Mission.create().then(function(id){
                _this.enable();
                view.$scope.show('./modules.mission_edit?id=' + id);
            }).fail(function(){
                webix.message({type: 'error', text: 'Error while creating new mission'});
                _this.enable();
            });

        });

        //
        // Missions list
        const list_view = view.queryView({ view:"list" });

        // Syncing list with DataCollection
        list_view.data.sync(MissionsCollection);

        // Open on click
        list_view.attachEvent('onItemClick', function(id){
            this.select(id);

            view.$scope.show('./modules.mission_edit?id=' + id);

        });


        /*
             view = webix component view
             view.$scope = webixjet view instance
             view.queryView({ view:"datatable" }) = get child view
             view.$scope.show('/app/view') = change view




        MissionsCollection.attachEvent('onAfterAdd', function(id){
            webix.message('mission created ' + id);

            view.$scope.show('./modules.mission_edit?id=' + id);
        });
        */
    }

    ,destroy: function(scope){

        scope.$$('button:add').detachEvent("onItemClick");

        const list_view = scope.getRoot().queryView({ view:"list" });

        //if( !list_view ) return;

        //list_view.data.unsync();

        //list_view.detachEvent('onItemClick');


    }

}
