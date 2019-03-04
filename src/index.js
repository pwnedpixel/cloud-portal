VIM_IP = "https://cloud-ass-2-vim.herokuapp.com"
// VIM_IP = "http://localhost:3003"

login = async() => {
	username = document.getElementById("username").value;
	password = document.getElementById("password").value;
	body = {user:username,password:password}

	const response = await fetch(VIM_IP+"/user/login", {
	method: 'POST',
    body: JSON.stringify(body),
    headers:{
      'Content-Type': 'application/json'
    }
  });
  const myJson = await response.json();
  if (myJson.success == true) {
	  document.getElementById("vim").setAttribute("style","")
	  document.getElementById("login-frame").setAttribute("style","display:none")
	  cc_id = myJson.cc_id
	  populateVMList();
  } else [
	  alert("Invalid username/password")
  ]
}

createVM = async(type) => {
	body = {vm_type:type, cc_id:cc_id};
	const response = await fetch(VIM_IP+"/vm/create", {
	method: 'POST',
    body: JSON.stringify(body),
    headers:{
      'Content-Type': 'application/json'
    }
  });
  const myJson = await response.json();
}

populateVMList = async() => {
	var vmTable = document.getElementById("vms");
  const response = await fetch(VIM_IP+"/vm/"+cc_id);
  vmList = await response.json();
  for (var vm of JSON.parse(vmList)){
    var tr = document.createElement("tr");

    // Add the id column
    var id_col = document.createElement("td");
    id_col.textContent = vm.VM_ID;
    // Add the type column
    var size_col = document.createElement("td");
    size_col.textContent = vm.VM_TYPE;
    // Add the Actions column
    var actions_col = document.createElement("td");
    var start_button = document.createElement("button");
    var stop_button = document.createElement("button");
    var delete_button = document.createElement("button");
    var upgrade_button = document.createElement("button");
    var downgrade_button = document.createElement("button");
    var start_button = document.createElement("button");

    tr.appendChild(id_col);
    tr.appendChild(size_col);
    vmTable.appendChild(tr);
  }
}

var cc_id = ""
var vmList = []