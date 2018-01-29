import RobotsCollection from './../models/RobotsCollection'

export default {
    ready: function(scope){
        /*
             view = webix component view
             view.$scope = webixjet view instance
             view.queryView({ view:"datatable" }) = get child view
             view.$scope.show('/app/view') = change view
        */
        console.log('robots_dashboard READY');

        //
        // Link control elements to its controllers

        // Go back to list on button click
        scope.$$('button:return').attachEvent('onItemClick', () => {

            // Отвязка от данных по нажатию на кнопку
            // TODO придумать как сделать лучше,
            // если не нажимать кнопку, а перейти на страницу, то выскочит ошибка, тк объект не отвязан от данных
            scope.$$('telem').unbind();
            scope.$$('robot_sys_load_gage').unbind();

            scope.show('list');

        });

        // bind list with data collection
        console.log('Inner param: ' + scope.getParam("id"));

        let item = RobotsCollection.getItem(scope.getParam("id"));

        if( item && item.Robot ){
            item.Robot.activateDashboard();
        }
        else {
            scope.show('list');
        }

        /*
        scope.$$('telem').attachEvent('onDestruct', function(){
            console.log('TELEM DESTRUCT');
            console.log(this);
            this.unbind();
        });
        */

    }

    ,unbindData: function(scope){
        console.log('UNBINDING COMPONETNS');

        //scope.$$('telem').unbind();
        //scope.$$('robot_speed_gage').unbind();
        //scope.$$('robot_sats_gage').unbind();
        //scope.$$('robot_sys_load_gage').unbind();

    }

    ,destroy: function(scope){
        console.log('robot_dashboard DESTROY');

        scope.$$('button:return').detachEvent('onItemClick');



        // TODO остановить передачу данных в панель
        //console.log(scope.$$('telem'));
        //console.log(webix.$$('robot_telemetry_list')); // not visible


        //console.log(scope.$$('telem').unbind);


        //scope.$$('telem').setValues({});

        //scope.$$('robot_telemetry_list').unbind();
        //scope.$$('robot_telemetry_list').setValues({});

        /*
        webix.$$('robot_speed_gage').unbind();
        webix.$$('robot_speed_gage').setValue(0);

        webix.$$('robot_sats_gage').unbind();
        webix.$$('robot_sats_gage').setValue(0);

        webix.$$('robot_sys_load_gage').unbind();
        webix.$$('robot_sys_load_gage').setValue(0);
        //*/

    }
}
