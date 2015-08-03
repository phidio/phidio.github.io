var socket = io.connect('https://bart-webrtc.herokuapp.com/'),
    session, username, callingTo, duplicateMessages = [];

username = Math.random().toString(36).substring(7);
socket.emit('login', username);

socket.on('login_error', function(message){
    console.log('login_error');
});

socket.on('login_successful', function(users){
    console.log('login_successful');
});

// broadcasted by socket: online users changed
socket.on('onlineUsers', function(users, idleUsers){
    $('#amount_of_users').html(users);
    $('#amount_of_idles').html(idleUsers);
});

socket.on('messageReceived', onVideoMessageReceived);

socket.on('offline', function(name){
    if(name === callingTo){
        document.querySelector('body').classList.remove('inCall');
        if(session) session.close();
        $('.app').show();
        $('.chat').hide();
        socket.emit('makeIdle');
        callingTo = '';
    }
});

socket.on('disconnect', function(){
    console.log('somehow disconnect!!!!!');
    if(callingTo){
        document.querySelector('body').classList.remove('inCall');

        session.close();
        $('.app').show();
        $('.chat').hide();
    }
});

function call(isInitiator){
    $.ajax({
        type: "POST",
        beforeSend: function(xhr){
            if (xhr.overrideMimeType) {
                xhr.overrideMimeType("application/json");
            }
        },
        dataType: "json",
        url: "https://api.xirsys.com/getIceServers",
        data: {
            ident: "dhiraj",
            secret: "bb56af66-b4d4-4e7e-8994-98199a4e4c36",
            domain: "github.com",
            application: "sample-chat-app",
            room: "sample-chat-room",
            secure: 1
        },
        success: function (data, status) {
            startCall(data.d.iceServers[2], isInitiator);
        },
        async: false
    });
}

function startCall(data, isInitiator){
    console.log("STARTING CALLLL!!!", data, isInitiator);
    document.querySelector('body').classList.add('inCall');

    var config = {
        isInitiator: isInitiator,
        turn: {
            host: data.url,
            username: data.username,
            password: data.credential
        },
        streams: {
            audio: true,
            video: true
        }
    }
    session = new cordova.plugins.phonertc.Session(config);

    cordova.plugins.phonertc.setVideoView({
        container: document.getElementById('videoContainer'),
        local: {
            position: [0, 0],
            size: [150, 150]
        }
    });
    session.on('sendMessage', function (data) {
        socket.emit('sendMessage', callingTo, {
          type: 'phonertc_handshake',
          data: JSON.stringify(data)
        });
    });

    session.on('answer', function () {
        console.log('answered');
    });
    session.on('disconnect', function () {
        session.close();
        document.querySelector('body').classList.remove('inCall');
        socket.emit('sendMessage', callingTo, { type: 'ignore' });
        $('.app').show();
        $('.chat').hide();
    });
    session.call();
}

socket.on('gotRandomCall', function(name, isInitiator) {
    callingTo = name;

    if(isInitiator) {
        socket.emit('sendMessage', callingTo, { type: 'call' });
    }
});

socket.on('noUsersAvailable', function() {
    console.log('CURRENTLY NOBODY AVAILABLE!!!');
    document.querySelector('body').classList.remove('inCall');
    alert('nobody available');
    callingTo = '';
    $('.app').show();
    $('.chat').hide();
});

function onVideoMessageReceived(name, message){
    switch (message.type){
        case 'call':
            console.log('message received, call');
            socket.emit('makeNonIdle');
            call(false);

            setTimeout(function(){
                socket.emit('sendMessage', callingTo, { type: 'answer' });
            }, 500);

            break;
        case 'answer':
            console.log(username + ' he answered');
            socket.emit('makeNonIdle');
            call(true);
            break;
        case 'phonertc_handshake':
            if (duplicateMessages.indexOf(message.data) === -1) {
                session.receiveMessage(JSON.parse(message.data));
                duplicateMessages.push(message.data);
            }
            break;
        case 'ignore':
            socket.emit('makeIdle');
            session.close();
            $('.app').show();
            $('.chat').hide();

            break;
    }
}

$(document).ready(function(){
    $('#roulette').on('click', function() {
        $('.app').hide();
        $('.chat').show();

        if(session) {
            session.close();
        }

        if(callingTo) {
            socket.emit('makeIdle');
            callingTo = '';
        }

        socket.emit('doRandomCall');
    })
});
