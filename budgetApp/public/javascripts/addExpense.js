$("#messageBox").hide();

$("#amount").on('change', function (event) {
    this.value = parseFloat(this.value).toFixed(2);
})

$('#expenseDate').daterangepicker({
    "singleDatePicker": true,
    "locale": {
        "format": "DD/MM/YYYY",
    },
    "linkedCalendars": false,
    "opens": "left"
});

// Snippet adapted from https://codeforgeek.com/2014/09/ajax-search-box-using-node-mysql/
$(document).ready(function() {
    var categories = new Bloodhound({
        datumTokenizer: Bloodhound.tokenizers.whitespace,
        queryTokenizer: Bloodhound.tokenizers.whitespace,
        identify: function(obj) { return obj; },
        prefetch: '/autocomplete/categories?key=',
        remote: {
            wildcard: '%QUERY',
            url: '/autocomplete/categories?key=%QUERY'
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
        prefetch: '/autocomplete/shortDescs?key=',
        remote: {
            wildcard: '%QUERY',
            url: '/autocomplete/shortDescs?key=%QUERY'
        }
    });

    $('#shortDescription').typeahead(null, {
        name: 'shortDescription',
        limit: 10,
        source: shortDescs
    });
});

function addExpense() {
    $("#messageBox").hide();
    var category = $("#category").val().trim();
    var amount = $("#amount").val().trim();
    var expenseDate = $("#expenseDate").val().trim();
    var shortDesc = $("#shortDescription").val().trim();
    var longDesc = $("#longDescription").val().trim();
    var validated = true;
    if (category.length == null || category.length == 0) {
        $("#messageBox").html("Category is a required field");
        validated = false;
    } else if (amount == null || amount <= 0) {
        $("#messageBox").html("Amount must cost more than free");
        validated = false;
    } else if (expenseDate == null) {
        $("#messageBox").html("Please enter a valid date");
        validated = false;
    } else if (shortDesc.length > 255) {
        $("#messageBox").html("Your short description is not short enough");
        validated = false;
    } else if (longDesc.length > 255) {
        $("#messageBox").html("Your long description is too long");
        validated = false;
    }
    if (!validated) {
        $("#messageBox").show();
    } else {
        $.ajax({
            type: "POST",
            url: "/expenses/addExpense",
            data: $("#addExpenseForm").serialize(),
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
