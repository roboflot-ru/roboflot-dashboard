//import Robot from './Robot';


const MissionsCollection = new webix.DataCollection({
    url: '/api/missions/'
    ,save: '/api/missions/'
    ,rules:{
        //"year": webix.rules.isNotEmpty,
        //"value": function(value){ return value > 0 }
    }

    ,on: {
        //
        // After creating new robot it's added with RobotsCollection.add({data})
        'onAfterAdd': function(id){
            // Get new item data from colelction
            let item = this.getItem(id);

            // creating new instance of Robot for the new item
            // datastore.getItem(id).Robot will be Robot model instance
            //item['Robot'] = new Robot(item);

            // updating collection
            //this.updateItem(id, item);

        }

        //
        // After loading data to collection we need to create Robot instances for each one
        ,'onAfterLoad': function(){
            console.log('Missions data loaded');

            // Creating new instances of Robot for each loaded item in collection
            let item = {};
            if (this.data.each){
                this.data.each(function(obj){
                    // creating new instance of Robot for the new item
                    //obj['Robot'] = new Robot(obj);

                    //this.updateItem(obj.id, obj);
                });
            }

        }

    }

});

export default MissionsCollection;
