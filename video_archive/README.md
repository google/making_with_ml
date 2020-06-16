# AI-Powered Video Archive
![Screenshot of AI Video Archive](./readme_pics/ui_preview.png)

This project builds a AI-Powered Searchable Video Archive on Google Cloud. 
Upload your videos to [Cloud Storage ](cloud.google.com/storage) 
and use this archive to quickly search and explore them. The tool analyzes
videos for objects in images (e.g. "baby," "wedding," "snow"), transcripts,
and on-screen text. 

It's built using the Google Cloud [Video Intelligence API](cloud.google.com/video-intelligence), [Firebase](firebase.com), [Algolia](algolia.com) (for search),
and runs under a frontend built in [Flutter](flutter.dev).

For an in-depth overview, check out [this blog post](https://daleonai.com/building-an-ai-powered-searchable-video-archive).

To run this project yourself, you'll need to get a couple things set up.

## Setting Up an AI-Powered Video Archive

1. First, you'll need to sign up for a couple of accounts, all of which should be free:
- [Google Cloud Platform](cloud.google.com)
- [Firebase](firebase.com)
- [Algolia](algolia.com)

2. [Create a new Firebase project](https://firebase.google.com/docs/storage/web/start) and set it up to support authentication, hosting, functions, and firestore. Make sure to also download and install the Firebase CLI and find your Firebase config, which should look like this:

```
  var firebaseConfig = {
    apiKey: '<your-api-key>',
    authDomain: '<your-auth-domain>',
    databaseURL: '<your-database-url>',
    storageBucket: '<your-storage-bucket-url>'
  };
```

More on Firebase in a second.

3. In `functions/.env_template`, make a copy called `.env`:

```cp functions/.env_template .env```

4. Next you'll need to create some [Storage Buckets](cloud.google.com/storage), as 
described in the file `functions/.env`, for storing your videos,
video metadata (as extracted by the Video Intelligence API), and thumbnails, respectively:

```
VIDEO_BUCKET="BUCKET FOR UPLOADING VIDEOS"
VIDEO_JSON_BUCKET="BUCKET FOR WRITING ANALYSIS JSON"
THUMBNAIL_BUCKET="BUCKET FOR STORING THUMBNAILS"
```

You can create a bucket called `my_sick_video_bucket` by running:

`gsutil mb my_sick_video_bucket`

Once you've created three buckets, update the corresponding variables in your `.env` file.

5. Next you'll need to set up [Algolia](algolia.com), which will handle search queries. If you haven't read [that blog post](https://daleonai.com/building-an-ai-powered-searchable-video-archive) I linked, now would be a good
time.
    - Create a new Algolia search index and name it something like "production_VIDEOS." Fill that value in the corresponding line in your `functions/.env` file.
    - Find your Algolia authentication keys (your search key and your admin api key)
    and fill them in the `.env` file accordingly.

6. Enable the Video Intelligence API in the GCP console (just search "Video Intelligence" in the search box [here](https://console.cloud.google.com/apis/library) and follow the prompts). 

7. Almost done with the backend! If you've got the Firebase CLI installed locally, you can deploy the backend by running:

`firebase deploy`

8. Woo hoo! Check that the backend is working by uploading some video files to 
your video bucket. You can do this using a GUI in the Google Cloud console Storage UI, or in code by running:

`gsutil cp path/to/your/video.mp4 userid/name_of_your_video_bucket_goes_here`

Notice that the way this project is structured, you should create a subfolder
under your video bucket which is userid. This is used to support multiple users.

By default, the video archive doesn't recognize timestamps. However, if you know
when a video was taken, you can pass it along as you upload the video by running the command:

```
gsutil -h "x-goog-meta-timestamp:2002-04-07 12_31_12" -m cp -r your_video gs://your_userid/your_folder
```

It passes along metadata with the video file to indicate when it was filmed.