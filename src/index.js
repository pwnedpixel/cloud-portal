login = async() => {
	username = document.getElementById("username").value;
	password = document.getElementById("password").value;
	body = {user:username,password:password}

	const response = await fetch("/user/login", {
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
	const response = await fetch("/vm/create", {
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
  const response = await fetch("/vm/"+cc_id);
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
    // Upgrade button
    var upgrade_button = document.createElement("button");
    upgrade_button.innerText = "Upgrade";
    upgrade_button.id = vm.VM_ID;
    upgrade_button.onclick = (event) => {upgradeVM(event)};
    if (vm.VM_TYPE == "ULTRA" || vm.VM_STATE == "STOP") {
      upgrade_button.disabled = true;
    }
    // Downgrade button
    var downgrade_button = document.createElement("button");
    downgrade_button.innerText = "Downgrade";
    downgrade_button.id = vm.VM_ID;
    downgrade_button.onclick = (event) => {downgradeVM(event)};
    if (vm.VM_TYPE == "BASIC" || vm.VM_STATE == "STOP") {
      downgrade_button.disabled = true;
    }
    // Usage button
    var usage_button = document.createElement("button");
    usage_button.innerText = "Usage (minutes)";
    usage_button.id = vm.VM_ID;
    usage_button.onclick = (event) => {vmUsage(event)};

    actions_col.appendChild(start_button);
    actions_col.appendChild(stop_button);
    actions_col.appendChild(delete_button);
    actions_col.appendChild(upgrade_button);
    actions_col.appendChild(downgrade_button);
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
  const response = await fetch("/vm/start", {
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
  const response = await fetch("/vm/stop", {
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
  const response = await fetch("/vm/delete", {
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

upgradeVM = async(event) => {
  console.log("upgrade: "+event.target.id);
  vm = vmList.find(element => element.VM_ID == event.target.id);
  switch (vm.VM_TYPE) {
    case "BASIC":
      vm.VM_TYPE = "LARGE"
      break;
    case "LARGE":
      vm.VM_TYPE = "ULTRA"
      break;
    default:
      return;
  }
  body = {cc_id:vm.CC_ID, vm_id: vm.VM_ID, vm_type:vm.VM_TYPE}
  const response = await fetch("/vm/upgrade", {
    method: 'POST',
      body: JSON.stringify(body),
      headers:{
        'Content-Type': 'application/json'
      }
    });
    const upgradeResponse = await response.json();
    if (upgradeResponse.success) {
      populateVMList();
    }
}

downgradeVM = async(event) => {
  console.log("downgrade: "+event.target.id);
  vm = vmList.find(element => element.VM_ID == event.target.id);
  console.log(vm.VM_TYPE)
  switch (vm.VM_TYPE) {
    case "LARGE":
      vm.VM_TYPE = "BASIC"
      break;
    case "ULTRA":
      vm.VM_TYPE = "LARGE"
      break;
    default:
      return;
  }

  body = {cc_id:vm.CC_ID, vm_id: vm.VM_ID, vm_type:vm.VM_TYPE}
  const response = await fetch("/vm/downgrade", {
    method: 'POST',
      body: JSON.stringify(body),
      headers:{
        'Content-Type': 'application/json'
      }
    });
    const downgradeResponse = await response.json();
    if (downgradeResponse.success) {
      populateVMList();
    }
}

vmUsage = async(event) => {
  vm = vmList.find(element => element.VM_ID == event.target.id);
  body = { 
    cc_id:cc_id, 
    vm_id:vm.VM_ID,
    start: document.getElementById("start-date").value + " " + document.getElementById("start-time").value, 
    end: document.getElementById("end-date").value + " " + document.getElementById("end-time").value
  };
  const response = await fetch("/vm/usage", {
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
  body = { 
    cc_id: cc_id, 
    start: document.getElementById("start-date").value + " " + document.getElementById("start-time").value, 
    end: document.getElementById("end-date").value + " " + document.getElementById("end-time").value
  };
  const response = await fetch("/user/charges", {
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
  // Refresh calculations row.
  if (numRows > 1) {
    chargesTable.removeChild(rows[1]);
  }
  var headers = document.getElementById("header-charges");
  chargesTable.appendChild(headers);
  var tr = document.createElement("tr");
  // Format with $ because monies.
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