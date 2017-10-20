var expensesDT;

$(document).ready(function() {
    // var start = moment().subtract(1, 'months');
    // var end = moment();
    //
    // function cb(start, end) {
    //     $('#dateRangePicker span').html(start.format('DD/MM/YYYY') + ' - ' + end.format('DD/MM/YYYY'));
    // }
    //
    // $('#dateRangePicker').daterangepicker({
    //     locale: {
    //         format: 'DD/MM/YYYY'
    //     },
    //     startDate: start,
    //     endDate: end,
    //     ranges: {
    //         'Today': [moment(), moment()],
    //         'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
    //         'Last 7 Days': [moment().subtract(6, 'days'), moment()],
    //         'Last 30 Days': [moment().subtract(29, 'days'), moment()],
    //         'This Month': [moment().startOf('month'), moment().endOf('month')],
    //         'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
    //     },
    //     showWeekNumbers: true,
    //     alwaysShowCalendars: true,
    //     opens: "left"
    // }, cb);
    //
    // cb(start, end);

    expensesDT =  $('#expenses-tbl').DataTable({
        processing: true,
        serverSide: true,
        paging: true,
        autoWidth: true,
        pageLength: 50,
        info: true,
        pagingType: "full_numbers",
        language: {
            lengthMenu: "Display _MENU_ recurring expenses per page",
            zeroRecords: "No recurring expenses found",
            info: "Showing _START_ to _END_ of _TOTAL_ recurring expenses",
            infoEmpty: "No recurring expenses available",
            infoFiltered: "(filtered from _MAX_ total recurring expenses)",
            paginate: {
                first: '<i class="fa fa-angle-double-left" aria-hidden="true"></i>',
                previous: '<i class="fa fa-angle-left" aria-hidden="true"></i>',
                next: '<i class="fa fa-angle-right" aria-hidden="true"></i>',
                last: '<i class="fa fa-angle-double-right" aria-hidden="true"></i>'
            }
        },
        dom: "<'row'<'col-md-6'B><'col-md-6'f>>rt<'row'<'col-md-6'i><'col-md-6'p>>",
        lengthMenu: [ [10, 25, 50, 100], [10, 25, 50, 100] ],
        buttons: [
            "pageLength",
        ],
        columnDefs: [

            { name: "startDate", targets: 0},
            { name: "endDate", targets: 1},
            { name: "shortDescription", targets: 2},
            { name: "longDescription", targets: 3},
            { name: "interval", targets: 4},
            { name: "frequency", targets: 5},
            { name: "Category.name", targets: 6},
            { name: "amount", className: "text-right", targets: 7},
            { orderable: false, targets: 8}
        ],
        order: [0, "DESC"],
        ajax: {
            type: "POST",
            url: "/recurringExpenses/datatable",
            data: function (d) {
                if ($('#category-select').val() != null && $('#category-select').val().length > 0) {
                    d.categories = JSON.stringify($('#category-select').val());
                }
                // d.startDate = $('#dateRangePicker').data('daterangepicker').startDate.toISOString();
                // d.endDate = $('#dateRangePicker').data('daterangepicker').endDate.toISOString();
            }
        },
        columns:[
            {
                data: function(expense) {
                    if (expense.startDate == null) {
                        return "";
                    } else {
                        return moment(expense.startDate).format('DD/MM/YY');
                    }
                }
            }, {
                data: function(expense) {
                    if (expense.endDate == null) {
                        return "Until Specified";
                    } else {
                        return moment(expense.endDate).format('DD/MM/YY');
                    }
                }
            }, {
                data: function(expense) {
                    if (expense.shortDescription == null) {
                        return "";
                    } else {
                        return expense.shortDescription;
                    }
                }
            }, {
                data: function(expense) {
                    if (expense.longDescription == null) {
                        return "";
                    } else {
                        return expense.longDescription;
                    }
                }
            }, {
                data: function(expense) {
                    if (expense.interval == null) {
                        return 0;
                    } else {
                        return expense.interval;
                    }
                }
            }, {
                data: function(expense) {
                    if (expense.frequency == null) {
                        return 0;
                    } else {
                        return expense.frequency;
                    }
                }
            }, {
                data: function(expense) {
                    if (expense.CategoryId == null) {
                        return "No Category";
                    } else {
                        return expense.Category.name;
                    }
                }
            }, {
                data: function(expense) {
                    if (expense.amount == null) {
                        return "$0.00";
                    } else {
                        return "$" + roundToTwo(expense.amount);
                    }
                }
            }, {
                data: function(expense) {
                    var buttons = '<div id="'+expense.id+'-btns" class="btn-group btn-group-xs pull-right">' +
                    '<a href="/recurringExpenses/editRecurringExpense?id=' + expense.id + '" class="btn btn-default btn-xs" data-toggle="tooltip" data-placement="top" title="Edit Expense"><span class="glyphicon glyphicon-edit"></span>Edit</a>' +
                    '<button type="button" id="remove-expense-btn" class="btn btn-default btn-xs" data-toggle="tooltip" data-placement="top" title="Delete Expense" onClick="deleteExpense('+expense.id+');"><span class="glyphicon glyphicon-remove"></span>Delete</button>' +
                    '</div>';
                    return buttons
                }
            },
        ]
    });
});

// $('#dateRangePicker').on('apply.daterangepicker', function(ev, picker) {
//     expensesDT.ajax.reload();
// });

$("#expense-filters-form").change(function(){
    expensesDT.ajax.reload();
});

function deleteExpense(id) {
    $.ajax({
        url: '/recurringExpenses/' + id,
        method: 'DELETE'
    }).then(function(result) {
        if (result.status == "success") {
            expensesDT.ajax.reload();
        }
    })
}
