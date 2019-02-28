// VIM_IP = "https://cloud-ass-2-vim.herokuapp.com"
VIM_IP = "http://localhost:3003"

login = async() => {
	username = document.getElementById("username").value;
	password = document.getElementById("password").value;
	body = {user:username,password:password}

	const response = await fetch(VIM_IP+"/user/login", {
	method: 'POST',
    body: JSON.stringify(body), // string or object
    headers:{
      'Content-Type': 'application/json'
    }
  });
  const myJson = await response.json();
  if (myJson.success == true) {
	  document.getElementById("vim").setAttribute("style","")
	  document.getElementById("login-frame").setAttribute("style","display:none")
	  user_key = myJson.user_key
	  populateVMList();
  } else [
	  alert("Invalid username/password")
  ]
}

createVM = async(type) => {
	body = {vm_type:type, user_key:user_key};
	const response = await fetch(VIM_IP+"/vm/create", {
	method: 'POST',
    body: JSON.stringify(body), // string or object
    headers:{
      'Content-Type': 'application/json'
    }
  });
  const myJson = await response.json();
}

populateVMList =() => {
	vmList = document.getElementById("vms");

}

var user_key = ""