// controllers / mission_edit

import MissionsCollection from './../models/MissionsCollection';
import Mission from './../models/Mission';


export default {

    ready: function(view){

        MissionsCollection.getItem(view.$scope.getParam("id")).ref.openEditor(view);

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
