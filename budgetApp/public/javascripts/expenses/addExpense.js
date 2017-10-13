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

$('#startsOn').daterangepicker({
    "singleDatePicker": true,
    "locale": {
        "format": "DD/MM/YYYY",
    },
    "linkedCalendars": false,
    "opens": "left"
});

$('#endsOn').daterangepicker({
    "singleDatePicker": true,
    "locale": {
        "format": "DD/MM/YYYY",
    },
    "linkedCalendars": false,
    "opens": "left"
});

// Snippet adapted from https://codeforgeek.com/2014/09/ajax-search-box-using-node-mysql/
$(document).ready(function() {
    // Used In recurring expenses
    // $('#recurringDiv').hide();
    //
    // $('input').iCheck({
    //   checkboxClass: 'icheckbox_minimal-blue',
    //   radioClass: 'iradio_minimal-blue',
    // });

    var categories = new Bloodhound({
        datumTokenizer: Bloodhound.tokenizers.whitespace,
        queryTokenizer: Bloodhound.tokenizers.whitespace,
        identify: function(obj) { return obj; },
        prefetch: '/autocomplete/categories?type=expense&key=',
        remote: {
            wildcard: '%QUERY',
            url: '/autocomplete/categories?type=expense&key=%QUERY'
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
        prefetch: '/autocomplete/shortDescs?type=expense&key=',
        remote: {
            wildcard: '%QUERY',
            url: '/autocomplete/shortDescs?type=expense&key=%QUERY'
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
    var expenseDate = $("#expenseDate").val();
    var shortDesc = $("#shortDescription").val().trim();
    var longDesc = $("#longDescription").val().trim();
    var validated = true;
    var msg = "";

    if (category == null || category.length == 0) {
        msg = "Category is a required field";
        // $("#messageBox").html("Category is a required field");
        validated = false;
    } else if (amount == null || amount <= 0) {
        msg = "Expense amount must be greater than $0.00";
        // $("#messageBox").html("Amount must cost more than free");
        validated = false;
    } else if (expenseDate == null) {
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
            url: "/expenses/addExpense",
            data: $("#addExpenseForm").serialize(),
        }).then(function(result) {
            if (result.status == "success") {
                $.notify({message: result.message}, {type: "success"});
                window.location.href = "/expenses";
            } else {
                $.notify({message: result.message}, {type: "danger", delay: 10000});
            }
        })
    }
}

// These are for recurring expenses --- disregard for now
// $('#isRecurring').on('ifChecked', function(event){
//     $('#recurringDiv').show(300);
// });
//
// $('#isRecurring').on('ifUnchecked', function(event){
//     $('#recurringDiv').hide(300);
// });
//
// $('#frequency').on('change', function() {
//     if ($('#frequency').val() == "daily") {
//         $('#interval').css('width','80%');
//         $('#intervalType').html('<strong>&nbsp;Days</strong>')
//         $('#repeatsOnDiv').html('')
//     } else if ($('#frequency').val() == "weekly") {
//         $('#interval').css('width','75%');
//         $('#intervalType').html('<strong>&nbsp;Weeks</strong>')
//         var repeatsOnHtml = '<label for="repeatsOn">Repeats On:</label>';
//         repeatsOnHtml += '<select id="repeatsOn" class="form-control" name="repeatsOn">'
//         repeatsOnHtml += '<option value="sunday">Sunday</option>'
//         repeatsOnHtml += '<option value="monday">Monday</option>'
//         repeatsOnHtml += '<option value="tuesday">Tuesday</option>'
//         repeatsOnHtml += '<option value="wednesday">Wednesday</option>'
//         repeatsOnHtml += '<option value="thursday">Thursday</option>'
//         repeatsOnHtml += '<option value="friday">Friday</option>'
//         repeatsOnHtml += '<option value="saturday">Saturday</option>'
//         repeatsOnHtml += '</select>'
//         $('#repeatsOnDiv').html(repeatsOnHtml)
//     } else if ($('#frequency').val() == "monthly") {
//         $('#interval').css('width','75%');
//         $('#intervalType').html('<strong>&nbsp;Months</strong>')
//         $('#repeatsOnDiv').html('')
//     } else if ($('#frequency').val() == "annually") {
//         $('#interval').css('width','80%');
//         $('#intervalType').html('<strong>&nbsp;Years</strong>')
//         $('#repeatsOnDiv').html('')
//     }
// })
