$("#messageBox").hide();

$("#amount").on('change', function (event) {
    this.value = parseFloat(this.value).toFixed(2);
})


function addGoal() {
    $("#messageBox").hide();
    var amount = $("#amount").val().trim();

    if (amount == null || amount <= 0) {
        $.notify({message: "Goal amount must be greater than $0.00"}, {type: "danger", delay: 10000});
    } else {
        $.ajax({
            type: "POST",
            url: "/goals/addGoal",
            data: $("#addGoalForm").serialize(),
        }).then(function(result) {
            if (result.status == 200) {
                window.location.href = "/goals";
                $.notify({message: result.message}, {type: "success"});
            } else {
                $.notify({message: result.message}, {type: "danger", delay: 10000});
            }
        })
    }
}