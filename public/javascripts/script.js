var button = $('#Generate');
button.click(function(){
    $.get('/generate', function(data){
        console.log(data);
    })
})