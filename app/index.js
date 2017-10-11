var AdapterJS = require('adapterjs');
var phonertc = require('./phonertc');
var PhoneRTCProxy = require('./PhoneRTCProxy');
var $ = require('jquery');
var ChatView    = require('./ChatView');

var socket = io.connect('https://phidiortc.azurewebsites.net', { secure: true, transports: [ "flashsocket","polling","websocket" ] } ),
// var socket = io.connect('http://localhost:3000'),
    ChatWindow = new ChatView(socket),
    session, username, duplicateMessages = [];



// broadcasted by socket: online users changed
socket.on('onlineUsers', function(users, idleUsers) {
    $('#amount_of_users').html(users);
    $('#amount_of_idles').html(idleUsers);
});

function loginToSocket() {
    username = Math.random().toString(36).substring(7);
    socket.emit('login', username);

    socket.on('login_error', function(message){
        console.log('login_error');
    });

    socket.on('login_successful', function(users){
        console.log('login_successful');
    });

    socket.on('messageReceived', onVideoMessageReceived);

    socket.on('offline', function(name){
        if(name === socket.callingTo){
            $('body').removeClass('inCall');

            $('#help_text').html('You got rouletted. Click roulette to chat');

            if(session)
                session.close();

            $('.app').show();
            $('.chat').hide();
            socket.emit('makeIdle');
            socket.callingTo = '';
        }
    });

    socket.on('disconnect', function(){
        if(socket.callingTo){
            $('body').removeClass('inCall');

            console.log('disconnected?');

            session.close();
            $('.app').show();
            $('.chat').hide();
        }
    });

    function startCall(isInitiator){
        var data = {credential: 'root', url: 'turn:vidch.at:80?transport=tcp', username: 'user'};

        ChatWindow.reset();
        $('body').addClass('inCall');

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
        session = new phonertc.Session(config);

        phonertc.setVideoView({
            container: document.getElementById('videoContainer'),
            local: {
                position: [0, 0],
                size: [150, 150]
            }
        });
        session.on('sendMessage', function (data) {
            socket.emit('sendMessage', socket.callingTo, {
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
            $('#help_text').html('You got rouletted. Click roulette to chat');
            socket.emit('sendMessage', socket.callingTo, { type: 'ignore' });
            $('.app').show();
            $('.chat').hide();
        });
        session.call();
    }

    socket.on('gotRandomCall', function(name, isInitiator) {
        socket.callingTo = name;

        if(isInitiator) {
            socket.emit('sendMessage', socket.callingTo, { type: 'call' });
        }
    });

    socket.on('noUsersAvailable', function() {
        document.querySelector('body').classList.remove('inCall');
        updateHelpText('No users available. Try again later.');

        socket.callingTo = '';
        $('.app').show();
        $('.chat').hide();
    });

    function onVideoMessageReceived(name, message){
        switch (message.type){
            case 'call':
                console.log('message received, call');
                socket.emit('makeNonIdle');
                startCall(false);

                setTimeout(function(){
                    socket.emit('sendMessage', socket.callingTo, { type: 'answer' });
                }, 500);

                break;
            case 'answer':
                console.log(username + ' he answered');
                socket.emit('makeNonIdle');
                startCall(true);
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
}


function updateHelpText(text) {
    $('#help_text').removeClass('show');

    setTimeout(function() {
        $('#help_text').html(text);
        $('#help_text').addClass('show');
    }, 550);
}


$(document).ready(function(){
    var gotAccess = false;

    ChatWindow.initialize();

    if(window.location.href.indexOf('stats') !== -1) {
        document.querySelector('#info-box').classList.add('shown');
        document.querySelector('#upload-callstats').style.display = 'block';
        // document.querySelector('#message-btn').style.display = 'none';

      // Initialize Firebase
      var config = {
        apiKey: "AIzaSyDnzyBboDq8d-Kx3HIPhbxS-rOPtnMNguk",
        databaseURL: "https://webrtcstats-4397d.firebaseio.com",
        storageBucket: "webrtcstats-4397d.appspot.com",
      };
      firebase.initializeApp(config);
    }
    // // open channel modal
    // $('#channel_selector').on('click', function (){
    //     $('#gray-overlay').addClass('active');
    //     $('#channel-modal').addClass('active');
    // });

    // //close modal
    // $('#modal-close, #cancel-channel, #gray-overlay').on('click', function() {
    //     $('#gray-overlay').removeClass('active');
    //     $('#channel-modal').removeClass('active');
    // })

    // //submit channel
    // $('#submit-channel').on('click', function (){
    //     var channelVal = $('#selected-channel').val();

    //     if(channelVal.length > 1 && channelVal.substring(0,1) === '#') {
    //         $('#channel_selector').html(channelVal);
    //         $('#selected-channel').val('#general');
    //         $('#gray-overlay').removeClass('active');
    //         $('#channel-modal').removeClass('active');
    //     }
    // });

    // $('#channel-modal .suggestion').on('click', function(e) {
    //     $('#selected-channel').val('#' + ($(e.target).attr('data-rel')));
    // });

    // // random/private channel generator
    // $('#channel-modal #private-btn').on('click', function(e) {
    //     $('#selected-channel').val('#' + Math.random().toString(36).substring(7));
    // });


    $('#roulette').on('click', function() {
        if(gotAccess && socket.connected) {
            if(session) {
                session.close();
            }

            $('#help_text').html('Connecting..');

            if(socket.callingTo) {
                socket.emit('makeIdle');
                socket.callingTo = '';
            }

            socket.emit('doRandomCall');
        }
        else {
            $('#help_text').html('Please give Phidio access to use your camera and microphone');
            $('#roulette').addClass('loading');

            setTimeout(function() {
                $('#roulette_txt').hide();
                $('.spinner').show();

                $('#help_text').addClass('show');


                setTimeout(function() {
                    PhoneRTCProxy.getCameraAccess(function(success, errorMsg) {
                        $('#help_text').removeClass('show');

                        if(success) {
                            loginToSocket();
                            gotAccess = true;

                            setTimeout(function() {
                                $('#help_text').html('Successfully connected.');
                                $('#help_text').addClass('show');
                                $('#roulette').removeClass('loading');

                                setTimeout(function() {
                                    // var channelName = $('#channel_selector').html().substring(1);
                                    // expiremental
                                    // window.history.pushState('Object', channelName.charAt(0).toUpperCase() + channelName.slice(1), '/#' + channelName);

                                    $('.spinner').hide();
                                    $('#roulette_txt').html('ROULETTE');
                                    $('#channel').addClass('hidden');
                                    $('#roulette_txt').show();

                                    $('#roulette').addClass('chatting');
                                }, 250)
                            }, 750);
                        }
                        else {
                            var errorTxt = "";
                            switch (errorMsg.name) {
                                case 'PermissionDeniedError':
                                case 'PermissionDismissedError':
                                    errorTxt = "Access not granted. Please try again";
                                    break;
                                case 'Edge':
                                    errorTxt = "Microsoft Edge is not supported. Try Google Chrome or IE";
                                    break;
                                case 'NotSupported':
                                    if(typeof AdapterJS.WebRTCPlugin.isPluginInstalled == 'function') {
                                        AdapterJS.WebRTCPlugin.pluginNeededButNotInstalledCb();
                                        // AdapterJS.AdapterJS.renderNotificationBar(AdapterJS.AdapterJS.popupString, AdapterJS.AdapterJS.TEXT.PLUGIN.BUTTON, AdapterJS.AdapterJS.downloadLink);
                                    }
                                    errorTxt = 'Your device is not supported. ' + (!AdapterJS.WebRTCPlugin.pluginInfo.downloadLink ?  'Please download the app.' : 'Please install the plugin.');
                                    break;
                                case 'DevicesNotFoundError':
                                    errorTxt = 'No camera and/or microphone found. Try again.'
                                    break;
                                default:
                                    errorTxt = 'Unable to get access (' + errorMsg.name +')';
                                    break
                            }

                            setTimeout(function() {
                                $('#help_text').html(errorTxt);
                                $('#help_text').addClass('show');

                                $('#roulette').removeClass('loading');

                                setTimeout(function() {
                                    $('.spinner').hide();
                                    $('#roulette_txt').show();
                                }, 450)
                            }, 750);
                        }
                    });

                }, 750)
            }, 450);
        }
    })
});
