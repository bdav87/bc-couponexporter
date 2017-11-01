var button = $('#Generate');

button.click(function(){
    $.get('/generate', function(data){
        console.log(data);
        $('#couponOutput').append('CSV generated');
    })
})

var couponForm = $('#getCouponForm');

couponForm.submit(function(e){
    e.preventDefault();
    var couponID = $('#couponID').val();
    $.post('/query', {id: couponID}, function(data){
        $('#couponOutput').append(data);
    });
});

var clear = $('#Clear');
clear.click(function(){
    $('#couponOutput').text('');
})