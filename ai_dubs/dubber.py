# Copyright 2021 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.


from google.cloud import speech_v1p1beta1 as speech
from google.cloud import texttospeech
from google.cloud import translate_v2 as translate
from google.cloud import storage
from pydub import AudioSegment
from moviepy.editor import VideoFileClip, AudioFileClip
import os
import ffmpeg
import time
import json
import sys
import tempfile
import uuid
from dotenv import load_dotenv
import fire

# Load config in .env file
load_dotenv()

# This function comes from https://github.com/kkroening/ffmpeg-python/blob/master/examples/transcribe.py
# def decode_audio(fileName):
#     """Extracts audio from a video file

#     Args:
#         fileName (String): Path to video file

#     Returns:
#         Blob: audio blob | Error
#     """
#     try:
#         out, err = (ffmpeg
#                     .input(fileName)
#                     .output('-', format='s16le', acodec='pcm_s16le', ac=1, ar='16k')
#                     .overwrite_output()
#                     .run(capture_stdout=True, capture_stderr=True)
#                     )
#     except ffmpeg.Error as e:
#         print(e.stderr, file=sys.stderr)
#         sys.exit(1)
#     return out

def decode_audio(inFile, outFile):
    if not outFile[-4:] != "wav":
        outFile += ".wav"
    AudioSegment.from_file(inFile).set_channels(1).export(outFile, format="wav")

def get_transcripts_json(gcsPath, langCode, phraseHints=[], speakerCount=None):
    """Transcribes audio files.

    Args:
        gcsPath (String): path to file in cloud storage (i.e. "gs://audio/clip.mp4")
        langCode (String): language code (i.e. "en-US", see https://cloud.google.com/speech-to-text/docs/languages)
        phraseHints (String[]): list of words that are unusual but likely to appear in the audio file.
        speakerCount (int, optional): Number of speakers in the audio. Only works on English. Defaults to None.

    Returns:
        list | Operation.error
    """

    # Helper function for simplifying Google speech client response
    def _jsonify(result):
        json = []
        for section in result.results:
            data = {
                "transcript": section.alternatives[0].transcript,
                "words": []
            }
            for word in section.alternatives[0].words:
                data["words"].append({
                    "word": word.word,
                    "start_time": word.start_time.total_seconds(),
                    "end_time": word.end_time.total_seconds(),
                    "speaker_tag": word.speaker_tag
                })
            json.append(data)
        return json

    client = speech.SpeechClient()
    audio = speech.RecognitionAudio(uri=gcsPath)

    config = speech.RecognitionConfig(
        enable_automatic_punctuation=True,
        enable_word_time_offsets=True,
        language_code=langCode,
        speech_contexts=[{
            "phrases": phraseHints
        }]
    )
    res = client.long_running_recognize(config=config, audio=audio).result()

    return _jsonify(res)


def parse_sentence_with_speaker(json):
    """Takes json from get_transcripts_json and breaks it into sentences
    spoken by a single person.

    Args:
        json (string[]): [{"transcript": "lalala", "words": [{"word": "la", "start_time": 20, "end_time": 21, "speaker_tag: 2}]}]

    Returns:
        string[]: [{"sentence": "lalala", "speaker": 1, "start_time": 20, "end_time": 21}]
    """

    punctuation = ['.', '!', '?']
    sentences = []
    sentence = {}
    for result in json:
        for word in result['words']:
            if not sentence:
                sentence = {
                    'sentence': [word['word']],
                    'speaker': word['speaker_tag'],
                    'start_time': word['start_time'],
                  'end_time': word['end_time']
                }
            # If we have a new speaker, save the sentence and create a new one:
            elif word['speaker_tag'] != sentence['speaker']:
                sentence['sentence'] = ' '.join(sentence['sentence'])
                sentences.append(sentence)
                sentence = {
                    'sentence': [word['word']],
                    'speaker': word['speaker_tag'],
                    'start_time': word['start_time'],
                  'end_time': word['end_time']
                }
            else:
                sentence['sentence'].append(word['word'])
                sentence['end_time'] = word['end_time']

            if word['word'][-1] in punctuation:
                sentence['sentence'] = ' '.join(sentence['sentence'])
                sentences.append(sentence)
                sentence = {}
        if sentence:
            sentence['sentence'] = ' '.join(sentence['sentence'])
            sentences.append(sentence)
            sentence = {}

    return sentences


def translate_text(input, targetLang, sourceLang=None):
    """Translates from sourceLang to targetLang. If sourceLang is empty,
    it will be auto-detected.

    Args:
        sentence (String): Sentence to translate
        targetLang (String): i.e. "en"
        sourceLang (String, optional): i.e. "es" Defaults to None.

    Returns:
        String: translated text
    """

    translate_client = translate.Client()
    result = translate_client.translate(input, target_language=targetLang, source_language=sourceLang)

    def _replace_artifacts(text):
        return text.replace("&#39;", "'")

    return _replace_artifacts(result['translatedText'])


def speak(text, languageCode):
    """Converts text to audio

    Args:
        text (String): Text to be spoken
        languageCode (String): Language (i.e. "en")

    Returns:
        bytes : Audio in wav format
    """

    # Instantiates a client
    client = texttospeech.TextToSpeechClient()

    # Set the text input to be synthesized
    synthesis_input = texttospeech.SynthesisInput(text=text)

    # Build the voice request, select the language code ("en-US") and the ssml
    # voice gender ("neutral")
    voice = texttospeech.VoiceSelectionParams(
        language_code=languageCode, ssml_gender=texttospeech.SsmlVoiceGender.NEUTRAL
    )

    # Select the type of audio file you want returned
    audio_config = texttospeech.AudioConfig(
        audio_encoding=texttospeech.AudioEncoding.MP3
    )

    # Perform the text-to-speech request on the text input with the selected
    # voice parameters and audio file type
    response = client.synthesize_speech(
        input=synthesis_input, voice=voice, audio_config=audio_config
    )
    return response.audio_content


# TODO
def to_srt(chunks, start_times, end_times, outfile):
    """Converts transcripts to SRT an SRT file.

    Args:
        chunks (string[]): Sentence or sentence parts
        start_times ([type]): [description]
        end_times ([type]): [description]

    Returns:
        [type]: [description]
    """

    """
    SRT files have this format:

    [Section of subtitles number]

    [Time the subtitle is displayed begins] –> [Time the subtitle is displayed ends]

    [Subtitle]

    Timestamps are in the format:

    [hours]: [minutes]: [seconds], [milliseconds]

    Note: about 60 characters comfortably fit on one line
    for resolution 1920x1080 with font size 40 pt.
    """

    def _srt_time(seconds):
        millisecs = seconds * 1000
        seconds, millisecs = divmod(millisecs, 1000)
        minutes, seconds = divmod(seconds, 60)
        hours, minutes = divmod(minutes, 60)
        return "%d:%d:%d,%d" % (hours, minutes, seconds, millisecs)

    def _to_srt(sentences):
        out = []
        for i, sentence in enumerate(sentences):
            out.append(str(i + 1))
            out.append(srtTime(sentence['start_time']) +
                       " --> " + srtTime(sentence["end_time"]))
            out.append(sentence['sentence'])
            out.append('\n')
        return '\n'.join(out)
    pass


def stitch_audio(sentences, audioDir, movieFile, outFile, overlayGain=-18):
    
    # Files in the audioDir should be labeled 0.wav, 1.wav, etc.
    audioFiles = os.listdir(audioDir)
    audioFiles.sort()
    
    # Grab the computer-generated audio file
    segments = [AudioSegment.from_mp3(os.path.join(audioDir, x)) for x in audioFiles]
    # Also, grab the original audio
    dubbed = AudioSegment.from_file(movieFile)

    # Place each computer-generated audio at the correct timestamp
    for sentence, segment in zip(sentences, segments):
        dubbed = dubbed.overlay(segment, position = sentence['start_time'] * 1000, gain_during_overlay=overlayGain)
    # Write the final audio to a temporary output file
    audioFile = tempfile.NamedTemporaryFile()
    dubbed.export(audioFile)
    
    # Add the new audio to the video and save it
    clip = VideoFileClip(movieFile)
    audio = AudioFileClip(audioFile.name)
    clip = clip.set_audio(audio)
    
    clip.write_videofile(outFile, codec='libx264', audio_codec='aac')
    audioFile.close()


def dub(videoFile, outputDir, srcLang, targetLangs = [], storageBucket=None, phraseHints = [], dubSrc=False):

    baseName = os.path.split(videoFile)[-1].split('.')[0]

    if not os.path.exists(outputDir):
        os.mkdir(outputDir)
    
    outputFiles = os.listdir(outputDir)
    
    if not f"{baseName}.wav" in outputFiles:
        print("Extracting audio from video")
        fn = os.path.join(outputDir, baseName + ".wav")
        decode_audio(videoFile, fn)
        print(f"Wrote {fn}")

    if not f"{baseName}.json" in outputFiles:
        storageBucket = storageBucket if storageBucket else os.environ['STORAGE_BUCKET']
        if not storageBucket:
            raise Exception("Specify variable STORAGE_BUCKET in .env or as an arg")

        print("Transcribing audio")
        print("Uploading to the cloud...")
        storage_client = storage.Client()
        bucket = storage_client.bucket(storageBucket)

        tmpFile = os.path.join("tmp", str(uuid.uuid4()) + ".wav")
        blob = bucket.blob(tmpFile)
        blob.upload_from_filename(os.path.join(outputDir, baseName + ".wav"), content_type="audio/wav")

        print("Transcribing...")
        transcripts = get_transcripts_json(os.path.join("gs://", storageBucket, tmpFile), srcLang, phraseHints=phraseHints)
        print(transcripts)
        sentences = parse_sentence_with_speaker(transcripts)
        fn = os.path.join(outputDir, baseName + ".json")
        with open(fn, "w") as f:
            json.dump(sentences, f)
        print(f"Wrote {fn}")
        print("Deleting cloud file...")
        blob.delete()

    sentences = json.load(open(os.path.join(outputDir, baseName + ".json")))
    sentence = sentences[0]
    for lang in targetLangs:
        print(f"Translating to {lang}")
        for sentence in sentences:
            sentence[lang] = translate_text(sentence['sentence'], lang, srcLang)

    # Write the translations to json
    fn = os.path.join(outputDir, baseName + ".json")
    with open(fn, "w") as f:
        json.dump(sentences, f)
        
    audioDir = os.path.join(outputDir, "audioClips")
    if not "audioClips" in outputFiles:
        os.mkdir(audioDir)

    # whether or not to also dub the source language
    if dubSrc:
        targetLangs + [srcLang]

    for lang in targetLangs:
        languageDir = os.path.join(audioDir, lang)
        os.mkdir(languageDir)
        print(f"Synthesizing audio for for {lang}")
        for i, sentence in enumerate(sentences):
            audio = speak(sentence[lang], lang)
            with open(os.path.join(languageDir, f"{i}.mp3"), 'wb') as f:
                f.write(audio)

    dubbedDir = os.path.join(outputDir, "dubbedVideos")  
    if not "dubbedVideos" in outputFiles:
        os.mkdir(dubbedDir)
    
    for lang in targetLangs:
        print(f"Dubbing audio for {lang}")
        outFile = os.path.join(dubbedDir, lang + ".mp4")
        stitch_audio(sentences, os.path.join(audioDir, lang), videoFile, outFile)
    
    print("Done")



if __name__ == "__main__":
    fire.Fire(dub)