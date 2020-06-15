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

import 'dart:async';

import 'package:family_videos_flutter/utils/user.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';

class PageContainer extends StatefulWidget {
  final Widget child;
  PageContainer(this.child);

  @override
  PageContainerState createState() => PageContainerState();
}

class PageContainerState extends State<PageContainer> {
  bool _loggedIn = false;
  StreamSubscription<FirebaseUser> subscription;
  @override
  void initState() {
    super.initState();
    subscription = onAuthStateChanged.listen((FirebaseUser user) {
      if (user == null || user.uid == null) {
        Navigator.of(context).pushReplacementNamed("login");
      }
      else {
        setState(() { _loggedIn = true; });
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return _loggedIn
        ? widget.child
        : Center(child: CircularProgressIndicator());
  }

  @override
  void dispose() {
    super.dispose();
    subscription.cancel();
  }
}
