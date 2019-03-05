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
  const loginResponse = await response.json();
  if (loginResponse.success == true) {
	  document.getElementById("vim").setAttribute("style","")
	  document.getElementById("login-frame").setAttribute("style","display:none")
	  cc_id = loginResponse.cc_id
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
  populateVMList();
}

populateVMList = async() => {
	var vmTable = document.getElementById("vms");
  var headers = document.getElementById("header-row");
  vmTable.innerHTML="";
  vmTable.appendChild(headers);
  const response = await fetch(VIM_IP+"/vm/"+cc_id);
  vmList = await response.json();
  vmList = JSON.parse(vmList)

  for (var vm of vmList){
    var tr = document.createElement("tr");
    // Add the id column
    var id_col = document.createElement("td");
    id_col.textContent = vm.VM_ID;
    // Add the type column
    var size_col = document.createElement("td");
    size_col.textContent = vm.VM_TYPE;
    // Add the Controls column
    var actions_col = document.createElement("td");
    // Add the Monitoring column
    var monitor_col = document.createElement("td");
    monitor_col.id = "monitor_" + vm.VM_ID;

    // Buttons
    // Start Button
    var start_button = document.createElement("BUTTON");
    start_button.innerText = "Start";
    start_button.id = vm.VM_ID;
    start_button.onclick = (event) => {startVM(event)};
    if (vm.VM_STATE == "START") {
      start_button.disabled = true;
    }
    // Stop button
    var stop_button = document.createElement("button");
    stop_button.innerText = "Stop";
    stop_button.id = vm.VM_ID;
    stop_button.onclick = (event) => {stopVM(event)};
    if (vm.VM_STATE == "STOP") {
      stop_button.disabled = true;
    }
    // Delete button
    var delete_button = document.createElement("button");
    delete_button.innerText = "Delete";
    delete_button.id = vm.VM_ID;
    delete_button.onclick = (event) => {deleteVM(event)};
    // Usage button
    var usage_button = document.createElement("button");
    usage_button.innerText = "Usage (minutes)";
    usage_button.id = vm.VM_ID;
    usage_button.onclick = (event) => {vmUsage(event)};

    var upgrade_button = document.createElement("button");
    var downgrade_button = document.createElement("button");
    actions_col.appendChild(start_button);
    actions_col.appendChild(stop_button);
    actions_col.appendChild(delete_button);
    actions_col.appendChild(usage_button);


    tr.appendChild(id_col);
    tr.appendChild(size_col);
    tr.appendChild(actions_col);
    tr.appendChild(monitor_col);
    vmTable.appendChild(tr);
  }
}

startVM = async(event) => {
  console.log("start: "+event.target.id);
  vm = vmList.find(element => element.VM_ID == event.target.id);
  body = {cc_id:vm.CC_ID, vm_id: vm.VM_ID, vm_type:vm.VM_TYPE}
  const response = await fetch(VIM_IP+"/vm/start", {
    method: 'POST',
      body: JSON.stringify(body),
      headers:{
        'Content-Type': 'application/json'
      }
    });
    const startResponse = await response.json();
    if (startResponse.success) {
      populateVMList()
    }
}

stopVM = async(event) => {
  console.log("stop: "+event.target.id);
  vm = vmList.find(element => element.VM_ID == event.target.id);
  body = {cc_id:vm.CC_ID, vm_id: vm.VM_ID, vm_type:vm.VM_TYPE}
  const response = await fetch(VIM_IP+"/vm/stop", {
    method: 'POST',
      body: JSON.stringify(body),
      headers:{
        'Content-Type': 'application/json'
      }
    });
    const stopResponse = await response.json();
    if (stopResponse.success) {
      populateVMList();
    }
}

deleteVM = async(event) => {
  console.log("delete: "+event.target.id);
  vm = vmList.find(element => element.VM_ID == event.target.id);
  body = {cc_id:vm.CC_ID, vm_id: vm.VM_ID, vm_type:vm.VM_TYPE}
  const response = await fetch(VIM_IP+"/vm/delete", {
    method: 'POST',
      body: JSON.stringify(body),
      headers:{
        'Content-Type': 'application/json'
      }
    });
    const deleteResponse = await response.json();
    if (deleteResponse.success) {
      populateVMList();
    }
}

vmUsage = async(event) => {
  vm = vmList.find(element => element.VM_ID == event.target.id);
  body = { cc_id:cc_id, vm_id:vm.VM_ID };
  const response = await fetch(VIM_IP+"/vm/usage", {
    method: 'POST',
    body: JSON.stringify(body),
    headers:{
      'Content-Type': 'application/json'
    }
  });
  const usageResponse = await response.json();
  if (!(usageResponse.error)) {
    displayUsages(usageResponse, vm.VM_ID);
  }
  else {
    alert('Error encountered: ' + usageResponse.error);
  }
}

displayUsages = async(usageResponse, id) => {
  var usageStr = "Basic: " + 
                Math.floor(usageResponse.basicUsage*100)/100 + 
                " min, Large: " + 
                Math.floor(usageResponse.largeUsage*100)/100 + 
                " min, Ultra: " + 
                Math.floor(usageResponse.ultraUsage*100)/100 + 
                " min";
  var monitorData = document.getElementById("monitor_" + id);
  monitorData.innerText = usageStr;
}

calculateCosts = async() => {
  body = { cc_id:cc_id };
  const response = await fetch(VIM_IP+"/user/charges", {
    method: 'POST',
      body: JSON.stringify(body),
      headers:{
        'Content-Type': 'application/json'
      }
    });
    const costResponse = await response.json();
    if (!(costResponse.error)) {
      displayTotalCost(costResponse);
    }
    else {
      alert('Error encountered: ' + costResponse.error);
    }
}

displayTotalCost = async(costResponse) => {
  var chargesTable = document.getElementById("charges");
  var rows = chargesTable.getElementsByTagName('tr');
  var numRows = rows.length;
  if (numRows > 1) {
    chargesTable.removeChild(rows[1]);
  }
  var headers = document.getElementById("header-charges");
  chargesTable.appendChild(headers);
  var tr = document.createElement("tr");
  var basicCol = document.createElement("td");
  basicCol.textContent = "$" + costResponse.basicCharges;
  var largeCol = document.createElement("td");
  largeCol.textContent = "$" + costResponse.largeCharges;
  var ultraCol = document.createElement("td");
  ultraCol.textContent = "$" + costResponse.ultraCharges;
  tr.appendChild(basicCol);
  tr.appendChild(largeCol);
  tr.appendChild(ultraCol);
  chargesTable.appendChild(tr);
}

var cc_id = ""
var vmList = []