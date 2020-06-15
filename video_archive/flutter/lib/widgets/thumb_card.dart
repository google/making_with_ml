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

import 'dart:math';
import 'package:family_videos_flutter/utils/string_utils.dart';
import 'package:intl/intl.dart';
import 'package:flutter/material.dart';
import 'package:transparent_image/transparent_image.dart';
import '../pages/watch.dart';
import 'package:family_videos_flutter/utils/search.dart';

final ThemeData thisTheme = ThemeData(
  primaryTextTheme: TextTheme(
    headline6: TextStyle(
        color: Colors.black, fontSize: 72.0, fontWeight: FontWeight.bold),
    bodyText1: TextStyle(
        color: Colors.black, fontSize: 36.0, fontStyle: FontStyle.italic),
    caption: TextStyle(color: Colors.black, fontSize: 14.0, fontFamily: 'Hind'),
  ),
);


class EmptyThumbCard extends StatelessWidget {
  final double cardWidth;
  const EmptyThumbCard(this.cardWidth);

  @override
  Widget build(BuildContext context) {
    return Container(
      width: cardWidth,
      child: Padding(
        padding: const EdgeInsets.all(5),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            AspectRatio(
              aspectRatio: 3 / 2,
              child: Stack(
                children: <Widget>[
                  Container(color: Colors.grey[200]),
                  Center(
                    child: CircularProgressIndicator(backgroundColor: Colors.red[100],),
                  )
                ],
              ),
            ),
            Padding(
                padding: EdgeInsets.fromLTRB(5, 20, 5, 5),
                child: Container(
                    color: Colors.grey[300],
                    width: cardWidth * 0.65,
                    height: 20)),
            Padding(
                padding: EdgeInsets.symmetric(vertical: 5.0, horizontal: 5.0),
                child: Container(
                    color: Colors.grey[300],
                    width: cardWidth * 0.55,
                    height: 20))
          ],
        ),
      ),
    );
  }
}

class ThumbCard extends StatelessWidget {
  final VideoData videoData;
  final double cardWidth;

  const ThumbCard(this.videoData, this.cardWidth);

  const ThumbCard.empty(this.cardWidth) : videoData = null;

  Future<void> _onTap(BuildContext context) async {
    await Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) =>
              WatchPage(this.videoData.videoUrl, this.videoData.filename),
          fullscreenDialog: true,
        ));
  }

  String entitiesString({maxEntities: 10}) {
    if (videoData.entities.isEmpty) return " ";
    return videoData.entities
        .map((dynamic entity) {
          entity = entity.toString();
          return capitalize(entity);
        })
        .toList()
        .sublist(0, min(videoData.entities.length, maxEntities))
        .join(', ');
  }

  String timestampString() {
    return (videoData.timestampGuess ? "Around " : "") +
        DateFormat("MMMM d, yyyy").format(videoData.timestamp);
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
        onTap: () async => {await _onTap(context)},
        child: Container(
          width: cardWidth,
          child: Padding(
            padding: const EdgeInsets.all(5),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                ThumbImage(videoData.thumbnailUrl),
                Padding(
                    padding: EdgeInsets.fromLTRB(5, 20, 5, 5),
                    child: Text(timestampString(),
                        style: Theme.of(context).textTheme.headline6)),
                Padding(
                    padding:
                        EdgeInsets.symmetric(vertical: 5.0, horizontal: 5.0),
                    child: Text(entitiesString(),
                        style: Theme.of(context).textTheme.caption)),
              ],
            ),
          ),
        ));
  }
}

class ThumbImage extends StatelessWidget {
  final String imageUrl;
  ThumbImage(this.imageUrl) : assert(imageUrl != null);

  @override
  Widget build(BuildContext context) {
    return AspectRatio(
        aspectRatio: 3 / 2,
        child: Stack(
          children: <Widget>[
            Center(child: CircularProgressIndicator()),
            Positioned.fill(
              child: FadeInImage.memoryNetwork(
                placeholder: kTransparentImage,
                image: imageUrl,
                fit: BoxFit.cover,
              ),
            ),
          ],
        ));
  }
}
