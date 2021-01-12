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
import os
import ffmpeg
import time
import json
import sys

from IPython import embed

# This function comes from https://github.com/kkroening/ffmpeg-python/blob/master/examples/transcribe.py
def decode_audio(fileName):
    """Extracts audio from a video file

    Args:
        fileName (String): Path to video file

    Returns:
        Blob: audio blob | Error
    """
    try:
        out, err = (ffmpeg
                    .input(fileName)
                    .output('-', format='s16le', acodec='pcm_s16le', ac=1, ar='16k')
                    .overwrite_output()
                    .run(capture_stdout=True, capture_stderr=True)
                    )
    except ffmpeg.Error as e:
        print(e.stderr, file=sys.stderr)
        sys.exit(1)
    return out


def get_transcripts_json(gcsPath, langCode, phraseHints=[], speakerCount=None):
    """Transcribes audio files.

    Args:
        gcsPath (String): path to file in cloud storage (i.e. "gs://audio/clip.mp4")
        langCode (String): language code (i.e. "en-US", see https://cloud.google.com/speech-to-text/docs/languages)
        phraseHints (String[]): list of words that are unusual but likely to appear in the audio file.
        speakerCount (int, optional): Number of speakers in the audio. Defaults to None.

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
    try:
        config = speech.RecognitionConfig(
            encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
            sample_rate_hertz=16000,
            enable_automatic_punctuation=True,
            enable_word_time_offsets=True,
            enable_speaker_diarization=True if speakerCount else False,
            diarization_speaker_count=speakerCount,
            language_code=langCode,
            use_enhanced=True,
            model="video",  # Optimize for audio pulled from videos
            speech_contexts=[{
                "phrases": phraseHints
            }]
        )
        res = client.long_running_recognize(config=config, audio=audio).result()
    except:
        # Video model isn't supported for all languages, so try again if this fails
        config = speech.RecognitionConfig(
            encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
            sample_rate_hertz=16000,
            enable_automatic_punctuation=True,
            enable_word_time_offsets=True,
            enable_speaker_diarization=True if speakerCount else False,
            diarization_speaker_count=speakerCount,
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
        bytes : Audio in mp3 format
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

def main():
    videoPath = "./ai_coach.mov"
    projectId = "ai-dubs"
    gcsBucket = "ai_dubs_videos"
    # Language code from https://cloud.google.com/speech-to-text/docs/languages
    srcLang = "fi"
    dstLang = "en"
    phraseHints = ["training data"]

    base = os.path.split(videoPath)[-1].split('.')[0]

    # print("Decoding audio")
    # audio = decode_audio(videoPath)
    # # with open(audio_path, 'wb') as f:
    # #     f.write(audio)

    # storage_client = storage.Client(project=projectId)
    # bucket = storage_client.bucket(gcsBucket)
    # blobName = base + ".wav"

    # print(f"Uploading file to gs://{gcsBucket}/{blobName}")
    # blob = bucket.blob(blobName)
    # blob.upload_from_string(audio, content_type="audio/wav")
    
    # print("Transcribing")
    # transcripts = get_transcripts_json(os.path.join("gs://", gcsBucket, blobName), srcLang, phraseHints=phraseHints)

    # print("Grouping transcripts by sentence")
    # sentences = parse_sentence_with_speaker(transcripts)

    # print("Translating")
    # for sentence in sentences:
    #     sentence[dstLang] = translate_text(sentence['sentence'], dstLang)

    # print("Dumping file to json")
    # with open(base + '.json', 'w') as f:
    #     json.dump(sentences, f)

    with open(base + '.json') as f:
        sentences = json.load(f)

    audioTmpDir = './audio_tmp'
    os.mkdir(audioTmpDir)

    print("Generating audio...")
    for i, sentence in enumerate(sentences):
        print(i)
        audio = speak(sentence[dstLang], dstLang)
        with open(os.path.join(audioTmpDir, f"{i}.mp3"), 'wb') as f:
            f.write(audio)

if __name__ == "__main__":
    main()