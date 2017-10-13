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

$(document).ready(function() {
    var categories = new Bloodhound({
        datumTokenizer: Bloodhound.tokenizers.whitespace,
        queryTokenizer: Bloodhound.tokenizers.whitespace,
        identify: function(obj) { return obj; },
        prefetch: '/autocomplete/categories?type=income&key=',
        remote: {
            wildcard: '%QUERY',
            url: '/autocomplete/categories?type=income&key=%QUERY'
        }
    });

    $('#category').typeahead(null, {
        name: 'category',
        limit: 10,
        source: categories
    });

    var shortDescs = new Bloodhound({
        datumTokenizer: Bloodhound.tokenizers.whitespace,
        queryTokenizer: Bloodhound.tokenizers.whitespace,
        identify: function(obj) { return obj; },
        prefetch: '/autocomplete/shortDescs?type=income&key=',
        remote: {
            wildcard: '%QUERY',
            url: '/autocomplete/shortDescs?type=income&key=%QUERY'
        }
    });

    $('#shortDescription').typeahead(null, {
        name: 'shortDescription',
        limit: 10,
        source: shortDescs
    });
});

function addIncome() {
    $("#messageBox").hide();
    var category = $("#category").val().trim();
    var amount = $("#amount").val().trim();
    var incomeDate = $("#incomeDate").val();
    var shortDesc = $("#shortDescription").val().trim();
    var longDesc = $("#longDescription").val().trim();
    var validated = true;
    var msg = "";

    if (category == null || category.length == 0) {
        msg = "Category is a required field";
        // $("#messageBox").html("Category is a required field");
        validated = false;
    } else if (amount == null || amount <= 0) {
        msg = "Income amount must be greater than $0.00";
        // $("#messageBox").html("Amount must cost more than free");
        validated = false;
    } else if (incomeDate == null) {
        msg = "Please enter a valid date";
        // $("#messageBox").html("Please enter a valid date");
        validated = false;
    } else if (shortDesc.length > 100) {
        msg = "Your short description is not short enough";
        // $("#messageBox").html("Your short description is not short enough");
        validated = false;
    }

    if (!validated) {
        $.notify({message: msg}, {type: "danger", delay: 10000});
    } else {
        $.ajax({
            type: "POST",
            url: "/incomes/addIncome",
            data: $("#addIncomeForm").serialize(),
        }).then(function(result) {
            if (result.status == "success") {
                $.notify({message: result.message}, {type: "success"});
                window.location.href = "/incomes";
            } else {
                $.notify({message: result.message}, {type: "danger", delay: 10000});
            }
        })
    }
}
// 
// function addIncome() {
//     /// BUild this function and test
//     $.ajax({
//         type: "POST",
//         url: "/incomes/addIncome",
//         data: $("#addIncomeForm").serialize(),
//         success: function(result) {
//             console.log(result)
//             var html = "<div class='alert alert-success alert-dismissable'>";
//             html += '<a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a>';
//             html += result.msg + '</div>'
//             $('#incomeMsg').html(html);
//             window.location.replace("/incomes");
//         },
//         error: function (result) {
//             var errHtml = "<div class='alert alert-danger alert-dismissable'>";
//             errHtml += '<a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a>';
//             errHtml += result.responseJSON.errorMsg + '</div>'
//             $('#incomeMsg').html(errHtml);
//         }
//     });
// }
