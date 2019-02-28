login = async() => {
	username = document.getElementById("username").value;
	password = document.getElementById("password").value;
	body = {user:username,password:password}

	const response = await fetch("https://cloud-ass-2-vim.herokuapp.com/user/login", {
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
  } else [
	  alert("Invalid username/password")
  ]
}