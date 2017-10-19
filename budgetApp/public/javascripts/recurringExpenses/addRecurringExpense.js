$("#messageBox").hide();

$("#amount").on('change', function (event) {
    this.value = parseFloat(this.value).toFixed(2);
})

$('#startsOnDate').daterangepicker({
    "singleDatePicker": true,
    "locale": {
        "format": "DD/MM/YYYY",
    },
    "linkedCalendars": false,
    "opens": "left"
});

$('#endsOnDate').daterangepicker({
    "singleDatePicker": true,
    "locale": {
        "format": "DD/MM/YYYY",
    },
    "linkedCalendars": false,
    "opens": "left"
});

// Snippet adapted from https://codeforgeek.com/2014/09/ajax-search-box-using-node-mysql/
$(document).ready(function() {

    $('input').iCheck({
      checkboxClass: 'icheckbox_minimal-blue',
      radioClass: 'iradio_minimal-blue',
    });

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
    var shortDesc = $("#shortDescription").val().trim();
    var longDesc = $("#longDescription").val().trim();
    var validated = true;
    if (category.length == null || category.length == 0) {
        $("#messageBox").html("Category is a required field");
        validated = false;
    } else if (amount == null || amount <= 0) {
        $("#messageBox").html("Amount must cost more than free");
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
            url: "/recurringExpenses/addRecurringExpense",
            data: $("#addExpenseForm").serialize(),
        }).then(function(result) {
            if (result.status == "success") {
                $.notify({message: result.message}, {type: "success"});
                window.location.href = "/recurringExpenses";
            } else {
                $.notify({message: result.message}, {type: "danger", delay: 10000});
            }
        });
    }
}

$('#frequency').on('change', function() {
    if ($('#frequency').val() == "days") {
        $('#repeatsOnDiv').html('')
    } else if ($('#frequency').val() == "weeks") {
        var repeatsOnHtml = '<label for="repeatsOn">Repeats On:</label>';
        repeatsOnHtml += '<select id="repeatsOn" class="form-control" name="repeatsOn">'
        repeatsOnHtml += '<option value="Sunday">Sunday</option>'
        repeatsOnHtml += '<option value="Monday">Monday</option>'
        repeatsOnHtml += '<option value="Tuesday">Tuesday</option>'
        repeatsOnHtml += '<option value="Wednesday">Wednesday</option>'
        repeatsOnHtml += '<option value="Thursday">Thursday</option>'
        repeatsOnHtml += '<option value="Friday">Friday</option>'
        repeatsOnHtml += '<option value="Saturday">Saturday</option>'
        repeatsOnHtml += '</select>'
        $('#repeatsOnDiv').html(repeatsOnHtml)
    } else if ($('#frequency').val() == "months") {
        $('#repeatsOnDiv').html('')
    }
})
