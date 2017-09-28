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
    /// BUild this function and test
    $.ajax({
        type: "POST",
        url: "/expenses/addExpense",
        data: $("#addExpenseForm").serialize(),
        success: function(result) {
            console.log(result)
            var html = "<div class='alert alert-success alert-dismissable'>";
            html += '<a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a>';
            html += result.msg + '</div>'
            $('#expenseMsg').html(html);
            window.location.replace("/expenses");
        },
        error: function (result) {
            var errHtml = "<div class='alert alert-danger alert-dismissable'>";
            errHtml += '<a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a>';
            errHtml += result.responseJSON.errorMsg + '</div>'
            $('#expenseMsg').html(errHtml);
        }
    });
}
