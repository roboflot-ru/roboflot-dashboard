import Robot from './../models/Robot';

export default {
    view: null

    ,init: function(view){
        /*
             view = webix component view
             view.$scope = webixjet view instance
             view.queryView({ view:"datatable" }) = get child view
             view.$scope.show('/app/view') = change view
        */

        this.view = view;

        //
        // Link control elements to its controllers

        // Cancel button
        view.$scope.$$('button:cancel').attachEvent('onitemclick', () => this.cancelButton() );

        // Save button
        view.$scope.$$('button:save').attachEvent('onitemclick', () => this.saveButton() );

    }

    // Save
    ,saveButton: function(){
        console.log('saving new robot');

        const form = this.view.queryView({ view:"form" });
        const values = form.getValues();

        this.view.disable();

        webix.ajax().post('/api/robots/', values).then( d => {
            const resp = d.json();

            console.log(resp);

            if( 'success' == resp.status ){
                webix.message('New robot saved');

                // TODO добавить робота в список
                // создать модель класса, и он сам добавит себя в список

                const new_robot = new Robot(resp.robot_id);

            }
            else {
                webix.message({type: 'error', text: resp.message});
            }

            this.view.enable();



        }).fail( e => {
            console.log(e);

            this.view.enable();

            webix.message('ERROR');
        });
    }

    // Cancel
    ,cancelButton: function(){
        // switch back to list
        this.view.$scope.app.$$('side_view1').setValue('robots_list_view');

        // clear form
        this.view.queryView({ view:"form" }).clear();
    }
}
