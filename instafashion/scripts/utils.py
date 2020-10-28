#  * Copyright 2020 Google LLC
#  *
#  * Licensed under the Apache License, Version 2.0 (the "License");
#  * you may not use this file except in compliance with the License.
#  * You may obtain a copy of the License at
#  *
#  *      http://www.apache.org/licenses/LICENSE-2.0
#  *
#  * Unless required by applicable law or agreed to in writing, software
#  * distributed under the License is distributed on an "AS IS" BASIS,
#  * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#  * See the License for the specific language governing permissions and
#  * limitations under the License.
 

from google.cloud import vision
from google.cloud.vision import types
from pyvisionproductsearch import ProductSearch, ProductCategories
import io
import os

CLOTHING_OBJECT_LABELS = [
   "Outerwear",
    "Jacket",
    "Jeans",
    "Shorts",
    "Shirt",
    "Coat",
    "Suit",
    "Swimwear",
    "Dress",
    "Miniskirt",
    "Pants",
    "Footwear",
    "Skirt",
    "Belt",
    "Underpants",
    "Shoe",
    "Sandal",
    "Handbag",
    "Suitcase",
    "Satchel",
    "Sunglasses",
    "Top",
    "Bracelet",
    "Scarf",
    "Earrings",
    "Boot",
    "Hat",
    "High heels",
    "Cowboy hat",
    "Backpack",
    "Necklace",
    "Tiara",
    "Bowtie",
    "Straw hat",
    "Fedora",
    "Glasses",
    "Briefcase",
    "Tie",
    "Sun hat",
    "Glove",
    "Sombrero",
    "Helmet",
    "Crown",
    "Sock",
    "Goggles"
]


def detectLabels(file_path=None, image_uri=None):

    if bool(file_path) == bool(image_uri):
        raise Exception(
            "Must provide one of either a file path or an image uri")
    
    client = vision.ImageAnnotatorClient()

    if file_path:
        with io.open(file_path, 'rb') as image_file:
            content = image_file.read()
            image = vision.types.Image(content=content)
    else:
        image_source = vision.types.ImageSource(image_uri=image_uri)
        image = vision.types.Image(source=image_source)

    # Performs label detection on the image file
    response = client.label_detection(image=image)
    return response.label_annotations


def detectObjects(file_path=None, image_uri=None):

    if bool(file_path) == bool(image_uri):
        raise Exception(
            "Must provide one of either a file path or an image uri")
    
    client = vision.ImageAnnotatorClient()

    if file_path:
        with io.open(file_path, 'rb') as image_file:
            content = image_file.read()
            image = vision.types.Image(content=content)
    else:
        image_source = vision.types.ImageSource(image_uri=image_uri)
        image = vision.types.Image(source=image_source)

    # Performs label detection on the image file
    return client.object_localization(
        image=image).localized_object_annotations
