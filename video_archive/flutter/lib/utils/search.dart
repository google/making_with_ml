// Copyright 2020 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

//import 'package:flutter/material.dart';
import 'package:cloud_functions/cloud_functions.dart';

class VideoData {
  final String filename;
  final String thumbnailUrl;
  final String videoUrl;
  final DateTime timestamp;
  final List<dynamic> entities;
  final bool timestampGuess;

  VideoData(this.filename, this.thumbnailUrl, this.videoUrl, int timestamp, this.timestampGuess, this.entities)
      : timestamp = timestamp != null
            ? DateTime.fromMillisecondsSinceEpoch(timestamp, isUtc: true)
            : null;
}

Future<List<VideoData>> search(String query) async {
  final HttpsCallable callable = CloudFunctions.instance
      .getHttpsCallable(functionName: 'search')
        ..timeout = const Duration(seconds: 60);
  try {
    final HttpsCallableResult result = await callable.call(
      <String, dynamic>{'text': query},
    );
    final List<VideoData> response = result.data['hits'].map<VideoData>((hit) {
      bool timestampGuess = hit["timestampGuess"] == null ? false : hit["timestampGuess"];
      return VideoData(hit["filepath"], hit["thumbnail"], hit["video"], hit["timestamp"], timestampGuess, hit["entities"]);
    }).toList();
    return response;
  } catch (err) {
    print('Error in search! $err');
    return null;
  }
}