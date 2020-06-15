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

require('array.prototype.flatmap/auto');
const algolia = require('./algolia.js');
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const os = require('os');
// Handles preview image generation
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);

require('dotenv').config();

/* Check if a user is whitelisted. Don't give any
users not on the Firebase whitelist access to the app */
exports.isWhitelisted = async function(email) {
  const record = await admin
      .firestore()
      .collection('whitelist')
      .doc(email)
      .get();
  return record.exists;
};

/* Given a GCS file, generatet a temporary link to it */
async function getLink(bucket, fileName) {
  // Make a temporary link to
  const blob = admin.storage().bucket(bucket).file(fileName);
  const [exists] = await blob.exists();
  if (!exists) return null;

  const [url] = await blob.getSignedUrl({
    version: 'v4',
    action: 'read',
    expires: Date.now() + 24 * 60 ** 2 * 1000, // 24 hours
  });
  return url;
}
exports.getLink = getLink;

/* Given a video id, return data about it, including
temporary links to the video and thumbnail files */
async function getVideoDataById(videoId, userId) {
  const doc = await admin
      .firestore()
      .collection('users')
      .doc(userId)
      .collection('videos')
      .doc(videoId)
      .get();

  if (!doc.exists) {
    console.log(`Document ${userId}/${videoId} does not exist`);
    return null;
  }

  const data = await doc.data();
  if (data.status != 'finished') {
    console.log(`Got document status ${data.status}`);
    return null;
  }

  let videoLink = '';
  let thumbLink = '';

  try {
    videoLink = await getLink(
        process.env.VIDEO_BUCKET,
        data['filePath'],
    );
  } catch (err) {
    console.log(`Couldn't grab video link for ${data['filePath']}`);
  }
  try {
    thumbLink = await getLink(
        process.env.THUMBNAIL_BUCKET,
        data['thumbnail'],
    );
  } catch (err) {
    console.log(`Couldn't grab thumbnail link for ${data['thumbnail']}`);
  }

  let entities = [];
  try {
    entities = await getEntities(videoId, userId);
  } catch (err) {
    console.log(`Could not grab entities for movie: ${err}`);
  }
  return {
    videoId: videoId,
    entities: entities,
    timestamp: data['videoTimestamp'],
    timestampGuess: data['timestampGuess'],
    video: videoLink,
    thumbnail: thumbLink,
  };
}

exports.search = async function(query, userid) {
  // hitIds are the video ids of matching files
  const hitIds = await algolia.search(query, userid);
  let res = await Promise.all(
      hitIds.map(async (hits) => {
        const videoData = await getVideoDataById(hits.videoId, hits.userId);
        return videoData;
      }),
  );
  res = res.filter((data) => data);
  res.sort((a, b) => {
    if (a.timestamp && b.timestamp) return a.timestamp - b.timestamp;
    return 1;
  });
  return res;
};

/* Creates a preview image from the file at inFilePath written
to outDirectory and outFile */
exports.makePreviewImage = function(
    inFilePath,
    outDir,
    outFileName,
    width = 500,
    timeMark = '33%',
) {
  const cmd = ffmpeg(inFilePath)
      .screenshots({
        count: 1,
        timemarks: [timeMark],
        size: `${width}x?`,
        folder: outDir,
        filename: outFileName,
      })
      .frames(1);

  return new Promise((resolve, reject) => {
    cmd.on('end', resolve);
    cmd.on('error', reject);
  });
};

/* Parse date from timestamp. This function uses regular expressions
to match common time formats. It may not work on your data formats.
Specifically it supports the format 'year-month-day hour_minute_second' */
exports.parseDate = function(dateString) {
  //  "._clip-2006-12-29 17;08;05.mp4"
  let year; let month; let day; let hours; let seconds; let minutes;

  const regExs = [
    /_clip-(\d+)-(\d+)-(\d+) (\d+);(\d+);(\d+)/,
    /(\d+)-(\d+)-(\d+) (\d+)_(\d+)_(\d+)/,
    /(\d+)-(\d+)-(\d+)/,
  ];

  for (let i = 0; i < regExs.length; i++) {
    if (dateString.match(regExs[i])) {
      [year, month, day, hours, seconds, minutes] = dateString
          .match(regExs[i])
          .slice(1);
      break;
    }
  }
  if (!(year && month && day)) {
    console.log(`Could not find regex to match date string: '${dateString}'`);
    return;
  }
  if (hours != null && minutes != null && seconds != null) {
    return Date.parse(
        `${year}-${month}-${day} ${hours}:${minutes}:${seconds} EST`,
    );
  }
  return Date.parse(`${year}-${month}-${day}`);
};

/* Functions for parsing Video Intelligence JSON Output */
function parseTranscript(jsonBlob) {
  return jsonBlob.annotation_results
      .filter((annotation) => {
      // Ignore annotations without speech transcriptions
        return annotation.speech_transcriptions;
      })
      .flatMap((annotation) => {
      // Sometimes transcription options are empty, so remove those
        return annotation.speech_transcriptions
            .filter((transcription) => {
              return Object.keys(transcription.alternatives[0]).length;
            })
            .map((transcription) => {
              // We always want the first transcription alternative
              const alternative = transcription.alternatives[0];
              // Streamline the json so we have less to store
              return {
                text: null,
                entity: null,
                transcript: alternative.transcript,
                confidence: alternative.confidence,
                start_time: alternative.words[0].start_time,
                words: alternative.words.map((word) => {
                  return {
                    start_time: word.start_time.seconds || 0,
                    end_time: word.end_time.seconds,
                    word: word.word,
                  };
                }),
              };
            });
      });
}
exports.parseTranscript = parseTranscript;

/* Image labels (i.e. snow, baby laughing, bridal shower)*/
function parseShotLabelAnnotations(jsonBlob) {
  return jsonBlob.annotation_results
      .filter((annotation) => {
      // Ignore annotations without shot label annotations
        return annotation.shot_label_annotations;
      })
      .flatMap((annotation) => {
        return annotation.shot_label_annotations.flatMap((annotation) => {
          return annotation.segments.flatMap((segment) => {
            return {
              text: null,
              transcript: null,
              entity: annotation.entity.description,
              confidence: segment.confidence,
              start_time: segment.segment.start_time_offset.seconds || 0,
              end_time: segment.segment.end_time_offset.seconds,
            };
          });
        });
      });
}
exports.parseShotLabelAnnotations = parseShotLabelAnnotations;

/* Text shown on screen in videos, i.e. street sign text */
function parseTextAnnotations(jsonBlob) {
  return jsonBlob.annotation_results
      .filter((annotation) => {
      // Ignore annotations without text annotations
        return annotation.text_annotations;
      })
      .flatMap((annotation) => {
        return annotation.text_annotations.flatMap((annotation) => {
          return annotation.segments.flatMap((segment) => {
            return {
              transcript: null,
              entity: null,
              text: annotation.text,
              confidence: segment.confidence,
              start_time: segment.segment.start_time_offset.seconds || 0,
              end_time: segment.segment.end_time_offset.seconds,
            };
          });
        });
      });
}

/* Given a videoId and a userId, gets image labels found in a photo. */
async function getEntities(videoId, userId) {
  const fileId = `${Math.floor(Math.random() * 1000000)}.json`;
  const tempPath = path.join(os.tmpdir(), fileId);
  const cloudFile = admin
      .storage()
      .bucket(process.env.VIDEO_JSON_BUCKET)
      .file(`${userId}/${videoId}.json`);
  const exists = await cloudFile.exists();
  if (!exists) {
    throw new Error(`File ${userId}/${videoId}.json does not exist`);
  }
  await cloudFile.download({
    destination: tempPath,
  });
  const rawdata = fs.readFileSync(tempPath);
  const jsonBlob = JSON.parse(rawdata);
  const entities = parseShotLabelAnnotations(jsonBlob).map((blob) => {
    return blob.entity;
  });
  fs.unlinkSync(tempPath);
  return [...new Set(entities)];
}
exports.getEntities = getEntities;

exports.parseTextAnnotations = parseTextAnnotations;
