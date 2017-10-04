function editSettings() {
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
         //       window.location.href = "/";
            },
            error: function (result) {
          //     $("#messageBox").html(result.responseJSON.errorMsg);
          //     $("#messageBox").show();
            }
        });
}