/**
 * @license
 * Copyright 2018 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */

/********************************************************************
 * Demo created by Jason Mayes 2021.
 *
 * Got questions? Reach out to me on social:
 * Twitter: @jason_mayes
 * LinkedIn: https://www.linkedin.com/in/creativetech
 ********************************************************************/

/**
var firebaseConfig = {
  apiKey: process.env.API_KEY,
  authDomain: process.env.AUTH_DOMAIN,
  projectId: process.env.PROJECT_ID,
  storageBucket: process.env.STORAGE_BUCKET,
  messagingSenderId: process.env.MESSAGING_SENDER_ID,
  appId: process.env.APP_ID,
  measurementId: process.env.MEASUREMENT_ID
};


// Initialize Firebase
firebase.initializeApp(firebaseConfig);
console.log(firebase.auth().currentUser);
*/

const CAM_WIDTH = 640;
const CAM_HEIGHT = 480;
const MIN_DETECTION_CONFIDENCE = 0.75;
const ANIMATION_TIME = 500;

const STEP_1 = document.getElementById('step1');
const STEP_2 = document.getElementById('step2');
const STEP_3 = document.getElementById('step3');

const ENABLE_WEBCAM_BTN = document.getElementById('webcamButton');
const ENABLE_DETECTION_BTN = document.getElementById('enableDetection');

const CHOSEN_ITEM = document.getElementById('item');
const CHOSEN_ITEM_GUI = document.getElementById('chosenItem');
const CHOSEN_PET = document.getElementById('pet');

const VIDEO = document.getElementById('webcam');
const LIVE_VIEW = document.getElementById('liveView');


// Keep a reference of all the child elements we create
// so we can remove them easilly on each render.
var children = [];
var model = undefined;
var ratioX = 1;
var ratioY = 1;
var state = 'setup';

// Before we can use COCO-SSD class we must wait for it to finish
// loading. Machine Learning models can be large and take a moment to
// get everything needed to run.
cocoSsd.load().then(function(loadedModel) {
  model = loadedModel;
  // Show demo section now model is ready to use.
  ENABLE_WEBCAM_BTN.classList.remove('disabled');
});


// Check if webcam access is supported.
function hasGetUserMedia() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}


// If webcam supported, add event listener to button for when user
// wants to activate it.
if (hasGetUserMedia()) {
  ENABLE_WEBCAM_BTN.addEventListener('click', enableCam);
} else {
  console.warn('getUserMedia() is not supported by your browser');
}

// Enable the live webcam view and start classification.
function enableCam(event) {
  if (!model) {
    console.log('Wait! Model not loaded yet.');
    return;
  }

  // Go full screen.
  /**
  document.documentElement.requestFullscreen({
    navigationUI: "hide"
  });
  **/

  // Hide the button.
  event.target.classList.add('removed');
  // Fade GUI step 1 and setup step 2.
  STEP_1.classList.add('disabled');
  STEP_2.setAttribute('class', 'invisible');

  // getUsermedia parameters.
  const constraints = {
    video: {
      facingMode: 'environment',
      width: CAM_WIDTH,
      height: CAM_HEIGHT
    }
  };

  // Activate the webcam stream.
  navigator.mediaDevices.getUserMedia(constraints).then(function(stream) {
    VIDEO.srcObject = stream;
    
    VIDEO.addEventListener('loadeddata', function() {
      recalculateVideoScale();

      setTimeout(function() {
        STEP_2.setAttribute('class', '');
      }, ANIMATION_TIME);
      
      predictWebcam();
    });
  });
}


function renderFoundObject(prediction) {
  const p = document.createElement('p');
  p.innerText =
    prediction.class +
    ' - with ' +
    Math.round(parseFloat(prediction.score) * 100) +
    '% confidence.';
  // Draw in top left of bounding box outline.
  p.style =
    'left: ' +
    prediction.bbox[0] * ratioX +
    'px;' +
    'top: ' +
    prediction.bbox[1] * ratioY +
    'px;' +
    'width: ' +
    (prediction.bbox[2] * ratioX - 10) +
    'px;';

  // Draw the actual bounding box.
  const highlighter = document.createElement('div');
  highlighter.setAttribute('class', 'highlighter');
  highlighter.style =
    'left: ' +
    prediction.bbox[0] * ratioX +
    'px; top: ' +
    prediction.bbox[1] * ratioY +
    'px; width: ' +
    prediction.bbox[2] * ratioX +
    'px; height: ' +
    prediction.bbox[3] * ratioY +
    'px;';

  LIVE_VIEW.appendChild(highlighter);
  LIVE_VIEW.appendChild(p);

  // Store drawn objects in memory so we can delete them next time around.
  children.push(highlighter);
  children.push(p);
}


function predictWebcam() {
  // Now let's start classifying the stream.
  model.detect(VIDEO).then(function(predictions) {
    // Remove any highlighting we did previous frame.
    for (let i = 0; i < children.length; i++) {
      LIVE_VIEW.removeChild(children[i]);
    }
    children.splice(0);

    // Now lets loop through predictions and draw them to the live view if
    // they have a high confidence score.
    for (let n = 0; n < predictions.length; n++) {
      // If we are over 75% sure we are sure we classified it right, draw
      // it and check for monitored items intersecting!
      if (predictions[n].score > MIN_DETECTION_CONFIDENCE) {
        
        if(state === 'searching') {
          renderFoundObject(predictions[n]);
          
          // Check to see if desired object is in frame.
          if (predictions[n].class === CHOSEN_ITEM.value) {
            state = 'monitoring';
            // We see the object we should be monitoring. Update GUI.
            STEP_1.classList.remove('grayscale');
            STEP_1.classList.remove('disabled');
            STEP_3.classList.add('invisible');
            
            setTimeout(function() {
              STEP_3.setAttribute('class', 'removed');
              STEP_2.setAttribute('class', 'removed');
            }, ANIMATION_TIME)
          }
        } else if (state === 'monitoring') {
          // Check for intersection with pet
          if (predictions[n].class === CHOSEN_ITEM.value) {
            renderFoundObject(predictions[n]);
            huntForPets(predictions[n], predictions, CHOSEN_PET.value);
            // Assumes 1 monitored item only so we can break loop now.
            break;
          }
        }
      }
    }

    // Call this function again to keep predicting when the browser is ready.
    window.requestAnimationFrame(predictWebcam);
  });
}


function checkIfNear(item1, item2) {
  // check if objcts intersect or close. TODO.
}


function huntForPets(monitoredItem, detectionArray, target) {
  for (let i = 0; i < detectionArray.length; i++) {
    if (detectionArray[i].class === target && detectionArray[i].score > MIN_DETECTION_CONFIDENCE) {
      renderFoundObject(detectionArray[i]);
      checkIfNear(monitoredItem, detectionArray[i]);
    }
  }
}


function recalculateVideoScale() {
  ratioY = VIDEO.clientHeight / VIDEO.videoHeight;
  ratioX = VIDEO.clientWidth / VIDEO.videoWidth;
}


function enableDetection() {
  CHOSEN_ITEM_GUI.innerText = CHOSEN_ITEM.value;
  STEP_1.classList.add('grayscale');
  STEP_2.setAttribute('class', 'invisible');
  STEP_3.setAttribute('class', 'invisible');
  setTimeout(function() {
    STEP_3.setAttribute('class', '');
    state = 'searching';
  }, ANIMATION_TIME);
}


window.addEventListener("resize", recalculateVideoScale);
ENABLE_DETECTION_BTN.addEventListener('click', enableDetection);

/**
{
  detectionEvent: {
    // epoch of detection
    dateTime: 1614717259,
    // full image frame taken from webcam (potentially pre-processed 
    // eg blurred in some parts)
    img: "https://somesite.com/detection.jpg",
    eventData: [
      {
        eventType: "My custom naughty rectangle",
        x1: 0.1,
        y1: 0.4,
        width: 0.53,
        height: 0.35,
        // Array of bounding boxes as multiple objects possibly being 
        // detected for a given monitore region
        detections: [
          {
            objectType: "cat",
            // values represent percentage poisitons and widths/heights
            // that way agnostic to any image resizing when shown in
            // admin GUI vs original image size from webcam.
            x1: 0.2,  // upper left point is 20% along the image from left.
            y1: 0.3,  // upper top point is 30% down the image from top.
            width: 0.33, // width of bounding box is 33% of total image width.
            height: 0.25  // height of bounding box is 25% of total image height.
          },
          // naughty dog in frame at this region too oh my!
          {
            objectType: "dog",
            x1: 0.1,
            y1: 0.4,
            width: 0.53,
            height: 0.35
          }
        ],
      },

      // And here is a 2nd region that got triggered at the same time - bird flew into region 2!
      {
        eventType: "My other naughty rectangle",
        x1: 0.1,
        y1: 0.4,
        width: 0.53,
        height: 0.35,
        detections: [
          {
            objectType: "bird",
            x1: 0.2, 
            y1: 0.3,  
            width: 0.33,
            height: 0.25 
          }
        ]
      }
    ]
  }
}
**/
