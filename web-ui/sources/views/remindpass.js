import {JetView} from "webix-jet";

export default class RemindPassView extends JetView{
	config(){
		return ui;
	}

	init(view){
		view.$view.querySelector("input").focus();

	}

    remindpass(){
	    console.log('make password remind');
    }
}

const remind_form = {
	view:"form",
	width:400, borderless:false, margin:10,
	rows:[
		{ view:"text", name:"email", label:"Enter your email to remind password", labelPosition:"top" },
		{ view:"button", value:"Remind password", click:function(){
			this.$scope.remindpass();
		}, hotkey: "enter", type: 'form' }

		,{ height: 10 }

		,{
	        cols: [
	            { view:"button", value:"New user sign up", click: function() {
                    console.log('signup pressed');
                    this.$scope.app.show('/signup');
                }, autowidth:true}
                ,{gravity: 2}
                ,{ view:"button", value:"Sign in", click:function(){
	                this.$scope.app.show('/login');
                }, autowidth: true }
            ]
        }
	],
	rules:{
		email: webix.rules.isEmail
	}
};

const ui = { rows: [ {}, { cols:[ {}, remind_form, {}]}, {} ] };



/*
import {JetView} from "webix-jet";
import * as Cookies from "js-cookie";

export default class LoginView extends JetView {
    config() {
        let values = webix.copy({
            username: '',
            password: '',
            rememberme: false
        }, Cookies.getJSON("Crm"));

        const authService = this.app.getService('auth');

        let ui = {
            cols: [
                { gravity:1, template:"" },
                {
                    rows: [
                        {gravity: 1, template: ""},
                        {
                            view:  "form",
                            gravity: 1,
                            id:    'loginForm',
                            width: 500,

                            elements:       [
                                {
                                    view:        "text",
                                    id:          "username",
                                    name:        "username",
                                    label:       "Username",
                                    value:       values.username,
                                    required:    true,
                                    placeholder: 'username'
                                },
                                {
                                    view:     "text",
                                    id:       "password",
                                    name: "password",
                                    label:    "Password",
                                    value: values.password,
                                    required: true,
                                    type:     "password"
                                },
                                {
                                    view: 'checkbox',
                                    id: 'remember',
                                    name: "rememberme",
                                    label: "Remember credentials?",
                                    labelPosition: "left",
                                    labelWidth: 200,
                                    checkValue: true,
                                    uncheckValue: false,
                                    value: values.rememberme
                                },
                                {
                                    view:     "button",
                                    id: "login",
                                    name: "login",
                                    label: "Login",
                                    hotkey: "enter",
                                    click: function() {
                                        let component = $$("loginForm");
                                        if (component.validate()) {
                                            component.disable();
                                            component.showProgress();
                                            let values = $$("loginForm").getValues();
                                            if (true === values.rememberme) {
                                                Cookies.set("Crm", values);
                                            } else {
                                                // Clear cookie
                                                Cookies.remove("Crm");
                                            }
                                            authService.login(values.username, values.password).catch(e => {
                                                webix.message({
                                                    type: "error",
                                                    text: "User/password combination not recognized"
                                                });

                                                component.hideProgress();
                                                component.enable();
                                                component.focus();
                                            });
                                        } else {
                                            $$("loginForm").focus();
                                        }
                                    }
                                }
                            ],
                            elementsConfig: {
                                labelPosition: "top",
                                validateEvent: "key"
                            }
                        },
                        {gravity: 1, template: ""}
                    ]
                },
                { gravity:1, template:"" }
            ]
        };

        return ui;
    };

    init(view, url) {
        webix.extend($$("loginForm"), webix.ProgressBar);
    };
}
*/
