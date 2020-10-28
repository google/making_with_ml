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

 

from pyvisionproductsearch import ProductSearch, ProductCategories
import os
from dotenv import load_dotenv
from collections import Counter

load_dotenv()

ps = ProductSearch(os.getenv("PROJECTID"),
                   os.getenv("CREDS"), os.getenv("BUCKET"))


def getLabel(fileName):
    # The label is just the last word in the filename
    return fileName.split("_")[-1].lower()


try:
    productSet = ps.getProductSet(os.getenv("PRODUCT_SET"))
except:
    productSet = ps.createProductSet(os.getenv("PRODUCT_SET"))

labels = []
for folder in os.listdir(os.getenv("CLOSET_DIR")):

    label = getLabel(folder)
    labels.append(label)

    print(f"Creating product {folder}")

    product = ps.createProduct(
        folder, "apparel", labels={"type": label})

    imgFolder = os.path.join(os.getenv("CLOSET_DIR"), folder)

    for img in os.listdir(imgFolder):
        try:
            product.addReferenceImage(os.path.join(imgFolder, img))
        except:
            print(f"Couldn't add reference image {imgFolder}/{img}")

    productSet.addProduct(product)
    print(f"Added product {product.displayName} to set")

numAdded = len(productSet.listProducts())
print(f"Added {numAdded} products to set")
print(Counter(labels))
