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

import 'package:flutter/material.dart';
import '../widgets/thumb_carousel.dart';
import '../widgets/custom_app_bar.dart';
import 'package:family_videos_flutter/constants.dart';

class HomePage extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final List<ThumbCarousel> carousels =
              PRESET_QUERIES.map<ThumbCarousel>((String query) {
            return ThumbCarousel(query, query, 400);
          }).toList();
    return Scaffold(
        appBar: CustomAppBar(),
        body: BodyLayout(carousels)
    );
  }
}

class BodyLayout extends StatelessWidget {
  final List<ThumbCarousel> carousels;
  BodyLayout(this.carousels);

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      child: Column(children: carousels),
    );
  }
}
