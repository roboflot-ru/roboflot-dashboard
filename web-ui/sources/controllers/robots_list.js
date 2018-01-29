import RobotsCollection from './../models/RobotsCollection'

export default {
    ready: function(view){
        /*
             view = webix component view
             view.$scope = webixjet view instance
             view.queryView({ view:"datatable" }) = get child view
             view.$scope.show('/app/view') = change view
        */
        console.log('robots list INIT');

        const list_view = view.queryView({ view:"list" });

        //
        // Link control elements to its controllers

        // Add new robot button
        view.$scope.$$('button:add').attachEvent('onItemClick', () => view.$scope.show('./new_robot'));

        // Syncing list with DataCollection
        list_view.data.sync(RobotsCollection);

        // Open robot's dashboard on click
        list_view.attachEvent('onItemClick', (id) => {
            list_view.select(id);

            view.$scope.show('robot?id=' + id);

        });

        // TODO переписать данные на карту с каждого робота
        RobotsCollection.data.each(function(obj){
            // creating new instance of Robot for the new item
            if( obj.Robot ) obj.Robot.putOnMap();

        });

    }

    ,destroy: function(scope){
        console.log('robots list DESTROY');

        const list_view = scope.getRoot().queryView({ view:"list" });

        if( !list_view ) return;

        //list_view.data.unsync();

        list_view.detachEvent('onItemClick');
        scope.$$('button:add').detachEvent("onItemClick");

    }

}
