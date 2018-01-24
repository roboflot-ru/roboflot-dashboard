function signup(email, pass){
    console.log('user signup');
	return webix.ajax().post("/api/signup", {
		email, pass
	}).then(a => a.json());
}

function status(){
	console.log('user status');
	return webix.ajax().get("/api/login")
		.then(a => a.json());
}

function login(user, pass){
    console.log('user login');
	return webix.ajax().post("/api/login", {
		user, pass
	}).then(a => a.json());
}

function logout(){
    console.log('user logout');
	return webix.ajax().post("/api/logout")
		.then(a => a.json());
}

export default {
	signup, status, login, logout
}
