import {JetView} from "webix-jet";
import * as Cookies from "js-cookie";

export default class LoginView extends JetView{
	config(){
	    let values = webix.copy({
            email: '',
            pass: '',
            rememberme: false
        }, Cookies.getJSON("gcs"));

        const authService = this.app.getService('auth');

        const login_form = {
            view:"form",
            width:400, borderless:false, margin:10,
            rows:[
                { view:"text", name:"email", label:"Email", labelPosition:"top", placeholder: 'Enter you email', value: values.email},
                { view:"text", type:"password", name:"pass", label:"Password", labelPosition:"top", value: values.pass }
                ,{
                    view: 'checkbox',
                    name: "rememberme",
                    label: "Remember me",
                    labelPosition: "right",
                    labelWidth: 120,
                    checkValue: true,
                    uncheckValue: false,
                    value: values.rememberme
                }

                ,{ view:"button", value:"Sign in", click: function() {
                    this.$scope.do_login();
                }, hotkey:"enter", css: 'button_primary button_raised' }
                ,{}
                ,{
                    cols: [
                        { view:"button", value:"Sign up", click: function() {
                            console.log('signup pressed');
                            //this.app.show('/signup'); //error
                            // app.show('/signup'); // error
                            this.$scope.show('/signup');
                            this.$scope.app.show('/signup');
                            //this.$scope.signup();

                        }, css: 'button_primary' }
                        ,{ view:"button", value:"Remind password", click: function() {
                            console.log('pwrem pressed');
                            this.$scope.app.show('/remindpass');
                        }, css: 'button_primary' }
                    ]
                }
            ],
            rules:{
                email:webix.rules.isNotEmpty,
                pass:webix.rules.isNotEmpty
            }
        };

        return { rows: [ {}, { cols:[ {}, login_form, {}]}, {} ] };

	}

	init(view){
		view.$view.querySelector("input").focus();
        //webix.extend($$("loginForm"), webix.ProgressBar);
	}

	do_login(){
	    console.log('do login');

	    const authService = this.app.getService('auth');

		const user = this.app.getService("user");
		const form = this.getRoot().queryView({ view:"form" });

		if (form.validate()){
			const values = form.getValues();

            if (true === values.rememberme) {
                Cookies.set("gcs", values);
            } else {
                // Clear cookie
                Cookies.remove("gcs");
            }

            form.disable();

            authService.login(values.email, values.pass).catch(e => {
                webix.message({
                    type: "error",
                    text: "User/password combination not recognized"
                });

                //form.hideProgress();
                form.enable();
                form.focus();
            });

		} else {
		    webix.message('Check form fields');
        }

		/*
		let component = $$("loginForm");
        if (component.validate()) {
            component.disable();
            component.showProgress();

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
		 */
	}

	signup(){
	    console.log('signup pressed');
        window.testapp.show('/signup');
        //app.show('/signup'); // error
        //this.$scope.show('/signup'); // error
        //this.$scope.app.show('/signup'); // error
    }
}







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
