const main_toolbar = {
    view: "toolbar"
    ,padding: 3
    ,elements: [
        {view: "button", type: "icon", icon: "bars", width: 36
            ,click: function(){
                webix.$$("sidebar1").toggle();

                let icon = 'times';

                if( $$("sidebar1").config.collapsed ){
                    icon = 'bars';
                }

                this.define('icon', icon);
                this.refresh();
            }
        },
        { view: "label", id: 'app_title', label: "Roboflot GCS"},
        {},
        { view: "button", type: "icon", icon: "envelope-o", badge:4, width: 36},
        { view: "button", type: "icon", icon: "bell-o", badge:10, width: 36}
    ]
};

export default main_toolbar;
