document.addEventListener('DOMContentLoaded', function () {
  // Get the email from register form
  if (window.location.pathname === "/account/register/") {
    var email = document.getElementById("gui-form-email");
    email.addEventListener("input", function (event) {
      console.log("Input value changed:", event.target.value);
      sessionStorage.setItem("email", event.target.value);
    });
  }

  // Show Verification Modal 
  if (window.location.pathname === "/services/challenge/") {  
    processIDVerification();
  }
  
  if (window.location.pathname === "/checkout/default/details/"){
    var email = document.getElementById("gui-form-details-email");
    checkIDfromServer(email.value).then((result) => {
      if(!result.exists){
        sessionStorage.setItem("email", email.value);
        processIDVerification();
      }
    });
  }
});
