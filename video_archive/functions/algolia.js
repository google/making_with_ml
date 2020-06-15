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

/* The code in this file handles interaction with Algolia (algolia.com),
a third-party search tool */

const algoliasearch = require('algoliasearch');
const encode = require('hashcode').hashCode;
require('dotenv').config();

exports.getKey = async function(userid) {
  const params = {
    // This filter ensures that only documents
    // where author == user_id will be readable
    filters: userid,
    // We also proxy the user_id as a unique token for this key.
    userToken: userid,
  };

  const client = algoliasearch(
      process.env.ALGOLIA_APPID,
      process.env.ALGOLIA_ADMIN_APIKEY,
  );

  // Call the Algolia API to generate a unique key based on our search key
  const key = await client.generateSecuredApiKey(
      process.env.ALGOLIA_SEARCH_KEY,
      params,
  );
  return key;
};

exports.search = async function(query, userid) {
  /* In Algolia, we associatete records with users by storing
  userid as a tag. Here, we userids from algolia records */
  function _getUserid(tags) {
    return tags.filter((tag) => {
      return tag != 'transcript' && tag != 'entity' && tag != 'text';
    })[0];
  }
  const client = algoliasearch(
      process.env.ALGOLIA_APPID,
      process.env.ALGOLIA_ADMIN_APIKEY,
  );
  const index = client.initIndex(process.env.ALOGLIA_INDEX);
  const res = await index.search(query, {
    tagFilters: [userid],
    attributesToRetrieve: ['videoId', 'transcript', 'text', 'entity', '_tags'],
  });
  if (!res.nbHits) return [];
  return res.hits
      .filter((hit, index) => {
        return res.hits.findIndex((h) => h.videoId == hit.videoId) == index;
      })
      .map((hit) => {
        return {videoId: hit['videoId'], userId: _getUserid(hit['_tags'])};
      });
};

exports.save = async function(
    userId,
    videoId,
    transcriptJson,
    shotLabelJson,
    textJson,
    timestamp,
) {
  function _generateId(obj, annotationType) {
    // A unique ID to prevent duplicates
    return Math.abs(
        encode().value(
            videoId.toString() +
          (obj.text || obj.entity || obj.transcript) +
          obj.start_time +
          annotationType,
        ),
    );
  }

  const client = algoliasearch(
      process.env.ALGOLIA_APPID,
      process.env.ALGOLIA_ADMIN_APIKEY,
  );
  const index = client.initIndex(process.env.ALOGLIA_INDEX);
  console.log(
      `Createtd algolia index client for index ${process.env.ALOGLIA_INDEX}`,
  );

  // Adding tags lets us restrict values by user, and search by annotation type.
  function _addMeta(inJson, annotationType) {
    return inJson.map((obj) => {
      return {
        ...obj,
        _tags: [userId, annotationType],
        videoId: videoId,
        timestamp: timestamp,
        objectID: _generateId(obj, annotationType),
      };
    });
  }

  // Add userid and category tag
  // Save them to Algolia
  try {
    await index.saveObjects(_addMeta(transcriptJson, 'transcript'));
  } catch (err) {
    console.log(err);
  }
  await index.saveObjects(_addMeta(shotLabelJson, 'shots'));
  await index.saveObjects(_addMeta(textJson, 'text'));
};
