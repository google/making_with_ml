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

import 'package:family_videos_flutter/utils/string_utils.dart';
import 'package:flutter/material.dart';
import './thumb_card.dart';
import 'package:family_videos_flutter/utils/search.dart';

class ThumbCarousel extends StatefulWidget {
  final String name;
  final String query;
  final double cardWidth;

  const ThumbCarousel(this.name, this.query, this.cardWidth);

  @override
  _ThumbCarouselState createState() => _ThumbCarouselState();
}

class _ThumbCarouselState extends State<ThumbCarousel> {
  Future<List<VideoData>> _queryResults;
  @override
  void initState() {
    super.initState();
    _queryResults = search(widget.query);
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<VideoData>>(
        future: _queryResults,
        builder:
            (BuildContext context, AsyncSnapshot<List<VideoData>> snapshot) {
          if (snapshot.hasError) {
            return SizedBox(
                child: Icon(
              Icons.error_outline,
              color: Colors.red,
              size: 60,
            ));
          }
          return _CarouselColumn(widget.name, snapshot.data, widget.cardWidth);
        });
  }
}

class _CarouselColumn extends StatelessWidget {
  final String name;
  final List<VideoData> data;
  final double cardWidth;
  _CarouselColumn(this.name, this.data, this.cardWidth);

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: <Widget>[
      Align(
          alignment: Alignment.centerLeft,
          child: Padding(
              padding: EdgeInsets.all(15.0),
              child: Text(name != null ? capitalize(name) : " ",
                  textAlign: TextAlign.left,
                  style: Theme.of(context).textTheme.headline5))),
      Container(
        // TODO: A fixed height means sometimes content will overflow. 
        // This should not be a listview
        height: 400,
        child: ListView.builder(
            shrinkWrap: true,
            scrollDirection: Axis.horizontal,
            itemCount: data?.length ??
                10, // If there are no items, just have 10 filers
            itemBuilder: (context, index) {
              return data != null
                  ? ThumbCard(data[index], cardWidth)
                  : EmptyThumbCard(cardWidth);
            }),
      )
    ]);
  }
}
