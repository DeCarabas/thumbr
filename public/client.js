// client-side js
// run by the browser each time your view template is loaded

// by default, you've got jQuery,
// add other scripts at the bottom of index.html

function loadit() {
  $.get({
    url: '/dreams',
    dataType: 'json',
    success: dreams => {
      console.log('yo', dreams);
      dreams.forEach(function(dream) {
        $('<li><img src="' + dream.thumbnailUrl + '"/></li>').appendTo('ul#dreams');
      });

      $('#dream').val('');
      $('#dream').focus();
    }
  });  
}

$(function() {
  console.log('hello world :o');
  
  loadit();

  $('form').submit(function(event) {
    event.preventDefault();
    var dream = $('#dream').val();
    var referrer = $('#referrer').val();

    $.post({
      url: '/dreams?' + $.param({dream: dream, skipChecks: true, referrer: referrer}),
      dataType: 'json',
      success: result => {
        console.log(result);
        $('<li><img src="' + result.thumbnailUrl + '"/></li>').appendTo('ul#dreams');
        $('#dream').val('');
        $('#dream').focus();
      }
    });
  });

});
