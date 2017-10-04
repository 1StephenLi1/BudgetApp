$("#messageBox").hide();

function editSettings() {
  $("#messageBox").hide();
  var password = $("#password").val();
  var confirmPassword = $("#confirmPassword").val();
  var validated = true;
  
  if (password != confirmPassword) {
      $("#messageBox").html("Passwords Do Not Match!");
       validated = false;
    }

    if (!validated) {
        $("#messageBox").show();
    } else {
        $.ajax({
            type: "POST",
            url: "/settings",
            data: $("#editSettingsForm").serialize(),
            success: function(result) {
                /*
                $("#messageBox").html(result.msg);
                $("#messageBox").show();
                */
                console.log("Success");
                window.location.href = "/";
            },
            error: function (result) {
              $("#messageBox").html(result.responseJSON.errorMsg);
              $("#messageBox").show();
            }
        });
    }
}