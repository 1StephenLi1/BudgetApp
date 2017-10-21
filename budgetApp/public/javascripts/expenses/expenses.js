var expensesDT;

$(document).ready(function() {
    var start = moment().subtract(1, 'months');
    var end = moment();

    function cb(start, end) {
        $('#dateRangePicker span').html(start.format('DD/MM/YYYY') + ' - ' + end.format('DD/MM/YYYY'));
    }

    $('#dateRangePicker').daterangepicker({ 
        locale: {
            format: 'DD/MM/YYYY'
        },
        startDate: start,
        endDate: end,
        ranges: {
            'Today': [moment(), moment()],
            'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
            'Last 7 Days': [moment().subtract(6, 'days'), moment()],
            'Last 30 Days': [moment().subtract(29, 'days'), moment()],
            'This Month': [moment().startOf('month'), moment().endOf('month')],
            'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
        },
        showWeekNumbers: true,
        alwaysShowCalendars: true,
        opens: "left"
    }, cb);

    cb(start, end);

    expensesDT =  $('#expenses-tbl').DataTable({
        processing: true,
        serverSide: true,
        paging: true,
        autoWidth: true,
        pageLength: 50,
        info: true,
        pagingType: "full_numbers",
        language: {
            lengthMenu: "Display _MENU_ expenses per page",
            zeroRecords: "No expenses found",
            info: "Showing _START_ to _END_ of _TOTAL_ expenses",
            infoEmpty: "No expenses available",
            infoFiltered: "(filtered from _MAX_ total expenses)",
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
            { name: "dateTime", targets: 0},
            { name: "shortDescription", targets: 1},
            { name: "longDescription", targets: 2},
            { name: "Category.name", targets: 3},
            { name: "amount", className: "text-right", targets: 4},
            { orderable: false, targets: 5}
        ],
        order: [0, "DESC"],
        ajax: {
            type: "POST",
            url: "/expenses/datatable",
            data: function (d) {
                if ($('#category-select').val() != null && $('#category-select').val().length > 0) {
                    d.categories = JSON.stringify($('#category-select').val());
                }
                d.startDate = $('#dateRangePicker').data('daterangepicker').startDate.toISOString();
                d.endDate = $('#dateRangePicker').data('daterangepicker').endDate.toISOString();
            }
        },
        columns:[
            {
                data: function(expense) {
                    if (expense.dateTime == null) {
                        return "";
                    } else {
                        return moment(expense.dateTime).format('DD/MM/YY LTS');
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
                    '<a href="/expenses/editExpense?id=' + expense.id + '" class="btn btn-default btn-xs" data-toggle="tooltip" data-placement="top" title="Edit Expense"><span class="glyphicon glyphicon-edit"></span>Edit</a>' +
                    '<button type="button" id="remove-expense-btn" class="btn btn-default btn-xs" data-toggle="tooltip" data-placement="top" title="Delete Expense" onClick="deleteExpense('+expense.id+');"><span class="glyphicon glyphicon-trash"></span>Delete</button>' +
                    '</div>';
                    return buttons
                }
            },
        ]
    });
});


$('#dateRangePicker').on('apply.daterangepicker', function(ev, picker) {
    expensesDT.ajax.reload();
});

$("#expense-filters-form").change(function(){
    expensesDT.ajax.reload();
});

function deleteExpense(id) {
    $.ajax({
        url: '/expenses/' + id,
        method: 'DELETE'
    }).then(function(result) {
        if (result.status == "success") {
            expensesDT.ajax.reload();
        }
    })
}
