let utils = new Utils('errorMessage');
let stats = null;
let controls = {};
let videoConstraint;
let streaming = false;
let videoTrack = null;
let imageCapturer = null;
let video = document.getElementById('videoInput');
let canvasOutput = document.getElementById('canvasOutput');
let videoCapturer = null;
let src = null;

// We draw rectangle for card on video stream.
let rectPointUpperLeft;
let rectPointBottomRight;
const rectColor = [0, 255, 0, 255]; // Green


function calculateRectCoordinates() {
  const rectRatio = 1.586;
  let xLeft = parseInt(video.width * 0.1);
  let xRight = parseInt(video.width * 0.9);
  let width = xRight - xLeft;
  let height = width / rectRatio;
  let yUpper = parseInt(video.height / 2 - height / 2);
  let yBottom = parseInt(yUpper + height);
  rectPointUpperLeft = new cv.Point(xLeft, yUpper);
  rectPointBottomRight = new cv.Point(xRight, yBottom);
}

function initOpencvObjects() {
  videoCapturer = new cv.VideoCapture(video);
  src = new cv.Mat(video.height, video.width, cv.CV_8UC4);
  calculateRectCoordinates();
  startCardProcessing(src);
}

function completeStyling() {
  let cameraBar = document.querySelector('.camera-bar-wrapper');
  cameraBar.style.width = `${video.videoWidth}px`;

  let mainContent = document.getElementById('mainContent');
  mainContent.style.width = `${video.videoWidth}px`;
  mainContent.classList.remove('hidden');

  document.querySelector('.canvas-wrapper').style.height =
    `${video.videoHeight}px`;

  document.getElementById('takePhotoButton').disabled = false;
  document.getElementById('facingModeButton').disabled = true;
}

function processVideo() {
  try {
    if (!streaming) {
      src.delete();
      return;
    }
    stats.begin();
    videoCapturer.read(src);
    //startCardProcessing(src);
    cv.rectangle(src, rectPointUpperLeft, rectPointBottomRight, rectColor, 3);
    cv.imshow('canvasOutput', src);
    stats.end();
    requestAnimationFrame(processVideo);
  } catch (err) {
    utils.printError(err);
  }
}

function initUI() {
  getVideoConstraint();
  initStats();

  // TakePhoto event by clicking takePhotoButton.
  let takePhotoButton = document.getElementById('takePhotoButton');
  takePhotoButton.addEventListener('click', function () {
    takePhoto();
  });

  controls = {
    frontCamera: null,
    backCamera: null,
    facingMode: '',
  };
}

function startCamera() {
  utils.startCamera(videoConstraint, 'videoInput', onVideoStarted);
}

function stopCamera(videoElem) {
  if (!streaming) {
    utils.clearError();
    utils.startCamera(videoConstraint, 'videoInput', onVideoStarted);
  } else {
    utils.stopCamera();
    onVideoStopped();
  }
};

utils.loadOpenCv(() => {
  initUI();
  initCameraSettingsAndStart();
});
