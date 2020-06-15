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

import 'package:family_videos_flutter/pages/search_results.dart';
import 'package:family_videos_flutter/constants.dart' as constants;
import 'package:family_videos_flutter/utils/user.dart';
import 'package:flutter/material.dart';

class CustomAppBar extends StatefulWidget with PreferredSizeWidget {

  CustomAppBar({Key key}) : super(key: key);

  @override
  _CustomAppBarState createState() => _CustomAppBarState();

  @override
  Size get preferredSize => Size.fromHeight(kToolbarHeight);
}

class _CustomAppBarState extends State<CustomAppBar> {
  void _onFormSubmitted(String value, BuildContext context) async {
    if(value.trim().isEmpty) return;
    final String routeName = Uri.encodeFull("/search/$value");
    final MaterialPageRoute newRoute = MaterialPageRoute(
        settings: RouteSettings(name: routeName),
        builder: (context) => SearchPage(value), fullscreenDialog: true);
    await Navigator.pushAndRemoveUntil(context, newRoute, (route) => route.isFirst);
  }

  @override
  Widget build(BuildContext context) {
    return AppBar(
      title: Text(constants.title),
      actions: <Widget>[
        SearchBar(
          onSubmit: (String value) => _onFormSubmitted(value, context),
        ),
        FlatButton(
          child: const Text('Sign out'),
          textColor: Theme.of(context).buttonColor,
          onPressed: () async {
            await signOut();
            Scaffold.of(context).showSnackBar(SnackBar(
              content: Text('Successfully signed out.'),
            ));
          },
        )
      ],
    );
  }
}

class SearchBar extends StatefulWidget {
  final void Function(String) onSubmit;

  SearchBar({
    Key key,
    this.onSubmit,
  }) : super(key: key);

  @override
  _SearchBarState createState() => _SearchBarState();
}

class _SearchBarState extends State<SearchBar> {
  TextEditingController _controller;
  void Function(String) _onSubmit;

  void initState() {
    super.initState();
    _controller = TextEditingController();
    _onSubmit = widget.onSubmit;
  }

  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
        width: 500,
        alignment: Alignment.centerLeft,
        child: TextField(
          //autofocus: true,
          // set cursor color
          style: Theme.of(context)
              .textTheme
              .bodyText1
              .copyWith(color: Colors.white),
          cursorColor: Colors.white,
          decoration: InputDecoration(
            // parameters for different states
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(4),
              borderSide: const BorderSide(
                width: 0,
                style: BorderStyle.none,
              ),
            ),
            contentPadding: const EdgeInsets.all(16),
            filled: true,
            hintStyle: Theme.of(context).textTheme.bodyText1.copyWith(color: Colors.white),
            hintText: constants.searchHintText,
            floatingLabelBehavior: FloatingLabelBehavior.never,
            prefixIcon: Icon(
              Icons.search,
              size: 24,
              color: Colors.white,
            ),
          ),
          controller: _controller,
          onSubmitted: (String input) {
            _controller.clear();
            _onSubmit(input);
          },
        ));
  }
}
