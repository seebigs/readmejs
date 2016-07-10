
$(function () {

    $('.readmejs-nav-dir-name').on('click', function () {
        $(this).siblings('.readmejs-nav-dir-contents').toggle();
    });

    $('.readmejs-nav-file-name').on('click', function () {
        var moduleNum = this.getAttribute('data-nav-id');
        window.location = '#' + moduleNum;
    });

    $('.readmejs-nav-hide').on('click', function () {
        $('.readmejs-nav').hide();
        $('.readmejs-nav-hidden').show();
    });

    $('.readmejs-nav-hidden').on('click', function () {
        $('.readmejs-nav-hidden').hide();
        $('.readmejs-nav').show();
    });

});
