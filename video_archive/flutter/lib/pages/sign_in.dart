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

/* With help from https://github.com/bizz84/firebase_auth_demo_flutter/blob/master/lib/app/sign_in/sign_in_page.dart */

import 'package:flutter/material.dart';
import 'package:flutter_signin_button/flutter_signin_button.dart';
import 'package:family_videos_flutter/constants.dart' as constants;
import 'package:family_videos_flutter/utils/user.dart' as user;

class SignInPage extends StatelessWidget {
  void _signIn(BuildContext context) async {

    try {
      await user.signInWithGoogle();
    } catch (err) {
      showDialog(
          context: context,
          builder: (BuildContext context) {
            return AlertDialog(
              title: new Text("Couldn't sign in!"),
              content: new Text(err),
              actions: <Widget>[
                // usually buttons at the bottom of the dialog
                new FlatButton(
                  child: new Text("Close"),
                  onPressed: () {
                    Navigator.of(context).pop();
                  },
                ),
              ],
            );
          });
    }
    Navigator.of(context).pushReplacementNamed("/");
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
        appBar: AppBar(title: Text(constants.title)),
        body: Center(
            child: Container(
                height: 50,
                child: SignInButton(Buttons.GoogleDark,
                    onPressed: () => _signIn(context)))));
  }
}
