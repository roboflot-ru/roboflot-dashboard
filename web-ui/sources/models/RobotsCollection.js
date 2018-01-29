import Robot from './Robot';


/*
// This is data collection for all robots in list
// Adding new item to the collection makes it create new Robot instance
// After that it's possible to access each Robot methods by datastore.getItem(id).Robot.robotClassMethod()
//*/
const RobotsCollection = new webix.DataCollection({
    url:"/api/robots/"

    ,on: {
        //
        // After creating new robot it's added with RobotsCollection.add({data})
        'onAfterAdd': function(id){
            console.log('rob collection add ' + id.toString());

            // Get new item data from colelction
            let item = this.getItem(id);

            // creating new instance of Robot for the new item
            // datastore.getItem(id).Robot will be Robot model instance
            item['Robot'] = new Robot(item);

            // updating collection
            this.updateItem(id, item);

        }

        //
        // After loading data to collection we need to create Robot instances for each one
        ,'onAfterLoad': function(){
            console.log('Robots data loaded');

            // Creating new instances of Robot for each loaded item in collection
            let item = {};
            if (this.data.each){
                this.data.each(function(obj){
                    // creating new instance of Robot for the new item
                    obj['Robot'] = new Robot(obj);

                    this.updateItem(obj.id, obj);
                });
            }

        }

    }

});

export default RobotsCollection;