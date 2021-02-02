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

from pydub import AudioSegment
from google.cloud import speech_v1p1beta1 as speech
from google.cloud import texttospeech
from google.cloud import translate_v2 as translate
from google.cloud import storage
from moviepy.editor import VideoFileClip, AudioFileClip, CompositeVideoClip
from moviepy.video.tools.subtitles import SubtitlesClip, TextClip
import os
import shutil
import ffmpeg
import time
import json
import sys
import tempfile
import uuid
from dotenv import load_dotenv
import fire
import html

# Load config in .env file
load_dotenv()


def decode_audio(inFile, outFile):
    """Converts a video file to a wav file.

    Args:
        inFile (String): i.e. my/great/movie.mp4
        outFile (String): i.e. my/great/movie.wav
    """
    if not outFile[-4:] != "wav":
        outFile += ".wav"
    AudioSegment.from_file(inFile).set_channels(
        1).export(outFile, format="wav")


def get_transcripts_json(gcsPath, langCode, phraseHints=[], speakerCount=1, enhancedModel=None):
    """Transcribes audio files.

    Args:
        gcsPath (String): path to file in cloud storage (i.e. "gs://audio/clip.mp4")
        langCode (String): language code (i.e. "en-US", see https://cloud.google.com/speech-to-text/docs/languages)
        phraseHints (String[]): list of words that are unusual but likely to appear in the audio file.
        speakerCount (int, optional): Number of speakers in the audio. Only works on English. Defaults to None.
        enhancedModel (String, optional): Option to use an enhanced speech model, i.e. "video"

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

    diarize = speakerCount if speakerCount > 1 else False
    print(f"Diarizing: {diarize}")
    diarizationConfig = speech.SpeakerDiarizationConfig(
        enable_speaker_diarization=speakerCount if speakerCount > 1 else False,
    )

    # In English only, we can use the optimized video model
    if langCode == "en":
        enhancedModel = "video"

    config = speech.RecognitionConfig(
        language_code="en-US" if langCode == "en" else langCode,
        enable_automatic_punctuation=True,
        enable_word_time_offsets=True,
        speech_contexts=[{
            "phrases": phraseHints,
            "boost": 15
        }],
        diarization_config=diarizationConfig,
        profanity_filter=True,
        use_enhanced=True if enhancedModel else False,
        model="video" if enhancedModel else None

    )
    res = client.long_running_recognize(config=config, audio=audio).result()

    return _jsonify(res)

def parse_sentence_with_speaker(json, lang):
    """Takes json from get_transcripts_json and breaks it into sentences
    spoken by a single person. Sentences deliniated by a >= 1 second pause/

    Args:
        json (string[]): [{"transcript": "lalala", "words": [{"word": "la", "start_time": 20, "end_time": 21, "speaker_tag: 2}]}]
        lang (string): language code, i.e. "en"
    Returns:
        string[]: [{"sentence": "lalala", "speaker": 1, "start_time": 20, "end_time": 21}]
    """

    # Special case for parsing japanese words
    def get_word(word, lang):
        if lang == "ja":
            return word.split('|')[0]
        return word

    sentences = []
    sentence = {}
    for result in json:
        for i, word in enumerate(result['words']):
            wordText = get_word(word['word'], lang)
            if not sentence:
                sentence = {
                    lang: [wordText],
                    'speaker': word['speaker_tag'],
                    'start_time': word['start_time'],
                    'end_time': word['end_time']
                }
            # If we have a new speaker, save the sentence and create a new one:
            elif word['speaker_tag'] != sentence['speaker']:
                sentence[lang] = ' '.join(sentence[lang])
                sentences.append(sentence)
                sentence = {
                    lang: [wordText],
                    'speaker': word['speaker_tag'],
                    'start_time': word['start_time'],
                    'end_time': word['end_time']
                }
            else:
                sentence[lang].append(wordText)
                sentence['end_time'] = word['end_time']

            # If there's greater than one second gap, assume this is a new sentence
            if i+1 < len(result['words']) and word['end_time'] < result['words'][i+1]['start_time']:
                sentence[lang] = ' '.join(sentence[lang])
                sentences.append(sentence)
                sentence = {}
        if sentence:
            sentence[lang] = ' '.join(sentence[lang])
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
    result = translate_client.translate(
        input, target_language=targetLang, source_language=sourceLang)

    return html.unescape(result['translatedText'])


def speak(text, languageCode, voiceName=None, speakingRate=1):
    """Converts text to audio

    Args:
        text (String): Text to be spoken
        languageCode (String): Language (i.e. "en")
        voiceName: (String, optional): See https://cloud.google.com/text-to-speech/docs/voices
        speakingRate: (int, optional): speed up or slow down speaking
    Returns:
        bytes : Audio in wav format
    """

    # Instantiates a client
    client = texttospeech.TextToSpeechClient()

    # Set the text input to be synthesized
    synthesis_input = texttospeech.SynthesisInput(text=text)

    # Build the voice request, select the language code ("en-US") and the ssml
    # voice gender ("neutral")
    if not voiceName:
        voice = texttospeech.VoiceSelectionParams(
            language_code=languageCode, ssml_gender=texttospeech.SsmlVoiceGender.NEUTRAL
        )
    else:
        voice = texttospeech.VoiceSelectionParams(
            language_code=languageCode, name=voiceName
        )

    # Select the type of audio file you want returned
    audio_config = texttospeech.AudioConfig(
        audio_encoding=texttospeech.AudioEncoding.MP3,
        speaking_rate=speakingRate
    )

    # Perform the text-to-speech request on the text input with the selected
    # voice parameters and audio file type
    response = client.synthesize_speech(
        input=synthesis_input,
        voice=voice,
        audio_config=audio_config
    )

    return response.audio_content


def speakUnderDuration(text, languageCode, durationSecs, voiceName=None):
    """Speak text within a certain time limit.
    If audio already fits within duratinSecs, no changes will be made.

    Args:
        text (String): Text to be spoken
        languageCode (String): language code, i.e. "en"
        durationSecs (int): Time limit in seconds
        voiceName (String, optional): See https://cloud.google.com/text-to-speech/docs/voices

    Returns:
        bytes : Audio in wav format
    """
    baseAudio = speak(text, languageCode, voiceName=voiceName)
    assert len(baseAudio)
    f = tempfile.NamedTemporaryFile(mode="w+b")
    f.write(baseAudio)
    f.flush()
    baseDuration = AudioSegment.from_mp3(f.name).duration_seconds
    f.close()
    ratio = baseDuration / durationSecs

    # if the audio fits, return it
    if ratio <= 1:
        return baseAudio

    # If the base audio is too long to fit in the segment...

    # round to one decimal point and go a little faster to be safe,
    ratio = round(ratio, 1)
    if ratio > 4:
        ratio = 4
    return speak(text, languageCode, voiceName=voiceName, speakingRate=ratio)


def toSrt(transcripts, charsPerLine=60):
    """Converts transcripts to SRT an SRT file. Only intended to work
    with English.

    Args:
        transcripts ({}): Transcripts returned from Speech API
        charsPerLine (int): max number of chars to write per line

    Returns:
        String srt data
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

    def _srtTime(seconds):
        millisecs = seconds * 1000
        seconds, millisecs = divmod(millisecs, 1000)
        minutes, seconds = divmod(seconds, 60)
        hours, minutes = divmod(minutes, 60)
        return "%d:%d:%d,%d" % (hours, minutes, seconds, millisecs)

    def _toSrt(words, startTime, endTime, index):
        return f"{index}\n" + _srtTime(startTime) + " --> " + _srtTime(endTime) + f"\n{words}"

    startTime = None
    sentence = ""
    srt = []
    index = 1
    for word in [word for x in transcripts for word in x['words']]:
        if not startTime:
            startTime = word['start_time']

        sentence += " " + word['word']

        if len(sentence) > charsPerLine:
            srt.append(_toSrt(sentence, startTime, word['end_time'], index))
            index += 1
            sentence = ""
            startTime = None

    if len(sentence):
        srt.append(_toSrt(sentence, startTime, word['end_time'], index))

    return '\n\n'.join(srt)


def stitch_audio(sentences, audioDir, movieFile, outFile, srtPath=None, overlayGain=-30):
    """Combines sentences, audio clips, and video file into the ultimate dubbed video

    Args:
        sentences (list): Output of parse_sentence_with_speaker
        audioDir (String): Directory containing generated audio files to stitch together
        movieFile (String): Path to movie file to dub.
        outFile (String): Where to write dubbed movie.
        srtPath (String, optional): Path to transcript/srt file, if desired.
        overlayGain (int, optional): How quiet to make source audio when overlaying dubs. 
            Defaults to -30.

    Returns:
       void : Writes movie file to outFile path
    """

    # Files in the audioDir should be labeled 0.wav, 1.wav, etc.
    audioFiles = os.listdir(audioDir)
    audioFiles.sort(key=lambda x: int(x.split('.')[0]))

    # Grab the computer-generated audio file
    segments = [AudioSegment.from_mp3(
        os.path.join(audioDir, x)) for x in audioFiles]
    # Also, grab the original audio
    dubbed = AudioSegment.from_file(movieFile)

    # Place each computer-generated audio at the correct timestamp
    for sentence, segment in zip(sentences, segments):
        dubbed = dubbed.overlay(
            segment, position=sentence['start_time'] * 1000, gain_during_overlay=overlayGain)
    # Write the final audio to a temporary output file
    audioFile = tempfile.NamedTemporaryFile()
    dubbed.export(audioFile)
    audioFile.flush()

    # Add the new audio to the video and save it
    clip = VideoFileClip(movieFile)
    audio = AudioFileClip(audioFile.name)
    clip = clip.set_audio(audio)

    # Add transcripts, if supplied
    if srtPath:
        width, height = clip.size[0] * 0.75, clip.size[1] * 0.20
        def generator(txt): return TextClip(txt, font='Georgia-Regular',
                                            size=[width, height], color='black', method="caption")
        subtitles = SubtitlesClip(
            srtPath, generator).set_pos(("center", "bottom"))
        clip = CompositeVideoClip([clip, subtitles])

    clip.write_videofile(outFile, codec='libx264', audio_codec='aac')
    audioFile.close()

def dub(
        videoFile, outputDir, srcLang, targetLangs=[],
        storageBucket=None, phraseHints=[], dubSrc=False,
        speakerCount=1, voices={}, srt=False,
        newDir=False, genAudio=False, noTranslate=False):
    """Translate and dub a movie.

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

    Raises:
        void : Writes dubbed video and intermediate files to outputDir
    """

    baseName = os.path.split(videoFile)[-1].split('.')[0]
    if newDir:
        shutil.rmtree(outputDir)

    if not os.path.exists(outputDir):
        os.mkdir(outputDir)

    outputFiles = os.listdir(outputDir)

    if not f"{baseName}.wav" in outputFiles:
        print("Extracting audio from video")
        fn = os.path.join(outputDir, baseName + ".wav")
        decode_audio(videoFile, fn)
        print(f"Wrote {fn}")

    if not f"transcript.json" in outputFiles:
        storageBucket = storageBucket if storageBucket else os.environ['STORAGE_BUCKET']
        if not storageBucket:
            raise Exception(
                "Specify variable STORAGE_BUCKET in .env or as an arg")

        print("Transcribing audio")
        print("Uploading to the cloud...")
        storage_client = storage.Client()
        bucket = storage_client.bucket(storageBucket)

        tmpFile = os.path.join("tmp", str(uuid.uuid4()) + ".wav")
        blob = bucket.blob(tmpFile)
        # Temporary upload audio file to the cloud
        blob.upload_from_filename(os.path.join(
            outputDir, baseName + ".wav"), content_type="audio/wav")

        print("Transcribing...")
        transcripts = get_transcripts_json(os.path.join(
            "gs://", storageBucket, tmpFile), srcLang,
            phraseHints=phraseHints,
            speakerCount=speakerCount)
        json.dump(transcripts, open(os.path.join(
            outputDir, "transcript.json"), "w"))

        sentences = parse_sentence_with_speaker(transcripts, srcLang)
        fn = os.path.join(outputDir, baseName + ".json")
        with open(fn, "w") as f:
            json.dump(sentences, f)
        print(f"Wrote {fn}")
        print("Deleting cloud file...")
        blob.delete()

    srtPath = os.path.join(outputDir, "subtitles.srt") if srt else None
    if srt:
        transcripts = json.load(
            open(os.path.join(outputDir, "transcript.json")))
        subtitles = toSrt(transcripts)
        with open(srtPath, "w") as f:
            f.write(subtitles)
        print(
            f"Wrote srt subtitles to {os.path.join(outputDir, 'subtitles.srt')}")

    sentences = json.load(open(os.path.join(outputDir, baseName + ".json")))
    sentence = sentences[0]

    if not noTranslate:
        for lang in targetLangs:
            print(f"Translating to {lang}")
            for sentence in sentences:
                sentence[lang] = translate_text(
                    sentence[srcLang], lang, srcLang)

        # Write the translations to json
        fn = os.path.join(outputDir, baseName + ".json")
        with open(fn, "w") as f:
            json.dump(sentences, f)

    audioDir = os.path.join(outputDir, "audioClips")
    if not "audioClips" in outputFiles:
        os.mkdir(audioDir)

    # whether or not to also dub the source language
    if dubSrc:
        targetLangs += [srcLang]

    for lang in targetLangs:
        languageDir = os.path.join(audioDir, lang)
        if genAudio and os.path.exists(languageDir):
            shutil.rmtree(languageDir)
        os.mkdir(languageDir)
        print(f"Synthesizing audio for {lang}")
        for i, sentence in enumerate(sentences):
            voiceName = voices[lang] if lang in voices else None
            audio = speakUnderDuration(
                sentence[lang], lang, sentence['end_time'] -
                sentence['start_time'],
                voiceName=voiceName)
            with open(os.path.join(languageDir, f"{i}.mp3"), 'wb') as f:
                f.write(audio)

    dubbedDir = os.path.join(outputDir, "dubbedVideos")

    if not "dubbedVideos" in outputFiles:
        os.mkdir(dubbedDir)

    for lang in targetLangs:
        print(f"Dubbing audio for {lang}")
        outFile = os.path.join(dubbedDir, lang + ".mp4")
        stitch_audio(sentences, os.path.join(
            audioDir, lang), videoFile, outFile, srtPath=srtPath)

    print("Done")


if __name__ == "__main__":
    fire.Fire(dub)
