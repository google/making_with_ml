# ML-Powered Translation Dubber

In this directory, you'll find code that takes a movie and:
- Transcribes it and adds captions
- Translates those captions
- "Dubs" the movie in a new language with computer voices

After doing the setup described below, you should be able to run:

`python dubber.py my_movie_file.mp4 "en" outputDirectory --targetLangs ["en", "es"]`

to produce a new movie file dubbed in the languages specified in `targetLang`. 


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

6. Install the python dependencies:

        pip install -r requirements.txt

7. Viola! You should be good to go.