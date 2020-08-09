from flask import Flask, request, url_for, Response, render_template, jsonify, session, redirect, flash, g
import pandas as pd
import numpy as np
import cv2
import sqlite3
from sqlite3 import Error
import sys
import warnings
import json

if not sys.warnoptions:
    warnings.simplefilter("ignore")

DATABASE = "./database.db"

app = Flask(__name__, instance_relative_config=True)
app.config['DEBUG'] = True


# app.config['SECRET_KEY'] = 'hcihkust'

# TEMPData = pd.DataFrame()
# SCOPEData = pd.DataFrame()
# SCOPEView = 50


def create_connection(db_file):
    """ create a database connection to a SQLite database """
    try:
        conn = sqlite3.connect(db_file)
        # # print(sqlite3.version)
        return conn
    except Error as e:
        print(e)


# return suggest keywords based on input: a list of string
def suggestKeyword(conn, keyword):
    search_df = pd.read_sql_query("SELECT suggestions from keywords where keyword == '%s'" % keyword, conn)

    keywordlist = search_df.suggestions.values
    if len(keywordlist) != 0:
        keywordlist = eval(keywordlist[0])

    return keywordlist


# return related images based on input: a list of image ID
def searchImage(conn, keyword):
    image_df = pd.read_sql_query("SELECT image_name from keywords_images where keyword == '%s'" % keyword, conn)
    imagelist = list(image_df.image_name.values)
    # for image_name in imagelist:
    #     if image_name[-3:] not in ("jpg", "png"):
    #         imagelist.remove(image_name)

    return imagelist


def checkImageAttributes(conn, image_name):
    keyword_df = pd.read_sql_query("SELECT keyword from keywords_images where image_name = '%s'" % image_name, conn)
    keywords = keyword_df.keyword.values.tolist()

    image_df = pd.read_sql_query("SELECT height, width from images where image_name = '%s'" % image_name, conn)
    height = image_df.height.values[0]
    width = image_df.width.values[0]

    image_dict = {
        "name": image_name,
        "keywords": keywords,
        "width": int(width),
        "height": int(height),
    }
    return image_dict


def imagelistRetrieve(conn, imagelist):
    image_dict_list = []
    for image in imagelist:
        image_dict = checkImageAttributes(conn, image)
        image_dict_list.append(image_dict)

    return image_dict_list


def exploreSemantic(conn, image_name, keyword, topn=10):
    search_df = pd.read_sql_query("SELECT semantic_match from keywords where keyword == '%s'" % keyword, conn)
    keywordlist = search_df.semantic_match.values

    if keywordlist == ['[]']:
        keywordlist = [keyword]
    else:
        keywordlist = eval(keywordlist[0])

    semantic_dict = {}
    imagelist = []
    for k in keywordlist:
        semantic_dict[k] = searchImage(conn, k)[:10]

    i = 0

    while len(imagelist) < 10 and i < 10:
        for k in keywordlist:
            if len(imagelist) >= 10:
                break
            if len(semantic_dict[k]) < i + 1:
                continue
            if semantic_dict[k][i] != image_name:
                imagelist.append(semantic_dict[k][i])
        i = i + 1

    return imagelist


def exploreColor(conn, image_name, keyword, topn=10):
    related_keywords = pd.read_sql_query("SELECT related from keywords where keyword == '%s'" % keyword, conn)
    related_keywords = "('" + keyword + "', " + related_keywords.related[0][1:-1] + ")"

    image_df = pd.read_sql_query("SELECT image_name from keywords_images where keyword in %s" % related_keywords, conn)
    related_images = "(" + str(image_df.image_name.tolist())[1:-1] + ")"
    color_df = pd.read_sql_query("SELECT image_name, color_hist from images where image_name in %s" % related_images,
                                 conn)

    hist_1 = color_df[color_df["image_name"] == image_name].color_hist.values
    if len(hist_1) == 0:
        print("hist_1 is null: ", hist_1)
        return []

    hist_1 = np.array(eval(hist_1[0]), dtype="float32")

    d = []

    for _, image in color_df.iterrows():
        if pd.isnull(image.color_hist):
            print('nan')
            continue
        hist_2 = np.array(eval(image.color_hist), dtype="float32")
        distance = cv2.compareHist(hist_1, hist_2, cv2.HISTCMP_CORREL)
        if distance <= 0.95:
            d.append((image.image_name, distance))

    imagelist = [i[0] for i in sorted(d, key=lambda x: x[1], reverse=True)[:topn]]

    return imagelist


def exploreShape(conn, image_name, keyword, topn=10):
    related_keywords = pd.read_sql_query("SELECT related from keywords where keyword == '%s'" % keyword, conn)
    related_keywords = "('" + keyword + "', " + related_keywords.related[0][1:-1] + ")"

    image_df = pd.read_sql_query("SELECT image_name from keywords_images where keyword in %s" % related_keywords, conn)
    related_images = "(" + str(image_df.image_name.tolist())[1:-1] + ")"

    shape_df = pd.read_sql_query("SELECT image_name, contour from images where image_name in %s" % related_images, conn)

    shape_1 = shape_df[shape_df["image_name"] == image_name].contour.values
    if len(shape_1) == 0:
        print("shape_1 is null: ", shape_1)
        return []

    shape_1 = np.array(eval(shape_1[0]), dtype="float32")

    d = []

    for _, image in shape_df.iterrows():
        if pd.isnull(image.contour) or image.contour == []:
            print('nan')
            continue
        shape_2 = np.array(eval(image.contour), dtype="float32")
        distance = cv2.matchShapes(shape_1, shape_2, 1, 0.0)
        if distance >= 0.01:
            d.append((image.image_name, distance))

    imagelist = [i[0] for i in sorted(d, key=lambda x: x[1], reverse=False)[:topn]]

    return imagelist


@app.route('/', methods=['GET', 'POST'])
def index():
    RELOAD_DATABASE = False
    conn = create_connection(DATABASE)
    if conn is not None and RELOAD_DATABASE:
        keyword_data = pd.read_csv('./data_csv/keywords_demo.csv')
        keyword_image_data = pd.read_csv('./data_csv/keyword_image_match.csv')
        image_data = pd.read_csv('./data_csv/images_demo.csv')
        # store data to db
        keyword_data.to_sql('keywords', conn, if_exists='replace', index=False)
        keyword_image_data.to_sql('keywords_images', conn, if_exists='replace', index=False)
        image_data.to_sql('images', conn, if_exists='replace', index=False)
    conn.commit()
    conn.close()
    message = 'OK'
    return render_template('index.html', message=message)


@app.route('/search/<i>', methods=['GET', 'POST'])
def search(i):
    conn = create_connection(DATABASE)
    keyword = suggestKeyword(conn, i)
    image = searchImage(conn, i)
    # Fake Color Palette Here
    color_palette = [
        {'color':"#1F77B4", 'portion':0.3},
        {'color':"#FF7F0E", 'portion':0.2},
        {'color':"#2CA02C", 'portion':0.2},
        {'color':"#D62728", 'portion':0.1},
        {'color':"#9467BD", 'portion':0.1},
        {'color':"#8C564B", 'portion':0.1},
    ]
    data = {'search': i, 'keywords': keyword, 'images': image, 'colors': color_palette}
    conn.commit()
    conn.close()
    return json.dumps(data)


@app.route('/plot/<i>', methods=['GET', 'POST'])
def plot(i):
    # image name
    # print(i)
    #################################
    # Youwen: processing the data here, the data should return the keywords attribute
    # This is the function for adding the keywords for the first selected image
    #################################
    # d = {
    #     "input": "01.jpg",
    #     "keywords": ["xxx", "health", "health", "health"],
    #     "width": 566,
    #     "height": 34,
    #     "status": "xxx"
    # }
    conn = create_connection(DATABASE)
    d = checkImageAttributes(conn, i)
    conn.close()
    return json.dumps(d)


@app.route('/inquire/<i>', methods=['GET', 'POST'])
def inquire(i):
    imgName = i.split(',')[0]
    keyword = i.split(',')[1]
    # imgID = i.split(',')[2]
    # print(imgName)
    # print(keyword)
    #################################
    # Youwen: processing the data here, the data should return related attributes to the image
    # This is the function for exploring the related materials along different dimensions
    #################################
    conn = create_connection(DATABASE)

    d = checkImageAttributes(conn, imgName)
    d['semantic'] = imagelistRetrieve(conn, exploreSemantic(conn, imgName, keyword, topn=10))
    d['color'] = imagelistRetrieve(conn, exploreColor(conn, imgName, keyword, topn=10))
    d['shape'] = imagelistRetrieve(conn, exploreShape(conn, imgName, keyword, topn=10))

    conn.close()
    return json.dumps(d)


@app.route('/explore/<i>', methods=['GET', 'POST'])
def explore(i):
    imgName = i.split(',')[0]
    imgID = i.split(',')[1]
    print(imgName)
    print(imgID)
    #################################
    # Youwen: processing the data here, the data should return related attributes to the image
    # This is the function for exploring the related materials along different dimensions
    # May skip this function as it only serve the '->' explore button
    #################################
    d = {
        "input": "01.jpg",
        "semantic": [{
            "name": "000e74ea347f08c0cae2b3cfc4f612cf.jpg",
            "keywords": ["xxx", "health", "health", "health"],
            "width": 276,
            "height": 180
        }, {
            "name": "00a8885948a4a3abed0a27480c9f3fa6.png",
            "keywords": ["xxx", "health", "health", "health"],
            "width": 240,
            "height": 180
        }, {
            "name": "00a5155ce76792c8aaef4bd67e2d4f44.jpg",
            "keywords": ["xxx", "health", "health", "health"],
            "width": 232,
            "height": 180
        }],
        "color": [{
            "name": "00ab0fe3d1d76da690d7438117eeea49.jpg",
            "keywords": ["xxx", "health", "health", "health"],
            "width": 270,
            "height": 180
        }, {
            "name": "00e43e295097e2580d0178cb3cadd04b.jpg",
            "keywords": ["xxx", "health", "health", "health"],
            "width": 131,
            "height": 180
        }],
        "shape": [{
            "name": "00daeeb00b31e6f7fd9bf103a1733560.jpg",
            "keywords": ["xxx", "health", "health", "health"],
            "width": 131,
            "height": 180
        }, {
            "name": "00dddfdfe4ad349925af78c3d04533f9.jpg",
            "keywords": ["xxx", "health", "health", "health"],
            "width": 116,
            "height": 180
        }],
        "status": "xxx"
    }
    return json.dumps(d)


@app.route('/redir/<i>')
def redir(i):
    keyword = suggestKeyword(i)
    image = searchImage(i)
    message = 'OK'
    return render_template('index.html', keyword=keyword, image=image, message=message)
