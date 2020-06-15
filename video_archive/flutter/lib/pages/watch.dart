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

import 'package:chewie/chewie.dart';
import 'package:family_videos_flutter/widgets/custom_app_bar.dart';
import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';

class WatchPage extends StatelessWidget {
  final String url, title;
  WatchPage(this.url, this.title);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
        appBar: CustomAppBar(), body: BodyLayout(VideoViewer(url, title)));
  }
}

class BodyLayout extends StatelessWidget {
  final VideoViewer viewer;
  BodyLayout(this.viewer);

  @override
  Widget build(BuildContext context) {
    return Column(
      children: <Widget>[
        Expanded(
          child: Center(child: viewer),
        )
      ],
    );
  }
}

class VideoViewer extends StatefulWidget {
  final String url, title;
  VideoViewer(this.url, this.title);

  @override
  State<StatefulWidget> createState() {
    return _VideoViewerState();
  }
}

class _VideoViewerState extends State<VideoViewer> {
  VideoPlayerController _videoPlayerController;
  ChewieController _chewieController;
  @override
  void initState() {
    super.initState();
    _videoPlayerController = VideoPlayerController.network(widget.url);
    _chewieController = ChewieController(
        videoPlayerController: _videoPlayerController,
        allowFullScreen: false,
        autoPlay: false,
        showControls: true,
        autoInitialize: true);
  }

  @override
  void dispose() {
    _videoPlayerController.dispose();
    _chewieController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Chewie(
      controller: _chewieController,
    );
  }
}

void showWatchDialog(BuildContext context, String url, [String title]) {
  assert(context != null && url != null);
  showDialog<void>(
    context: context,
    builder: (context) {
      return WatchDialog(url, title);
    },
  );
}

class WatchDialog extends StatelessWidget {
  final String url;
  final String title;
  WatchDialog(this.url, this.title);

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text(title != null ? title : " "),
      content: Container(
          width: 1000, 
          child: VideoViewer(this.url, this.title)
        ),
      actions: <Widget>[
        FlatButton(
          child: Text('Back'),
          onPressed: () {
            Navigator.of(context).pop();
          },
        ),
      ],
    );
  }
}
