//
//


//
// Simple views
/*
Here's a simple view with a list: views/list.js

export default {
    view:"list"
}

or

const list = {
    view:"list"
};
export default list;

 */

//
// Factory views
/*
views/details.js

export default () => {
    var data = [];

    for (var i=0; i<10; i++) data.push({ value:i });

    return {
        view:"list", options:data
    }
}

 */

//
// Class views
/*

Classes have the this pointer that references the view inside methods and handlers.

Here are the methods that you can redefine while defining your class views:
    config()
    init()
    urlChange()
    ready()
    destroy()

init(view, url)

view.queryView({view:"segmented"}).setValue(url[1].page);


This is how you can load data to a Jet class view:
// views/data.js
impport {records} from "../models/records";

        export default class DataView extends JetView{
            config(){
                return {
                    view:"datatable", autoConfig:true
                };
            }
            init(view){
                view.parse(records);
            }
        }


urlChange(view,url)

This method is called every time the URL is changed.
It reacts to the change in the URL after !#1. urlChange is only called
for the view that is rendered and for its parent.

ready(view,url)

ready is called when the current view and all its subviews have been rendered.

        export default class ListEditView extends JetView{
            config(){
                return {
                    cols:[
                        { $subview:"list", name:"list" },   //load "views/list"
                        { $subview:"form", name:"form" }    //load "views/form"
                    ]
                }
            }
            ready(){
                this.getSubview("form").bind(this.getSubview("list"));
            }
        }


destroy()

destroy is called only once for each class instance when the view is destroyed. The view is destroyed when the corresponding URL element is no longer present in the URL.



 */

//
// Subview Including
/*

plain including:

        import child from "views/child";
        ...
        {
            rows:[
                { view:"button" },
                child
            ]
        }


one view including with $subview:"view":

        import child from "views/child";
        ...
        {
            rows:[
                { view:"button" },
                { $subview:"child" }
            ]
        }


including a hierarchy of views with $subview:"top/some":

    import child from "views/child";
    import grandchild from "views/grandchild";

    ...
    {
        rows:[
            { view:"button" },
            { $subview:"child/grandchild" }
        ]
    }


Dynamic Including

        { $subview:true }




 */

//
// JetView API
/*

        this.use(plugin, config)	        switch on a plugin
        this.show("path")	                show a view or a subview
        this.ui(view)	                    create a popup or a window
        this.on(app,"event:name",handler)	attach an event
        this.getRoot()	                    call methods of the Webix widget
        this.getSubView(name)	            call the methods of a subview
        this.getParentView()	            call methods of a parent view
        this.$$("controlID")	            call methods of some Webix widget
        this.getUrl()	                    get the URL segment related to the view
        this.getParam(name, anywhere)	    give the API access to the URL parameters
        this.setParam(name, value)	        set the URL parameters


        init(){
            this.use(plugins.Status, {
                target: "app:status",
                ajax:true,
                expire: 5000
            });
        }

        this.show("details").then(/do something/);

Target

        {
            cols:[
                { $subview: true },
                { $subview: "right" },
            ]
        }
        ...
        this.show("small", { target:"right" })


The above code works the same as this:
        this.getSubView("right").show("small");



this.on(app,"app:event:name",handler) ↑

Use this method to attach events.

            export default class FormView extends JetView{
                init(){
                    this.on(this.app, "save:form", function(){
                        this.show("aftersave");
                    });
                }
            }


this.getRoot() ↑

Use this method to return the Webix widget inside a Jet class view and to call methods of a Webix widget.


this.getParam(name, [parent]) ↑

Use this method to get the URL related data. getParam() lets the API access the URL parameters (variables), including those of the parent views

#!/top/page?id=12/some

//from page.js
var id = this.getParam("id"); //id == 12


this.setParam(name, value, [url]) ↑

Use this method to set the URL related data. You can use setParam() to change a URL segment or a URL parameter:
view.setParam("mode", "12", true); // some?mode=12




 */

//
// Data

/*

        // models/records.js
        export const records = new webix.DataCollection({ data:[
            { id:1, title:"The Shawshank Redemption", year:1994, votes:678790, rating:9.2, rank:1},
            { id:2, title:"The Godfather", year:1972, votes:511495, rating:9.2, rank:2},
            //...other records
        ]});


This is how the data is loaded from and saved to the server:

        // models/records.js
        export const records = new webix.DataCollection({
            url:"data.php",
            save:"data.php"
        });


        // views/data.js
        import {JetView} from "webix-jet";
        import {records} from "models/records";

        export default class DataView extends JetView{
            config: () => {
                view:"datatable", autoConfig:true, editable:true
            }
            init(view){
                view.parse(records);
            }
        }


        // views/data.js
        import {JetView} from "webix-jet";
        import {records} from "models/records";

        export default class DataView extends JetView{
            config: () => {
                view:"datatable", autoConfig:true, editable:true
            }
            init(view){
                view.sync(records);
            }
            removeRecord(id){
                records.remove(id);
            }
        }


Shared Data Transport

To return several types of data and afterwards distribute data chunks to different views, a shared data transport can be used.
For example, this is the data model for grid:
            //models/griddata.js
            import {sharedData} from "models/shared";

            const gridData = new webix.DataCollection();
            gridData.parse(sharedData("grid"));

            export gridData;

And here is a separate file "shareddata" which communicates with shared data feed and can provide different data chunks for different consumers:
            //models/shareddata.js
            var data = webix.ajax("some.json").then(a => a.json());
            export function sharedData(name){
                return data.then(a => {
                    switch name:
                        case "grid":
                            return a.grid;
                        default:
                            return [];
                });
            }



 */




/*


import {JetView} from "webix-jet";

export default class MyView extends JetView{
    config: () => { template: "MyView text" };
}

// You can show the view by opening this path:
// index.html#!/myview



// views/bigview.js
import {JetView} from "webix-jet";
import MyView from "views/myview";

export default class BigView extends JetView{
    config: () => {
        rows:[
            MyView,
            {
                template:"BigView text"
            }
    ]}
}

// Sub view
// views/bigview.js
import {JetView} from "webix-jet";

export default class BigView extends JetView {
    config: () => {
            rows:[
                { $subview: true },
                { template:"BigView text" }
    ]}
}

//load views/myview.js
//index.html#!/bigview/myview

//load views/viewa.js
//index.html#!/bigview/viewa

//load views/viewb.js
//index.html#!/bigview/viewb


//
// Navigation

//  <a route="/details/data"></a>

// <a route="/details/data?id=2&name=some"></a>


// The app.show() method is applied to the whole application and rebuilds its UI.

// this.app.show("/demo/details");
// this.app.show("/demo/details?id=2&name=some");


// Rebuilding Part of the App

{ view:"button", value:"demo", click: () => {
    this.show("demo");
}},
{ $subview:true }

// this.show("demo?id=2&name=some");


// views/form.js
import {JetView} from "webix-jet";

export default class FormView extends JetView{
    init(){
        this.app.attachEvent("save:form", function(){
            this.show("aftersave");
        });
    }
}

app.attachEvent("app:guard", function(url, view, nav){
    if (url.indexOf("/blocked") !== -1)
        nav.redirect="/somewhere/else";
});


export default class DataView extends JetView{
    config(){
        return {
            view:"button", click:() => {
                this.app.callEvent("save:form");
            }
        }
    }
}

export default class FormView extends JetView{
    init(){
        this.app.attachEvent("save:form", function(){
            this.show("aftersave");
        });
    }
    destroy(){
        this.app.detachEvent("save:form");
    }
}


//
// Service

export default class treeView extends JetView{
    config(){
        return { view:"tree" };
    }
    init() {
        this.app.setService("masterTree", {
            getSelected : () => this.getRoot().getSelectedId();
        })
    }
}


import {JetView} from "webix-jet";
import {getData} from "models/records";

export default class FormView extends JetView{
    config(){
        return {
            view:"form", elements:[
                { view:"text", name:"name" }
            ]
        };
    }
    init(){
        var id = this.app.getService("masterTree").getSelected();
        this.getRoot().setValues(getData(id));
    }
}


// app.show("/demo/details")


// Plugins
import session from "models/session";

app.use(plugins.User, { model: session });







*/

