var canvas = $('#main').get(0);
var ctx = canvas.getContext("2d");

var clearCanvas = function() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#999";
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(0,0);
    ctx.lineTo(0, canvas.height);
    ctx.lineTo(canvas.width, canvas.height);
    ctx.lineTo(canvas.width, 0);
    ctx.closePath();
    ctx.stroke();
}

var resizeCanvas = function(w, h){
    if (h == undefined){
        var feedWidth = $('#feed').width();
        var infoHeight = $('#info').height();
        canvas.width = window.innerWidth - feedWidth - 10;
        canvas.height = window.innerHeight - infoHeight - 10;
    } else {
        canvas.width = w;
        canvas.height = h;
    }
}

var startAnimation = function(){
    var requestAnimFrame = window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame    ||
            window.oRequestAnimationFrame      ||
            window.msRequestAnimationFrame     ||
            null ;

    if ( requestAnimFrame !== null ) {

        var recursiveAnim = function() {
            mainloop();
            requestAnimFrame( recursiveAnim, canvas );
        };

        // start the mainloop
        requestAnimFrame( recursiveAnim, canvas );
    } else {
        var ONE_FRAME_TIME = 1000.0 / 60.0 ;
        setInterval( mainloop, ONE_FRAME_TIME );
    }
};


var mainloop = function(){
    updateGame();
    drawGame();
}

$(document).ready(function() {
    // listen to key press
    window.addEventListener('keyup', function(event){Keys.onKeyup(event);}, false);
    window.addEventListener('keydown', function(event){Keys.onKeydown(event);}, false);

    // setup fullscreen button
    if (fullScreenApi.supportsFullScreen) {
        $('#fullscreen').click(function() {
            fullScreenApi.requestFullScreen($('body').get(0));
        });
    }

    // start the loop
    startAnimation();
    firebaseUrl = 'https://yelparena.firebaseio.com/'
    mapDataRef = new Firebase(firebaseUrl + 'map');
    map = {'x': 0, 'y': 0};
    players = [];
	bullets = [];

    mapDataRef.on('value', function(snapshot){
        map = snapshot.val();
        resizeCanvas(map.x, map.y);
        clearCanvas();

    });

	bulletsDataRef = new Firebase(firebaseUrl + 'bullets');

    $('#name-prompt button').click(function(e){
        name = $('#name-prompt input').val();
        $('#name-prompt').attr('style', 'display:none');

        playersDataRef = new Firebase(firebaseUrl + 'players');
        playersDataRef.on('child_added', function(snapshot){
            var new_player = snapshot.val();
            new_player.id = snapshot.name();
            $('#feed').append(new_player.name + ' joined<br>');
            players.push(new_player);
        });
        playersDataRef.on('child_removed', function(snapshot){
            $('#feed').append(snapshot.val().name + ' left<br>');
            // ok this is retarted but js is even more retarted
            for (var i=0; i<players.length; i++){
                if (players[i].id == snapshot.name()){
                    players.splice(i, 1);
                }
            }
        });
        playersDataRef.on('child_changed', function(snapshot){
            for (var i=0; i<players.length; i++){
                if (players[i].id == snapshot.name()){
                    players[i] = snapshot.val();
                    players[i].id = snapshot.name();
                }
            }
        });
        localPlayerDataRef = playersDataRef.push();
        localPlayerDataRef.onDisconnect().remove();
        player = new Player(name);
        localPlayerDataRef.set(player);

    });

});
