import {JetView} from "webix-jet";
import controllers from './../../controllers/robot_form_new';


export default class RobotNewFormView extends JetView{
    config(){
        return view_config;
    }

    init(view, url){

    }

    ready(view, url){
        controllers.init(view);
    }

    urlChange(view, url){}

    destroy(){
        controllers.destroy(this);
    }
}


const view_config = {
    id: 'robot_form_new'
    ,rows: [

        // form
        {
            view: 'form'
            ,borderless: true
            ,border: false
            ,elements: [
                {view: 'text', name: 'name', label: 'Name', invalidMessage: "letters and numbers only", placeholder: 'name your new robot'}
                ,{view: 'colorpicker', name: 'color', label: 'Color', value: 'FE860E'}
                ,{}
            ]
            ,rules: {
                name: function(value){
                    return /^[a-zа-яё]+[a-zа-яё0-9 -]+[a-zа-яё0-9]+$/i.test(value);
                }
            }
        }
        ,{ gravity: 4}

        // bottom toolbar
        ,{
            view: 'toolbar'
            ,elements: [
                {view: 'button', localId: 'button:save', value: 'Save', width: 130, type: 'form'}
                ,{gravity:4}
                ,{view: 'button', localId: 'button:cancel', value: 'Cancel', width: 100, type: 'danger'}
            ]
        }
    ]
};