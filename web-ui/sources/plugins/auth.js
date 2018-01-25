import * as Cookies from "js-cookie";

export function auth(app, view, config) {

    const authModel   = config.model;
    const login       = config.login || "/login";
    const logout      = config.logout || "/app/logout";
    const afterLogin  = config.afterLogin || app.config.start;
    const afterLogout = config.afterLogout || "/login";
    const ping        = config.ping || 5 * 60 * 1000;

    let credentials = Cookies.getJSON("user") || null;

    const service = {

        getUser() {
            return credentials;
        },

        getStatus(server) {
            if (!server) {

                return credentials !== null;

            }

            return authModel.status_server().catch(() => null).then(data => {
                credentials = data;
            });

        },

        login(name, pass) {
            return authModel.login(name, pass).then((data) => {

                credentials = data;

                console.log(data);

                if (!data) {
                    throw ("Access denied");
                }

                app.show(afterLogin);
            });
        },

        logout() {
            credentials = null;
            authModel.logout();
            app.show(afterLogout);
        }
    };

    function canNavigate(url, obj) {
        console.log('nav:' + url);

        if (url === logout) {
            service.logout();
            obj.redirect = afterLogout;
            app.show(afterLogout);
        } else if (url !== '/signup' && url !== '/remindpass' && url !== login && !service.getStatus()) {
            console.log('redir to login');
            obj.redirect = login;
            app.show(login);
        }
    }

    app.setService("auth", service);

    app.attachEvent(`app:guard`, function (url, _$root, obj) {
        console.log('app:guard ' + url);

        if (credentials === null) {
            obj.confirm = service.getStatus(true).then(any => {
                console.log('app:guard nav after server status to ' + url);
                canNavigate(url, obj);
            });
        } else {
            console.log('app:guard nav to ' + url);
            canNavigate(url, obj);
        }
    });

    if (ping) {
        setInterval(() => service.getStatus(true), ping);
    }

    console.log('start nav');
    canNavigate(app.$router.get(), {});

}
