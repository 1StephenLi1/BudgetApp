$("#amount").on('change', function (event) {
    this.value = parseFloat(this.value).toFixed(2);
})

$('#incomeDate').daterangepicker({
    "singleDatePicker": true,
    "locale": {
        "format": "DD/MM/YYYY",
    },
    "linkedCalendars": false,
    "opens": "left"
});

function addIncome() {
    /// BUild this function and test
    $.ajax({
        type: "POST",
        url: "/incomes/addIncome",
        data: $("#addIncomeForm").serialize(),
        success: function(result) {
            console.log(result)
            var html = "<div class='alert alert-success alert-dismissable'>";
            html += '<a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a>';
            html += result.msg + '</div>'
            $('#incomeMsg').html(html);
            window.location.replace("/incomes");
        },
        error: function (result) {
            var errHtml = "<div class='alert alert-danger alert-dismissable'>";
            errHtml += '<a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a>';
            errHtml += result.responseJSON.errorMsg + '</div>'
            $('#incomeMsg').html(errHtml);
        }
    });
}
