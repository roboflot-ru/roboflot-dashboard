const main_toolbar = {
    view: "toolbar"
    ,padding: 3
    ,elements: [
        {view: "button", type: "icon", icon: "bars", width: 36
            ,click: function(){
                $$("sidebar1").toggle();
            }
        },
        { view: "label", label: "Roboflot GCS"},
        {},
        { view: "button", type: "icon", icon: "envelope-o", badge:4, width: 36},
        { view: "button", type: "icon", icon: "bell-o", badge:10, width: 36}
    ]
};

export default main_toolbar;
