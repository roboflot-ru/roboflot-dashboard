export default {
    init: function(view){
        /*
             view = webix component view
             view.$scope = webixjet view instance
             view.queryView({ view:"datatable" }) = get child view
             view.$scope.show('/app/view') = change view
        */

        //
        // Link control elements to its controllers

        // Add new robot
        view.$scope.$$('add_robot').attachEvent('onitemclick', () => {
            view.$scope.app.$$('side_view1').setValue('robot_form_new');
        });

    }

    ,controllerFunc: function(){
        console.log('controllerFunc');
    }
}
