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

import 'package:firebase_auth/firebase_auth.dart';
import 'package:google_sign_in/google_sign_in.dart';

enum LoginState {
  loggedIn, loggedOut, loading
}

Stream<FirebaseUser> onAuthStateChanged  = FirebaseAuth.instance.onAuthStateChanged;

Future<bool> loggedIn() async {
  final FirebaseUser user = await FirebaseAuth.instance.currentUser();
  return user != null;
}

Future<FirebaseUser> signInWithGoogle() async {
  print("hello sign in");
  final GoogleSignIn googleSignIn = GoogleSignIn();
  final GoogleSignInAccount googleUser = await googleSignIn.signIn();
  print("Completed google sign in");

  if (googleUser == null) {
    print("Hello null google user");
    throw Exception("User aborted sign ins");
  }

  final GoogleSignInAuthentication googleAuth = await googleUser.authentication;
  print("Grabbed google auth");
  final AuthCredential credential = GoogleAuthProvider.getCredential(
    idToken: googleAuth.idToken,
    accessToken: googleAuth.accessToken,
  );

  print("Trying to sign in with Google");
  AuthResult authResult;
  authResult = await FirebaseAuth.instance
  .signInWithCredential(credential);

  if(authResult.user == null) {
    throw Exception("Couldn't get valid firebase user");
  }

  // TODO: Check if user is whitelisted in Firestore.
  print("Signed in");
  return authResult.user;
}

Future<void> signOut() async {
  try {
      await FirebaseAuth.instance.signOut();
      print("Signed out");
  } catch(err) {
    print("Error " + err);
  }
}
