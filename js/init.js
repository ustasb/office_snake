SnakeView.initialize(800, 540);

// Build and prepare the custom attribute sliders.
$(".slider").each(function () {
    var min, max, defaultValue, type = $(this).prev().attr("id");
    
    switch (type) {
    case "speed":
        min = 1;
        max = 20;
        defaultValue = 10;
        break;
    case "powerUpDuration":
        min = 1;
        max = 30;
        defaultValue = 5;
        break;
    case "startingLength":
        min = 1;
        max = 100;
        defaultValue = 6;
        break;        
    case "humansPresent":
        max = 50;
        defaultValue = 20;
        break;
    case "walls":
        max = SnakeHelpers.getMaxWalls();
        defaultValue = Math.floor(max * 0.5);
        break;
    case "bombs":
        defaultValue = 50;
        break;
    }
    
    $("#" + type).children("span").text(defaultValue);
    
    $(this).slider({
        min: min || 0,
        max: max || 100,
        value: defaultValue || 1,
        slide: function (event, ui) {
            $(this).prev().children("span").text(ui.value);
        }
    }).attr("id", type + "Slider");
});
