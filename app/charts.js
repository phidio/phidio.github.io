document.addEventListener("DOMContentLoaded", function(event) {
    // Initialize Firebase
    var config = {
        apiKey: "AIzaSyDnzyBboDq8d-Kx3HIPhbxS-rOPtnMNguk",
        databaseURL: "https://webrtcstats-4397d.firebaseio.com",
        storageBucket: "webrtcstats-4397d.appspot.com",
    };

    createCharts();

    var selectObj = document.getElementById('callSelect');

    selectObj.onchange=function(){
        console.log(selectObj.value);

        updateCharts(JSON.parse(window.fbData[selectObj.value].contents));
    };

    firebase.initializeApp(config);

    firebase.database().ref('logs').once('value', function(snapshot) {
        window.fbData = snapshot.val();
        var val = window.fbData;




        for(var key in val) {
            if(val[key]) {
                selectObj.options[selectObj.options.length] = new Option(val[key].fileName + ' ('+val[key].callLength+' seconds)', key);
            }

        }


    });

});

function updateCharts(data) {

    var totRecvBw = [],totSentBw = [], sentFps = [], recvFps = [], sentRes = [], recvRes = [], xAxis = [];

    for(var i = 0; i < data.length; i++) {
        xAxis.push(i);

        bandwidth = getBandwidth(i, data[i], i !== 0 ? data[i-1] : '', 'recv');
        totRecvBw.push(bandwidth[0] + bandwidth[1]);

        bandwidth = getBandwidth(i, data[i], i !== 0 ? data[i-1] : '', 'sent');
        totSentBw.push(bandwidth[0] + bandwidth[1]);

        sentFps.push(data[i].sentVideo.googFrameRateSent || '0');
        recvFps.push(data[i].recvVideo.googFrameRateReceived || '0');

        sentRes.push(data[i].sentVideo.googFrameWidthSent || '0');
        recvRes.push(data[i].recvVideo.googFrameWidthReceived || '0');
    }


    window.myBwChart.data.labels = xAxis;
    window.myBwChart.data.datasets[0].data = totSentBw;
    window.myBwChart.data.datasets[1].data = totRecvBw;
    window.myBwChart.update();



    window.myFpsChart.data.labels = xAxis;
    window.myFpsChart.data.datasets[0].data = sentFps;
    window.myFpsChart.data.datasets[1].data = recvFps;
    window.myFpsChart.update();

    window.myResChart.data.labels = xAxis;
    window.myResChart.data.datasets[0].data = sentRes;
    window.myResChart.data.datasets[1].data = recvRes;
    window.myResChart.update();
}


function createCharts() {
    var bwChart = document.getElementById("bwChart");
    window.myBwChart = new Chart(bwChart, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Tx data rate',
                data: [],
                backgroundColor: 'rgba(255, 99, 132, 0)',
                borderColor: 'rgba(255,99,132,1)',
                borderWidth: 1
            }, {
                label: 'Rx data rate',
                data: [],
                backgroundColor: 'rgba(54, 162, 235, 0)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive:true,
            maintainAspectRatio: false,
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero:true
                    }
                }]
            }
        }
    });


    var fpsChart = document.getElementById("fpsChart");
    window.myFpsChart = new Chart(fpsChart, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Tx Fps',
                data: [],
                backgroundColor: 'rgba(255, 99, 132, 0)',
                borderColor: 'rgba(255,99,132,1)',
                borderWidth: 1
            }, {
                label: 'Rx Fps',
                data: [],
                backgroundColor: 'rgba(54, 162, 235, 0)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive:true,
            maintainAspectRatio: false,
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero:true
                    }
                }]
            }
        }
    });



    var resChart = document.getElementById("resChart");
    window.myResChart = new Chart(resChart, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Tx FrameWidth',
                data: [],
                backgroundColor: 'rgba(255, 99, 132, 0)',
                borderColor: 'rgba(255,99,132,1)',
                borderWidth: 1
            }, {
                label: 'Rx FrameWidth',
                data: [],
                backgroundColor: 'rgba(54, 162, 235, 0)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive:true,
            maintainAspectRatio: false,
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero:true
                    }
                }]
            }
        }
    });
}


function getBandwidth(i, current, previous, type) {
    var bandwidth, properties = ['recvAudio', 'recvVideo'], result = [], byteVal = 'bytesReceived';

    if(type ===  'sent') {
        properties = ['sentAudio', 'sentVideo'];
        byteVal = 'bytesSent';
    }

    for(var p = 0; p < properties.length; p++) {
        bandwidth = 0;

        if(i !== 0 && current[properties[p]] && current[properties[p]][byteVal] && previous[properties[p]] &&  previous[properties[p]][byteVal]) {
            bandwidth = current[properties[p]][byteVal]-previous[properties[p]][byteVal]
        }
        else if(current[properties[p]] && current[properties[p]][byteVal]) {
            bandwidth = current[properties[p]][byteVal];
        }

        if(i !== 0 && previous.timestamp) {
            bandwidth = bandwidth/((new Date(current.timestamp).getTime()-new Date(previous.timestamp).getTime()) / 1000);
        }

        // bytes to kilobits
        bandwidth = (8*bandwidth/1000).toFixed(2);

        result.push(parseFloat(bandwidth));
    }

    return result;
}
