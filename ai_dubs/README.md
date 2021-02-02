# ML-Powered Translation Dubber

In this directory, you'll find code that takes a movie and:
- Transcribes it and adds captions
- Translates those captions
- "Dubs" the movie in a new language with computer voices

After completing the setup described below, you should be able to run:

        python dubber.py my_movie_file.mp4 "en" outputDirectory --targetLangs '["ja", "es"]'

to produce a new movie file dubbed in the languages specified in `targetLang`. 

_Find a bug? Let me know! I appreciate it._

## Setup

1. Create a new Google Cloud Project.

2. Enable these Google Cloud APIs:

- Speech-to-Text
- Text-to-Speech
- Translation

From the command line, run:
        
        gcloud services enable texttospeech.googleapis.com translate.googleapis.com speech.googleapis.com    

3. [Create a new service account](https://cloud.google.com/iam/docs/creating-managing-service-accounts) with the `Translation Admin` permission and download it to this directory. Set the environmental variable `GOOGLE_APPLICATION_CREDENTIALS` to point to your key file:

            export "GOOGLE_APPLICATION_CREDENTIALS" = "./path_to_key.json"

4. Create a new Google Cloud Storage bucket. We'll need this to store data temporarily while interacting with the Speech API:

        gsutil mkdir MY_BUCKET_NAME

4. Make a copy of the file `.env_template`:

        cp .env_template .env
    
And edit `.env`, filling in your own values for project id and bucket.

6. Create a virtualenv:

        python3 -m venv venv
        source ./venv/bin/activate

7. Install the python dependencies:

        pip install -r requirements.txt

8. Viola! You should be good to go.

        python dubber.py my_movie_file.mp4 "en" outputDirectory --targetLangs '["ja", "es"]'

## Command Line Options

`dubber.py` supports the following command line args:

    Args:
        videoFile (String): File to dub
        outputDir (String): Directory to write output files
        srcLang (String): Language code to translate from (i.e. "fi")
        targetLangs (list, optional): Languages to translate too, i.e. ["en", "fr"]
        storageBucket (String, optional): GCS bucket for temporary file storage. Defaults to None.
        phraseHints (list, optional): "Hints" for words likely to appear in audio. Defaults to [].
        dubSrc (bool, optional): Whether to generate dubs in the source language. Defaults to False.
        speakerCount (int, optional): How many speakers in the video. Defaults to 1.
        voices (dict, optional): Which voices to use for dubbing, i.e. {"en": "en-AU-Standard-A"}. Defaults to {}.
        srt (bool, optional): Path of SRT transcript file, if it exists. Defaults to False.
        newDir (bool, optional): Whether to start dubbing from scratch or use files in outputDir. Defaults to False.
        genAudio (bool, optional): Generate new audio, even if it's already been generated. Defaults to False.
        noTranslate (bool, optional): Don't translate. Defaults to False.

Use the option `--dubSrc` to generate a dubbed version of the video in the source language (i.e. without translation).

To change the computer voice used in dubs, find the name of a supported voice [here](https://cloud.google.com/text-to-speech/docs/voices) and pass it to the tool as a dictionary:

        python dubber.py my_movie_file.mp4 "en" outputDirectory --targetLangs '["ja", "es"]' --voices '{"ja": "ja-JP-Standard-A	", "es": "es-ES-Standard-A"}'

Pass an array of words with the `phraseHints` flag to increase the likelihood those words are recognized in the source video:

        python dubber.py my_movie_file.mp4 "en" outputDirectory --targetLangs '["ja", "es"]' --phraseHints '["Dale", "Machine Learning", "AutoML"]'

