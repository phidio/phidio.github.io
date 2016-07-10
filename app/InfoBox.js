var $ = require('jquery');
var InfoBox = function() {
    // console.log('nu')
}

InfoBox.prototype.updateInfo = function() {
    this.oldCallData = this.callData || {};
    this.callData = this.getNecessaryData(window.callInfo[window.callInfo.length-1]);

    var value = '<pre id="info-box-stats" style="line-height: initial">' +
        'Call time:  ' + this.getSeconds() + '\n' +
        'RTT:        ' + this.getRTT() +'\n'+
        'Audio Tx:   '+ this.callData.sentAudio.googCodecName+', ' + this.computeBitrate(this.oldCallData.sentAudio, this.callData.sentAudio, 'sent') + ', ' + this.computePackets(this.oldCallData.sentAudio, this.callData.sentAudio, 'sent') + '\n'+
        'Audio Rx:   '+ this.callData.recvAudio.googCodecName+', ' + this.computeBitrate(this.oldCallData.recvAudio, this.callData.recvAudio, 'recv') + ', ' + this.computePackets(this.oldCallData.recvAudio, this.callData.recvAudio, 'recv') + '\n'+
        'Video Tx:   '+ this.callData.sentVideo.googCodecName+', ' + this.callData.sentVideo.googFrameHeightSent + 'p' + this.callData.sentVideo.googFrameRateSent + ', ' + this.computeBitrate(this.oldCallData.sentVideo, this.callData.sentVideo, 'sent') + ', ' + this.computePackets(this.oldCallData.sentVideo, this.callData.sentVideo, 'sent') + '\n'+
        'Video Rx:   '+ this.callData.recvVideo.googCodecName+', ' + this.callData.recvVideo.googFrameHeightReceived + 'p' + this.callData.recvVideo.googFrameRateReceived + ', ' + this.computeBitrate(this.oldCallData.recvVideo, this.callData.recvVideo, 'recv') + ', ' + this.computePackets(this.oldCallData.recvVideo, this.callData.recvVideo, 'recv') + '\n'+
        'Loss Tx:    '+this.getPacketLoss(this.oldCallData, this.callData)+'\n'+
        '\n' +
        'Limitations:\n' +
        'CPU limited:   '+this.callData.sentVideo.googCpuLimitedResolution+'\n'+
        'BW limited:    '+this.callData.sentVideo.googBandwidthLimitedResolution+'\n'+
        'View limited:  '+this.callData.sentVideo.googViewLimitedResolution+'\n'+
    '</pre>';

    document.querySelector('#info-box').innerHTML = value;
}

InfoBox.prototype.getPacketLoss = function (oldVal, newVal) {
    var loss, result = [];

    loss = 0;

    if(oldVal && newVal['recvAudio'] && newVal['recvVideo'] && newVal['recvAudio'].packetsReceived && newVal['recvVideo'].packetsReceived &&
        oldVal['recvAudio'] && oldVal['recvVideo'] && oldVal['recvAudio'].packetsReceived && oldVal['recvVideo'].packetsReceived) {

        loss = ((((newVal['recvAudio'].packetsLost-oldVal['recvAudio'].packetsLost) + (newVal['recvVideo'].packetsLost-oldVal['recvVideo'].packetsLost)) /
            (((newVal['recvAudio'].packetsReceived-oldVal['recvAudio'].packetsReceived) + (newVal['recvVideo'].packetsReceived-oldVal['recvVideo'].packetsReceived)) +
            ((newVal['recvAudio'].packetsLost-oldVal['recvAudio'].packetsLost) + (newVal['recvVideo'].packetsLost-oldVal['recvVideo'].packetsLost)))) * 100).toFixed(2);

    }
    if(isNaN(loss))
        loss = 0;
    // console.log(isNaN(loss))

    return loss +'%';
}
InfoBox.prototype.computeBitrate = function (oldRate, newRate, type) {
    var bytesVal = 'bytesReceived';
    if(type === 'sent') {
        bytesVal = 'bytesSent';
    }

    var bandwidth = 0;

    if(oldRate && newRate && oldRate[bytesVal] && newRate[bytesVal]) {
        bandwidth = newRate[bytesVal] - oldRate[bytesVal];
    }
    else if(newRate && newRate[bytesVal]) {
        bandwidth = newRate[bytesVal];
    }

    if(oldRate && oldRate.timestamp) {
        bandwidth = bandwidth/((new Date(newRate.timestamp).getTime()-new Date(oldRate.timestamp).getTime()) / 1000);
    }

    // bytes to kilobits
    bandwidth = (8*bandwidth/1000).toFixed(2);


    return parseFloat(bandwidth) + ' kbps';
}

InfoBox.prototype.computePackets = function (oldVal, newVal, type) {
    var packetsVal = 'packetsReceived';
    if(type === 'sent') {
        packetsVal = 'packetsSent';
    }

    var pps = 0;

    if(oldVal && newVal && oldVal[packetsVal] && newVal[packetsVal]) {
        pps = newVal[packetsVal] - oldVal[packetsVal];
    }
    else if(newVal && newVal[packetsVal]) {
        pps = newVal[packetsVal];
    }

    if(oldVal && oldVal.timestamp) {
        pps = pps/((new Date(newVal.timestamp).getTime()-new Date(oldVal.timestamp).getTime()) / 1000);
    }

    return parseFloat(pps).toFixed(1) + ' pps';
}

InfoBox.prototype.getNecessaryData = function (res) {
    var result = {};
    result.sentAudio = {};
    result.sentVideo = {};
    result.recvVideo = {};
    result.recvAudio = {};

    if(res.audio && res.audio.availableBandwidth)
        result.availableAudioBandwidth = res.audio.availableBandwidth;

    if(res.resolutions)
        result.resolutions = res.resolutions;

    if(res.video)
        result.video = res.video;

    for(var r = 0; r < res.results.length; r++) {
        switch (res.results[r].type) {
            case 'ssrc':
                //distinct between 4 different types
                if(res.results[r].mediaType === 'audio' && res.results[r].id.indexOf('send') !== -1) {
                    //sent audio
                    result.sentAudio = {};
                    result.sentAudio.googCodecName = res.results[r].googCodecName;
                    result.sentAudio.audioInputLevel = res.results[r].audioInputLevel;
                    result.sentAudio.bytesSent = res.results[r].bytesSent;
                    result.sentAudio.googJitterReceived = res.results[r].googJitterReceived;
                    result.sentAudio.googRtt = res.results[r].googRtt;
                    result.sentAudio.packetsLost = res.results[r].packetsLost;
                    result.sentAudio.packetsSent = res.results[r].packetsSent;
                    result.sentAudio.timestamp = res.results[r].timestamp;
                }
                else if(res.results[r].mediaType === 'video' && res.results[r].id.indexOf('send') !== -1) {
                    result.sentVideo = {};
                    result.sentVideo.googCodecName = res.results[r].googCodecName;
                    result.sentVideo.bytesSent = res.results[r].bytesSent;
                    result.sentVideo.googAdaptationChanges = res.results[r].googAdaptationChanges;
                    result.sentVideo.googBandwidthLimitedResolution = res.results[r].googBandwidthLimitedResolution;
                    result.sentVideo.googViewLimitedResolution = res.results[r].googViewLimitedResolution;
                    result.sentVideo.googCpuLimitedResolution = res.results[r].googCpuLimitedResolution;
                    result.sentVideo.googAvgEncodeMs = res.results[r].googAvgEncodeMs;
                    result.sentVideo.googEncodeUsagePercent = res.results[r].googEncodeUsagePercent;
                    result.sentVideo.googFrameHeightInput = res.results[r].googFrameHeightInput;
                    result.sentVideo.googFrameHeightSent = res.results[r].googFrameHeightSent;
                    result.sentVideo.googFrameRateInput = res.results[r].googFrameRateInput;
                    result.sentVideo.googFrameRateSent = res.results[r].googFrameRateSent;
                    result.sentVideo.googFrameWidthInput = res.results[r].googFrameWidthInput;
                    result.sentVideo.googFrameWidthSent = res.results[r].googFrameWidthSent;
                    result.sentVideo.googNacksReceived = res.results[r].googNacksReceived;
                    result.sentVideo.googPlisReceived = res.results[r].googPlisReceived;
                    result.sentVideo.googRtt = res.results[r].googRtt;
                    result.sentVideo.packetsLost = res.results[r].packetsLost;
                    result.sentVideo.packetsSent = res.results[r].packetsSent;
                    result.sentVideo.timestamp = res.results[r].timestamp;
                }
                else if(res.results[r].mediaType === 'audio' && res.results[r].id.indexOf('recv') !== -1) {
                    result.recvAudio = {};
                    result.recvAudio.audioOutputLevel = res.results[r].audioOutputLevel;
                    result.recvAudio.googCodecName = res.results[r].googCodecName;
                    result.recvAudio.bytesReceived = res.results[r].bytesReceived;
                    result.recvAudio.googCurrentDelayMs = res.results[r].googCurrentDelayMs;
                    result.recvAudio.packetsLost = res.results[r].packetsLost;
                    result.recvAudio.packetsReceived = res.results[r].packetsReceived;
                    result.recvAudio.timestamp = res.results[r].timestamp;
                }
                else if(res.results[r].mediaType === 'video' && res.results[r].id.indexOf('recv') !== -1) {
                    result.recvVideo = {};
                    result.recvVideo.googCodecName = res.results[r].googCodecName;
                    result.recvVideo.bytesReceived = res.results[r].bytesReceived;
                    result.recvVideo.googCurrentDelayMs = res.results[r].googCurrentDelayMs;
                    result.recvVideo.googDecodeMs = res.results[r].googDecodeMs;
                    result.recvVideo.googFrameRateReceived = res.results[r].googFrameRateReceived;
                    result.recvVideo.googFrameHeightReceived = res.results[r].googFrameHeightReceived;
                    result.recvVideo.googFrameWidthReceived = res.results[r].googFrameWidthReceived;
                    result.recvVideo.googFrameRateOutput = res.results[r].googFrameRateOutput;
                    result.recvVideo.googNacksSent = res.results[r].googNacksSent;
                    result.recvVideo.googPlisSent = res.results[r].googPlisSent;
                    result.recvVideo.packetsLost = res.results[r].packetsLost;
                    result.recvVideo.packetsReceived = res.results[r].packetsReceived;
                    result.recvVideo.timestamp = res.results[r].timestamp;

                }
                break;

            case 'VideoBwe':
                result.videoBWE = res.results[r]
                break;
            case 'googCandidatePair':
                // there's also one which is not active
                if(res.results[r].googActiveConnection === "true") {
                    result.bytesReceived = res.results[r].bytesReceived;
                    result.bytesSent = res.results[r].bytesSent;
                    result.googRtt = res.results[r].googRtt;
                    result.packetsDiscardedOnSend = res.results[r].packetsDiscardedOnSend;
                    result.packetsSent = res.results[r].packetsSent;
                    result.timestamp = res.results[r].timestamp;
                }
        }
    }

    return result;

}

InfoBox.prototype.getSeconds = function() {
    var minutes = Math.floor(window.callInfo.length/60);
    var seconds = window.callInfo.length - minutes*60;

    if(minutes < 10) {
        minutes = '0' + minutes;
    }

    if(seconds < 10) {
        seconds = '0' + seconds;
    }

    return minutes + ':' + seconds;
}

InfoBox.prototype.getRTT = function() {
    return this.callData.googRtt + 'ms';
}

InfoBox.prototype.formatNr = function(nr) {
    if(nr < 10) {
        nr = '0' + nr;
    }

    return nr;

}

InfoBox.prototype.uploadData = function() {
    var data = [];

    if(!window.callInfo || window.callInfo.length === 0) {
        return;
    }

    for(var i = 0; i < window.callInfo.length; i++) {
        data.push(this.getNecessaryData(window.callInfo[i]));
    }

    var storageRef = firebase.storage().ref();

    var databaseRef = firebase.database();


    var jsonse = JSON.stringify(data);
    var file = new Blob([jsonse], {type: "application/json"});

    var date = new Date();

    var year = date.getFullYear();
    var month = this.formatNr(date.getMonth() + 1);
    var day = this.formatNr(date.getDate());
    var hours = this.formatNr(date.getHours());
    var minutes = this.formatNr(date.getMinutes());
    var seconds = this.formatNr(date.getSeconds());

    var name = year + "-" + month + "-" + day + "_" + hours + ":" + minutes + ":" + seconds + "_" +Math.floor(Math.random()*1000000) +".txt";

    // Upload the file to the path 'images/rivers.jpg'
    // We can use the 'name' property on the File API to get our file name
    // var uploadTask = storageRef.child('phidio-logs/' + name).put(file);

    // uploadTask.on('state_changed', function(snapshot){
    // }, function(error) {
        // alert('error uploading');
        // console.log(error);
    // }, function() {
        // alert('successfully uploaded');
        // console.log('succesfully uploaded!');
        // var downloadURL = uploadTask.snapshot.downloadURL;
        // console.log('available at', downloadURL)
        databaseRef.ref('logs').push({
            contents: jsonse,
            // downloadURL: downloadURL,
            fileName: name,
            callLength: window.callInfo.length
        }, function() {
            alert('successfully pushed data to db');
        })
    // });
}


module.exports = InfoBox;
