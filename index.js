window.addEventListener('load', () => {
    var stdout = "";
    var stderr = "";
    var oReq = new XMLHttpRequest();
    oReq.open("GET", "test.webm", true);
    oReq.responseType = "arraybuffer";
    oReq.onload = function (oEvent) {
        var testData = new Uint8Array(oReq.response);
        var worker = new Worker("ffmpeg-worker-webm.js");
        worker.onmessage = function(e) {
            var msg = e.data;
            console.log(msg.data)
            switch (msg.type) {
                case "ready":
                    worker.postMessage({
                        type: "run",
                        MEMFS: [{ name: 'test.webm', data: testData }],
                        arguments: ["-i", "test.webm", "-filter:v", "crop=400:200:00:00", "-c:a", "copy", "out.webm"]
                    });
                    break;
                case "stdout":
                    stdout += msg.data + "\n";
                    break;
                case "stderr":
                    stderr += msg.data + "\n";
                    break;
                case "exit":
                    console.log("Process exited with code " + msg.data);
                    console.log(stdout);
                    break;
                case "done":
                    const processedVideo = msg.data.MEMFS[0].data;
                    const blob = new Blob([processedVideo.buffer], { type: 'video/webm' });
                    const url = URL.createObjectURL(blob);
                    const video = document.createElement('video');
                    video.controls = true;
                    video.src = url;
                    const body = document.querySelector('body');
                    body.appendChild(video);
            }
        };
    }
    oReq.send(null);
})
