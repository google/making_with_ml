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

import dubber as target
import datetime
import json
from IPython import embed
test_local_movie = "./test2.mp4"
test_cloud_audio_path = "gs://ai_dubs_videos/test/test2.wav"
#test_json_transcript = "./async_with_diarization.json"
test_json_transcript = "./test_fixed.json"


# def test_decode_audio():
#     x = target.decode_audio(test_local_movie)
#     assert isinstance(x, bytes)
#     assert len(x) > 10
    
    # with open('test2.wav', 'wb') as f:
    #    f.write(x)

# def test_get_transcripts_json():
#    transcripts = target.get_transcripts_json(test_cloud_audio_path, "en-US", phraseHints=["Will"], speakerCount=2)
#    assert isinstance(transcripts, list)
#    assert len(transcripts)
#    for line in transcripts:
#       assert 'transcript' in line
#       assert len(line['transcript']) #Seems like there's an API bug here...
#       assert 'words' in line
#       assert len(line['words'])
#       assert set(line['words'][0].keys()) == set(['word', 'start_time', 'end_time', 'speaker_tag'])

#    with open(test_json_transcript, 'w') as f:
#        json.dump(transcripts, f)

def test_parse_sentence_with_speaker():
    jsonData = json.load(open("./test_fixed.json"))
    sentences = target.parse_sentence_with_speaker(jsonData)
    for s in sentences:
        assert len(s['sentence'])
        assert set(s.keys()) == set(['sentence', 'speaker', 'start_time', 'end_time'])

def test_translate_text():
    out = target.translate_text("Olemme täällä keräämässä oppimisdataa eri urheilulajeista", "en")
    assert out.lower() == "we are here to gather learning data on different sports"

def test_speak():
    audio = target.speak("Hello I'm Dale", "en")
    assert len(audio)
    with open('./test_audio.mp3', 'wb') as f:
        f.write(audio)
