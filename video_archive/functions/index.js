/**
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const video = require('@google-cloud/video-intelligence');
const fs = require('fs');
const path = require('path');
const os = require('os');
const utils = require('./utils');
const algolia = require('./algolia');

require('dotenv').config();

admin.initializeApp();

/* When a video is uploaded to a storage bucket, this function
creates a thumbnail image from it and saves it to a
cloud storage. */
async function makePreviewImage(object) {
  // Temporarily download the video.
  const tempVideoPath = path.join(os.tmpdir(), 'video');
  await admin
      .storage()
      .bucket(object.bucket)
      .file(object.name)
      .download({destination: tempVideoPath});

  const userid = object.name.split('/')[0];
  const videoid = object.name.split('/')[1].split('.')[0];

  fs.statSync(tempVideoPath);

  try {
    await utils.makePreviewImage(tempVideoPath, os.tmpdir(), `thumbnail.png`);
  } catch (err) {
    console.log(`Failed to generate thumbnail! ${err.message}`);
    return;
  }

  await admin
      .storage()
      .bucket(process.env.THUMBNAIL_BUCKET)
      .upload(`${os.tmpdir()}/thumbnail.png`,
          {destination: `${userid}/${videoid}.png`});

  admin
      .firestore()
      .collection('users')
      .doc(userid)
      .collection('videos')
      .doc(videoid)
      .set({
        thumbnail: `${userid}/${videoid}.png`,
      }, {merge: true});

  // Clean up!
  fs.unlinkSync(tempVideoPath);
  fs.unlinkSync(`${os.tmpdir()}/thumbnail.png`);
}

/* When a video is uploaded to cloud storage, this function
kicks off analysis with the Video Intelligence API, which runs
asynchronously. It also writes some data about the job to
Firestore */
async function analyzeVideo(object) {
  console.log(
      `Got file ${object.name} with content type ${object.contentType}`,
  );

  const videoContext = {
    speechTranscriptionConfig: {
      languageCode: 'en-US',
      enableAutomaticPunctuation: true,
    },
  };

  // Files have the format bucket_name/userid/videoid.(file ext here)
  const userid = object.name.split('/')[0];
  const videoid = object.name.split('/')[1].split('.')[0];
  const jsonFile = `${videoid}.json`;
  console.log(`userid ${userid} and videoid ${videoid}`);
  console.log(`Object path: '${object.bucket}/${object.name}'`);
  const request = {
    inputUri: `gs://${object.bucket}/${object.name}`,
    outputUri: `gs://${process.env.VIDEO_JSON_BUCKET}/${userid}/${jsonFile}`,
    features: [
      'LABEL_DETECTION',
      'SHOT_CHANGE_DETECTION',
      'TEXT_DETECTION',
      'SPEECH_TRANSCRIPTION',
    ],
    videoContext: videoContext,
  };

  const client = new video.v1.VideoIntelligenceServiceClient();

  // Detects labels in a video
  console.log(`Kicking off client annotation`);
  const [operation] = await client.annotateVideo(request);
  console.log('operation', operation);

  // If info about the timestamp was passed as metadata, process and
  // save it
  let videoTimestamp = object.metadata ? object.metadata.timestamp : null;
  if (videoTimestamp) {
    // convert to unix timestamp
    videoTimestamp = utils.parseDate(videoTimestamp);
    console.log(`Got unix timestamp ${videoTimestamp}`);
  }

  admin
      .firestore()
      .collection('users')
      .doc(userid)
      .collection('videos')
      .doc(videoid)
      .set({
        operation: operation.name,
        filePath: object.name,
        status: 'processing',
        videoTimestamp: videoTimestamp ? videoTimestamp : null,
      }, {merge: true});
}

/* When the Video Intelligence API writes json data to a
cloud storage bucket, it triggers this function, which
parses the json and writes the data to Algolia */
async function processVideoJson(object) {
  const tempFilePath = path.join(os.tmpdir(), 'data.json');

  // Locally download the json file created by the vision API
  await admin
      .storage()
      .bucket(object.bucket)
      .file(object.name)
      .download({destination: tempFilePath});

  const userid = object.name.split('/')[0];
  const videoid = object.name.split('/')[1].split('.')[0];
  const json = JSON.parse(fs.readFileSync(tempFilePath));

  // Parse annotaitons from output file
  const transcriptJson = utils.parseTranscript(json);
  const shotLabelJason = utils.parseShotLabelAnnotations(json);
  const textJson = utils.parseTextAnnotations(json);

  // Store data to searchable Algolia index
  await algolia.save(
      userid,
      videoid,
      transcriptJson,
      shotLabelJason,
      textJson,
  );

  // Clean up temporary file
  fs.unlinkSync(tempFilePath);

  // Mark the file as done processing in Firestore
  await admin
      .firestore()
      .collection('users')
      .doc(userid)
      .collection('videos')
      .doc(videoid)
      .update({
        status: 'finished',
      });
}

exports.analyzeVideo = functions.storage
    .bucket(process.env.VIDEO_BUCKET)
    .object()
    .onFinalize(async (object) => {
      await analyzeVideo(object);
    });
exports.makePreviewImage = functions.storage
    .bucket(process.env.VIDEO_BUCKET)
    .object()
    .onFinalize(async (object) => {
      await makePreviewImage(object);
    });
exports.processVideoJson = functions.storage
    .bucket(process.env.VIDEO_JSON_BUCKET)
    .object()
    .onFinalize(async (object) => {
      await processVideoJson(object);
    });

/* Does what it says--takes a userid and a query and returns
relevant video data */
exports.search = functions.https.onCall(async (data, context) => {
  if (!context.auth || !context.auth.token.email) {
    // Throwing an HttpsError so that the client gets the error details.
    throw new functions.https.HttpsError(
        'failed-precondition',
        'The function must be called while authenticated.',
    );
  }
  // Check if the email is whitelisted
  const allowed = await utils.isWhitelisted(context.auth.token.email);
  if (!allowed) {
    throw new functions.https.HttpsError(
        'failed-precondition',
        `User ${context.auth.token.email} does not have access.`,
    );
  }

  const hits = await utils.search(data.text, context.auth.uid);
  return {'hits': hits};
});
