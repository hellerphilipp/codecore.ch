// @ts-check
/// <reference types="jquery"/>
/// <reference types="uikit"/>


// Search by keyword
$('#searchForm').on('submit', function (e) {
    e.preventDefault();
    // @ts-ignore
    const q = $(this).find('input[name=q]').val() + '';
    // https://developer.mozilla.org/en-US/docs/Web/API/Window/find
    // @ts-ignore
    window.find(q, false, false, true);
});

// Pretty Print
// @ts-ignore
window.prettyPrint && prettyPrint();