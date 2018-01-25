import {JetView} from "webix-jet";

export default class SignupView extends JetView{
	config(){
		return ui;
	}
	init(view){
		view.$view.querySelector("input").focus();
	}

	do_signup(){
		const user = this.app.getService("user");
		const form = this.getRoot().queryView({ view:"form" });

		if (form.validate()){
		    form.disable();

			const values = form.getValues();
			const app_loc = this.app;

            webix.ajax().post('/api/signup', {email: values.email, pass: values.pass1 }, function(t,d){
                const resp = d.json();
                if( 'success' == resp.status ){
                    webix.message('Successfully signed up');
                    app_loc.show('/login');
                }
                else {
                    webix.message({type: 'error', text: resp.message});
                }

                form.enable();
            });
		} else {
		    webix.message({type: 'error', text: 'Wrong data in fields'})
        }
	}
}

const signup_form = {
	view:"form",
	width:400, borderless:false, margin:10,
	rows:[
		{ view:"text", name:"email", label:"Email", labelPosition:"top" },
		{ view:"text", type:"password", name:"pass1", label:"Password", labelPosition:"top" },
		{ view:"text", type:"password", name:"pass2", label:"Confirm password", labelPosition:"top" },
		{ view:"button", value: "New user sign up", click: function(){
			this.$scope.do_signup();
		}, hotkey:"enter", type: 'form' }

		,{height: 10}

		,{
	        cols: [
	            { view:"button", value:"Sign in", click:function(){
                    this.$scope.app.show('/login');
                }, autowidth: true }
                ,{gravity: 2}
                ,{ view:"button", value:"Remind password", click:function(){
                    this.$scope.app.show('/remindpass');
                }, autowidth: true }
            ]
        }
	],
	rules:{
		email:webix.rules.isEmail
		,pass1:webix.rules.isNotEmpty
        ,pass2:webix.rules.isNotEmpty
        ,$obj:function(data){ // data = value
            if (data.pass1 != data.pass2){
                webix.message("Passwords are not the same");
                return false;
            }
            return true;
        }
	}
};

const ui = { rows: [ {}, { cols:[ {}, signup_form, {}]}, {} ] };



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
