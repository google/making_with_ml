/**
 * @license
 * Copyright 2021 Google LLC. All Rights Reserved.
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
 * Demo created by Jason Mayes and Dale Markowitz 2021.
 *
 * Got questions? Reach out to us on social:
 * Twitter: @jason_mayes
 * LinkedIn: https://www.linkedin.com/in/creativetech
 * Twitter: @dalequark
 * www.daleonai.com
 ********************************************************************/

 const db = firebase.firestore();
 const storage = firebase.storage();

 const CAM_WIDTH = 640;
 const CAM_HEIGHT = 480;
 const MIN_DETECTION_CONFIDENCE = 0.6;
 const ANIMATION_TIME = 500;
 // Min number of seconds before we send another alert.
 const MIN_ALERT_COOLDOWN_TIME = 60;
 
 const STEP_1 = document.getElementById('step1');
 const STEP_2 = document.getElementById('step2');
 const STEP_3 = document.getElementById('step3');
 
 const ENABLE_WEBCAM_BTN = document.getElementById('webcamButton');
 const ENABLE_DETECTION_BTN = document.getElementById('enableDetection');
 
 const CHOSEN_ITEM = document.getElementById('item');
 const CHOSEN_ITEM_GUI = document.getElementById('chosenItem');
 const CHOSEN_PET = document.getElementById('pet');
 const MONITORING_TEXT = document.getElementById('monitoring');
 
 const VIDEO = document.getElementById('webcam');
 const LIVE_VIEW = document.getElementById('liveView');
 
 const CANVAS = document.createElement('canvas');
 const CTX = CANVAS.getContext('2d');
 
 // Keep a reference of all the child elements we create
 // so we can remove them easilly on each render.
 var children = [];
 var model = undefined;
 var ratioX = 1;
 var ratioY = 1;
 var state = 'setup';
 var lastNaughtyAnimalCount = 0;
 var sendAlerts = true;
 var foundMonitoredObjects = [];
 
// Before we do anything, we need to load the model and log in.
function checkReady() {
  if (firebase.auth().currentUser && model) {
    console.log("Model loaded, user logged in. Ready to go");
    // Show demo section now model is ready to use.
    ENABLE_WEBCAM_BTN.classList.remove("disabled");
  }
}

// Check if the user is logged in (and wait if they're not)
firebase.auth().onAuthStateChanged((user) => {
  checkReady();
});

// Before we can use COCO-SSD class we must wait for it to finish
// loading. Machine Learning models can be large and take a moment to
// get everything needed to run.
cocoSsd.load().then(function (loadedModel) {
  model = loadedModel;
  checkReady();
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
     
     // Reset the last rendered and found items.
     children.splice(0);
     foundMonitoredObjects.splice(0);
     
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
             MONITORING_TEXT.setAttribute('class', '');
             setTimeout(function() {
               STEP_3.setAttribute('class', 'removed');
               STEP_2.setAttribute('class', 'removed');
             }, ANIMATION_TIME)
           }
         } else if (state === 'monitoring') {
           // Check for intersection with pet
           if (predictions[n].class === CHOSEN_ITEM.value) {
             renderFoundObject(predictions[n]);
             foundMonitoredObjects.push(predictions[n]);
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
 
 
 class BBox {
   constructor(bbox) {
       let x = bbox[0];
       let y = bbox[1];
       this.width = bbox[2];
       this.height = bbox[3];
       this.midX = x + this.width / 2;
       this.midY = y + this.height / 2;
   }
 
   distance(bbox) {
       let xDiff = Math.abs(this.midX - bbox.midX) - this.width / 2 - bbox.width / 2;
       let yDiff = Math.abs(this.midY - bbox.midY) - this.height / 2 - bbox.height / 2;
 
       // If xDiff < 0, the boxes intersect in the x plane. Thus the distance is just the
       // y height, or 0 if the boxes intersect in the y plane, too.
       if(xDiff < 0) {
           return Math.max(yDiff, 0);
       }
       // In this case, boxes intersect in y plane but not x plane.
       if(yDiff < 0) {
           return xDiff;
       }
       // BBoxes intersect in neither plane. Return the Euclidean distance between
       // the closest corners.
       return Math.sqrt(xDiff**2 + yDiff**2);
   }
 }
 
 
 function checkIfNear(item1, item2, distance=0) {
   const BOUNDING_BOX_1 = new BBox(item1.bbox);
   const BOUNDING_BOX_2 = new BBox(item2.bbox);
   return BOUNDING_BOX_1.distance(BOUNDING_BOX_2) <= distance;
 }
 
 
 function cooldown() {
   sendAlerts = true;
 }
 
 async function logToFirestore(blob, detectionEvent) {
  const uid = firebase.auth().currentUser.uid;
  const imgId = detectionEvent.dateTime.toString();
  const imgRef = storage.ref().child(`users/${uid}/${imgId}.png`);
  await imgRef.put(blob);
  detectionEvent.img = `users/${uid}/${imgId}.png`;
  await db.collection("users").doc(uid).collection("events").doc(imgId).set(detectionEvent);
 }

 // Function to create the alert object we wish to send with all useful details.
 function sendAlert(naughtyAnimals) {
   var detectionEvent = {};
   // Epoch of detection time.
   detectionEvent.dateTime = Date.now();
 
   detectionEvent.eventData = [];
  
   for (let i = 0; i < foundMonitoredObjects.length; i++) {
     var event = {};
 
     event.eventType = foundMonitoredObjects[i].class;
     event.score = foundMonitoredObjects[i].score;
     event.x1 = foundMonitoredObjects[i].bbox[0] / VIDEO.videoWidth;
     event.y1 = foundMonitoredObjects[i].bbox[1] / VIDEO.videoHeight;
     event.width = foundMonitoredObjects[i].bbox[2] / VIDEO.videoWidth;
     event.height = foundMonitoredObjects[i].bbox[3] / VIDEO.videoHeight;
    
     event.detections = [];
     
     for (let n = 0; n < naughtyAnimals.length; n ++) {
       let animal = {};
       animal.objectType = naughtyAnimals[n].class;
       animal.score = naughtyAnimals[n].score;
       animal.x1 = naughtyAnimals[n].bbox[0] / VIDEO.videoWidth;
       animal.y1 = naughtyAnimals[n].bbox[1] / VIDEO.videoHeight;
       animal.width = naughtyAnimals[n].bbox[2] / VIDEO.videoWidth;
       animal.height = naughtyAnimals[n].bbox[3] / VIDEO.videoHeight;
       event.eventType += `x${animal.objectType}`;
       event.detections.push(animal);
     }
     
     detectionEvent.eventData.push(event);
   }
   
   // Draw a frame from video to in memory canvas!
   CTX.drawImage(VIDEO, 0, 0);
   // Get image from canvas as blob.
   CANVAS.toBlob(function(blob) {
     console.log("Writing to firebase");
     console.log(blob);
    logToFirestore(blob, detectionEvent).then(() => {
      console.log("Logged");
    }).catch((err) => {
      console.log(`Error writing to firestore ${err.message}`);
    })
   }, 'image/png');
 }
 
 
 function huntForPets(monitoredItem, detectionArray, target) {
   var naughtyAnimals = [];
   
   for (let i = 0; i < detectionArray.length; i++) {
     if (detectionArray[i].class === target && detectionArray[i].score > MIN_DETECTION_CONFIDENCE) {
       renderFoundObject(detectionArray[i]);
       if (checkIfNear(monitoredItem, detectionArray[i])) {
         naughtyAnimals.push(detectionArray[i]);
       }
     }
   }
   
   if (naughtyAnimals.length > lastNaughtyAnimalCount) {
     lastNaughtyAnimalCount = naughtyAnimals.length;
 
     if (sendAlerts) {
       sendAlerts = false;
       sendAlert(naughtyAnimals);
       setTimeout(cooldown, MIN_ALERT_COOLDOWN_TIME * 1000);
     }
   } else if (naughtyAnimals.length === 0) {
     // If all animals left, reset animal counter so we start triggering events 
     // again when one comes back in frame.
     lastNaughtyAnimalCount = 0;
   }
 }
 
 
 function recalculateVideoScale() {
   ratioY = VIDEO.clientHeight / VIDEO.videoHeight;
   ratioX = VIDEO.clientWidth / VIDEO.videoWidth;
   CANVAS.width = VIDEO.videoWidth;
   CANVAS.height = VIDEO.videoHeight;
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
 