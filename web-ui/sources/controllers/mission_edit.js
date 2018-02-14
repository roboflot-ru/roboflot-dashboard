// controllers / mission_edit

import MissionsCollection from './../models/MissionsCollection';
import Mission from './../models/Mission';


export default {

    ready: function(view){


        const mission = MissionsCollection.getItem(view.$scope.getParam("id"));
        if( mission ) mission.ref.openEditor(view);
        else {
            view.$scope.show('./modules.missions_list');
        }

        /*
             view = webix component view
             view.$scope = webixjet view instance
             view.queryView({ view:"datatable" }) = get child view
             view.$scope.show('/app/view') = change view
        */

    }

    ,destroy: function(scope){
        //Mission.clearMapAll();
    }

}
