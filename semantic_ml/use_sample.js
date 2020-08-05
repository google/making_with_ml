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

require('@tensorflow/tfjs');
const encoder = require('@tensorflow-models/universal-sentence-encoder');


// Utils for handling vectors
// Functions below taken from https://www.npmjs.com/package/@tensorflow-models/universal-sentence-encoder

// zipWith :: (a -> b -> c) -> [a] -> [b] -> [c]
const zipWith =
    (f, xs, ys) => {
      const ny = ys.length;
      return (xs.length <= ny ? xs : xs.slice(0, ny))
          .map((x, i) => f(x, ys[i]));
    }

// Calculate the dot product of two vector arrays.
const dotProduct = (xs, ys) => {
  const sum = xs => xs ? xs.reduce((a, b) => a + b, 0) : undefined;
 
  return xs.length === ys.length ?
    sum(zipWith((a, b) => a * b, xs, ys))
    : undefined;
}

// Given a model, a query (i.e. "I want some coffee"), and
// an array of responses (["Brings you mug", "Goes to sleep"]),
// returns responses ranked by best reply.
async function getRankedResponses(model, query, responses) {
  const input = {
    queries: [query],
    responses: responses
  };

  const embeddings = await model.embed(input);

  // We use just one query input
  const inputTensor = embeddings['queryEmbedding'].arraySync()[0];

  const responseTensors = embeddings['responseEmbedding'].arraySync();

  let scores = [];
  for(let i = 0; i < responseTensors.length; i++) {
    scores.push({
      response: responses[i],
      score: dotProduct(inputTensor, responseTensors[i])
    });
  }

  scores = scores.sort((el1, el2) => { el2 - el1});

  return scores;
}

async function main() {
  const query = "I want some coffee";
  const responses = [
    "I grab a ball",
    "I go to you",
    "I play with a ball",
    "I go to school.",
    "I go to the mug.",
    "I bring you the mug."
  ];
  const model = await encoder.loadQnA();
  const sortedResponses = await getRankedResponses(model, query, responses);
  console.log(sortedResponses);
}

main();