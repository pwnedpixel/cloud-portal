const login = async(event) => {
	console.log("click")
	username = document.getElementById("username").value;
	password = document.getElementById("password").value;
	body = {"user":username, "password": password}

	const response = await fetch("https://cloud-ass-2-vim.herokuapp.com/login", {
    method: 'POST',
    body: body, // string or object
    headers:{
      'Content-Type': 'application/json'
    }
  });
  const myJson = await response.json();
  alert(myJson);
}