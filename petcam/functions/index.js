/**
 * Copyright 2021 Google LLC
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
const { default: axios } = require('axios');

admin.initializeApp();
const db = admin.firestore();

async function sendSlack(url, message) {
    let msg = {
      text: message,
    };
    await axios.post(url, msg);
}

exports.sendSlackMessage = functions.firestore
.document('users/{userId}/events/{eventId}')
.onCreate(async (snap, context) => {

    const data = snap.data();

    // Construct a text string describing the event that happened
    let msgString = `Caught event ${data.eventData.length > 1 ? 's' : ''} `;
    msgString += data.eventData.map(event => event.eventType).join(', ') + '.';

    // Check if there's a slack webhook url registered with this user.
    // If so, a slack url will be found in the firestore database
    const doc = await db.doc(`users/${context.params.userId}`).get();
    if (!doc.exists || !doc.data().slack_url) {
        console.log(`No slack url found for user ${context.params.userId}`);
    }

    // Slack url is stored under users/{userId} as slack_url
    const webhook = doc.data().slack_url;
    console.log(`Sending message to webhook ${webhook}`);

    await sendSlack(webhook, msgString);

    console.log('Sent');
});
