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

class ThumbGrid extends StatefulWidget {
  final String name;
  final String query;
  final double cardWidth;

  const ThumbGrid(this.name, this.query, this.cardWidth);

  @override
  _ThumbGridState createState() => _ThumbGridState();
}

class _ThumbGridState extends State<ThumbGrid> {
  Future<List<VideoData>> _queryResults;
  @override
  void initState() {
    _queryResults = search(widget.query);
    super.initState();
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
          return Column(children: <Widget>[
            Align(
                alignment: Alignment.centerLeft,
                child: Padding(
                    padding: EdgeInsets.all(15.0),
                    child: Text(widget.name != null ? capitalize(widget.name) : " ",
                        textAlign: TextAlign.left,
                        style: Theme.of(context).textTheme.headline5)
                        )
            ),
            Expanded(
                child: GridView.count(
                  primary: false,
                  padding: const EdgeInsets.all(20),
                  crossAxisSpacing: 10,
                  mainAxisSpacing: 10,
                  crossAxisCount: 3,
                  children: snapshot.hasData
                      ? List.generate(snapshot.data.length, (index) {
                          return ThumbCard(
                              snapshot.data[index], widget.cardWidth);
                        })
                      : List.generate(10, (int index) {
                          return EmptyThumbCard(widget.cardWidth);
                        }),
                ))
          ]);
        });
  }
}
