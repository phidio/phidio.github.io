var $ = require('jquery');

function ChatView(socket) {
    this.socket = socket;
    this.dialogShown = false;
    this.unreadMessages = 0;
};

ChatView.prototype.initialize = function() {
    this.msgWindowEl = $('#message-window');
    this.msgBtnEl = $('#message-btn');
    this.msgBodyEl = $('#message-body');
    this.msgHeaderEl = $('#message-header');
    this.msgSubmitEl  = $('#send-message');
    this.msgInputEl = $('#message-input');
    this.msgBadgeEl = $('#message-badge');

    this.listenToEvents();
}

ChatView.prototype.listenToEvents = function() {
    this.msgBtnEl.on('click', this.show.bind(this));
    this.msgHeaderEl.on('click', this.hide.bind(this));

    this.msgInputEl.on('keydown', function(e) {
        if(e.which === 13)
            this.sendMessage();
    }.bind(this));

    this.msgSubmitEl.on('click', this.sendMessage.bind(this));

    this.socket.on('chatMessage', function(obj) {
        this.addMessage(false, obj.message);

        if(!this.dialogShown) {
            this.unreadMessages++;
            this.showBadge();
        }
    }.bind(this))
};

ChatView.prototype.showBadge = function() {
    this.msgBadgeEl.html(this.unreadMessages);
    this.msgBadgeEl.show();
}


ChatView.prototype.hideBadge = function() {
    this.msgBadgeEl.hide();
}

ChatView.prototype.sendMessage = function() {
    var message = this.msgInputEl.val();

    if(message.length) {
        this.socket.emit('chatMessage', this.socket.callingTo, {message: message});
        this.addMessage(true, message);

        this.msgInputEl.val('');
    }
};


ChatView.prototype.getTime = function() {
    var t = new Date().toLocaleTimeString();

    t = t.replace(/\u200E/g, ''); // for IE
    t = t.replace(/^([^\d]*\d{1,2}:\d{1,2}):\d{1,2}([^\d]*)$/, '$1$2'); // remove seconds

    return t;
}

ChatView.prototype.addMessage = function(sender, message) {
    this.msgBodyEl.append('<div class="message-bubble ' + (sender ? 'send' : 'received') + '">' +
        '<div class="back">' +
            '<span class="author">'+ (sender ? 'You' : 'Stranger') + '</span>' +
            '<div class="time">' + this.getTime() + '</div>' +
            '<div class="message">' + message + '</div>' +
        '</div>' +
    '</div>'
    );

    this.msgBodyEl.scrollTop(this.msgBodyEl[0].scrollHeight);
}


ChatView.prototype.show = function() {
    // this.msgInputEl.focus();
    this.dialogShown = true;
    this.hideBadge();
    this.unreadMessages = 0;
    this.msgWindowEl.addClass('active');
};



ChatView.prototype.hide = function() {
    this.dialogShown = false;
    this.msgWindowEl.removeClass('active');
};

ChatView.prototype.reset = function() {
    this.msgBodyEl.html('');
    this.unreadMessages = 0;
}

module.exports = ChatView
