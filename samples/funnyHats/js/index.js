let utils = new Utils('errorMessage');
let stats = null;
//let resolution = window.innerWidth < 700 ? 'qvga' : 'vga';
let resolution = 'qvga';
let video = document.getElementById('videoInput');
let canvasOutput = document.getElementById('canvasOutput');
let canvasContext = canvasOutput.getContext('2d');
let statsCheckbox = document.getElementById('hideStats');
let streaming = false;
let src = null;
let cap = null;
let faces = null;
let classifier = null;
const faceDetectionPath = 'haarcascade_frontalface_default.xml';
const faceDetectionUrl = 'resources/haarcascade_frontalface_default.xml';
let imgHat;
let mask = null;
let maskInv = null;
let imgBg = null;
let imgFg = null;
let sum = null;
let dst = null;

statsCheckbox.addEventListener("change", function () {
  statsCheckbox.checked
  if (document.getElementById('hideStats').checked) {
    stats.domElement.classList.add("hidden");
  } else {
    stats.domElement.classList.remove("hidden");
  }
});

const FPS = 30;
function startVideoProcessing() {
  stats = new Stats();
  src = new cv.Mat(video.height, video.width, cv.CV_8UC4);
  gray = new cv.Mat();
  cap = new cv.VideoCapture(video);
  faces = new cv.RectVector();
  classifier = new cv.CascadeClassifier();
  mask = new cv.Mat();
  maskInv = new cv.Mat();
  imgBg = new cv.Mat();
  imgFg = new cv.Mat();
  sum = new cv.Mat();
  dst = new cv.Mat();

  stats.showPanel(0);
  document.body.appendChild(stats.domElement);
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.right = '0px';
  stats.domElement.style.top = '0px';
  stats.domElement.classList.add("hidden");
  // load pre-trained classifier for face detection
  classifier.load(faceDetectionPath);

  // load hat
  imgHat = cv.imread('hat1');

  // schedule the first processing
  setTimeout(processVideo, 0);
}

function processVideo() {
  try {
    if (!streaming) {
      // clean and stop
      src.delete();
      gray.delete();
      faces.delete();
      classifier.delete();
      mask.delete();
      maskInv.delete();
      imgBg.delete();
      imgFg.delete();
      sum.delete();
      dst.delete();
      return;
    }
    stats.begin();
    let begin = Date.now();
    // start processing
    cap.read(src);
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);
    // detect faces
    classifier.detectMultiScale(gray, faces,
      1.1, 3); // scaleFactor=1.1, minNeighbors=3

    // draw hat

    let rect = new cv.Rect(0, 0, 100, 80);
    let roi = src.roi(rect);

    let dsize = new cv.Size(100, 80);
    cv.resize(imgHat, imgHat, dsize, 0, 0, cv.INTER_LINEAR);

    cv.cvtColor(imgHat, mask, cv.COLOR_RGBA2GRAY);
    cv.threshold(mask, mask, 0, 255, cv.THRESH_BINARY);
    cv.bitwise_not(mask, maskInv);

    cv.bitwise_and(roi, roi, imgBg, maskInv);
    cv.bitwise_and(imgHat, imgHat, imgFg, mask);
    cv.add(imgBg, imgFg, sum);

    dst = src.clone();
    for (let i = 0; i < imgHat.rows; i++) {
      for (let j = 0; j < imgHat.cols; j++) {
        dst.ucharPtr(i, j)[0] = sum.ucharPtr(i, j)[0];
      }
    }

    //for (let i = 0; i < faces.size(); ++i) {
    //  let face = faces.get(i);
      // draw face
      // let point1 = new cv.Point(face.x, face.y);
      // let point2 = new cv.Point(face.x + face.width, face.y + face.height);
      // cv.rectangle(src, point1, point2, color);
    //}
    cv.imshow('canvasOutput', dst);
    //cv.imshow('canvasOutput', imgHat);
    // schedule the next processing
    let delay = 1000 / FPS - (Date.now() - begin);
    stats.end();
    setTimeout(processVideo, delay);
  } catch (err) {
    utils.printError(err);
  }
};

function startCamera() {
  if (!streaming) {
    utils.clearError();
    utils.startCamera(resolution, onVideoStarted, 'videoInput');
  } else {
    utils.stopCamera();
    onVideoStopped();
  }
}

function onVideoStarted() {
  streaming = true;
  video.width = video.videoWidth;
  video.height = video.videoHeight;
  //canvasOutput.width = video.videoWidth;
  //canvasOutput.height = video.videoHeight;
  //canvasOutput.style.width = `${video.videoWidth}px`;
  //canvasOutput.style.height = `${video.videoHeight}px`;
  startVideoProcessing();
}

function onVideoStopped() {
  streaming = false;
  canvasContext.clearRect(0, 0, canvasOutput.width, canvasOutput.height);
}

utils.loadOpenCv(() => {
  utils.createFileFromUrl(faceDetectionPath, faceDetectionUrl, () => {
    startCamera();
  });
});