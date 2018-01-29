import RobotsCollection from './../models/RobotsCollection';

export default {
    view: null

    ,init: function(view){
        /*
             view = webix component view
             view.$scope = webixjet view instance
             view.queryView({ view:"datatable" }) = get child view
             view.$scope.show('/app/view') = change view
        */
        console.log('robot_form_new INIT');

        //
        // Link control elements to its controllers

        // Cancel button
        view.$scope.$$('button:cancel').attachEvent('onItemClick', () => this.cancelButton(view.$scope) );

        // Save button
        view.$scope.$$('button:save').attachEvent('onItemClick', () => this.saveButton(view.$scope) );

        console.log('robot_form_new INIT END');

    }

    ,destroy: function(t){
        console.log('robot_form_new DESTROY');

        t.$$('button:cancel').detachEvent('onItemClick');
        t.$$('button:save').detachEvent('onItemClick');

    }

    // Save
    ,saveButton: function(scope){
        console.log('saving new robot');

        const form = scope.getRoot().queryView({ view:"form" });
        const values = form.getValues();

        form.disable();
        scope.$$('button:save').disable();

        // TODO validate form

        webix.ajax().post('/api/robots/', values).then( d => {
            const resp = d.json();

            console.log(resp);

            if( 'success' == resp.status ){
                webix.message('New robot saved');

                // добавить робота в список
                RobotsCollection.add(resp.data);

                this.cancelButton(scope);

            }
            else {
                webix.message({type: 'error', text: resp.message});

                form.enable();
                scope.$$('button:save').enable();
            }

        }).fail( e => {
            console.log(e);

            form.enable();
            scope.$$('button:save').enable();

            webix.message('ERROR');
        });
    }

    // Cancel
    ,cancelButton: function(scope){
        // switch back to list
        scope.show('./list');
    }

}
