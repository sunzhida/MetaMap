from flask import Flask, request, url_for, Response, render_template, jsonify, session, redirect, flash, g
import pandas as pd
import numpy as np
import cv2
import sqlite3
from sqlite3 import Error
import sys
import warnings
import json
import random

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

# return suggest keywords based on input: a list of string
def colorPalette(conn, keyword):
    search_df = pd.read_sql_query("SELECT color_palette from keywords where keyword == '%s'" % keyword, conn)

    color_palette = search_df.color_palette.values
    if len(color_palette) != 0:
        color_palette = eval(color_palette[0])
        portion_sum = 0
        for color in color_palette[:-1]:
            color['portion'] = round(color['portion'], 2)
            portion_sum += color['portion']
        color_palette[-1]['portion'] = 1 - portion_sum

    return color_palette


# return related images based on input: a list of image ID
def searchImage(conn, keyword):
    image_df = pd.read_sql_query("SELECT image_name from keywords_images where keyword == '%s'" % keyword, conn)
    imagelist = list(image_df.image_name.values)

    return imagelist

def hex_to_rgb(hex_code):
    hex_code = hex_code.lstrip('#')
    hlen = len(hex_code)
    return np.array(tuple(int(hex_code[i:i+hlen//3], 16) for i in range(0, hlen, hlen//3)))

def hex_color_distance(hex_1, hex_2):
    rgb_1 = hex_to_rgb(hex_1)
    rgb_2 = hex_to_rgb(hex_2)
    
    return np.linalg.norm(rgb_2 - rgb_1)

def colorReRank(conn, hex_code, keyword):
    image_df = pd.read_sql_query("SELECT image_name from keywords_images where keyword == '%s'" % keyword, conn)
    imagelist = image_df.image_name.tolist()

    imagelist = "(" +  str(imagelist)[1:-1] + ")"
    image_df = pd.read_sql_query("SELECT image_name, color_dominant from images where image_name in %s" % imagelist, conn)

    image_df['dist'] = image_df.color_dominant.apply(lambda x: hex_color_distance(hex_code, x))
    image_df.sort_values(['dist'], inplace = True)
    
    return image_df.image_name.tolist()


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
    images_query = "(" + str(imagelist)[1:-1] + ")"

    keyword_df = pd.read_sql_query("SELECT keyword, image_name from keywords_images where image_name in %s" % images_query, conn)
    # keywords = keyword_df.keyword.values.tolist()
    # keyword_df.set_index('image_name', inplace=True)

    image_df = pd.read_sql_query("SELECT image_name, height, width from images where image_name in %s" % images_query, conn)
    image_df.set_index('image_name', inplace=True)

    image_dict_list = []
    for image in imagelist:
        keywords = keyword_df[keyword_df.image_name == image].keyword.tolist()
        height = image_df.loc[image, 'height']
        width = image_df.loc[image, 'width']
        # height = image_df[image_df.image_name == image].height.tolist()
        # width = image_df[image_df.image_name == image].width.tolist()

        # image_dict = checkImageAttributes(conn, image)
        image_dict = {
        "name": image,
        "keywords": keywords,
        "width": int(width),
        "height": int(height),
        }
        image_dict_list.append(image_dict)

    return image_dict_list


def exploreSemantic(conn, image_name, keyword, topn=10):
    search_df = pd.read_sql_query("SELECT semantic_match from keywords where keyword == '%s'" % keyword, conn)
    keywordlist = search_df.semantic_match.values

    # if keywordlist == ['[]']:
    #     keywordlist = "(" + keyword + ")"
    # else:
    #     keywordlist = "(" + keywordlist[0][1:-1] + ")"

    # image_df = pd.read_sql_query("SELECT image_name from keywords_images where keyword in %s" % keywordlist, conn)
    # imagelist = image_df.image_name.tolist()
    # return random.sample(imagelist, 10)

    if keywordlist == ['[]']:
        keywordlist = [keyword]
    else:
        keywordlist = eval(keywordlist[0])

    semantic_dict = {}
    imagelist = []
    for k in keywordlist:
        images = searchImage(conn, k)[:10]
        semantic_dict[k] = random.sample(images, len(images))

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


def exploreColorAndShape(conn, image_name, keyword, topn=10):
    related_keywords = pd.read_sql_query("SELECT suggestions from keywords where keyword == '%s'" % keyword, conn)
    related_keywords = "('" + keyword + "', " + related_keywords.suggestions[0][1:-1] + ")"

    image_df = pd.read_sql_query("SELECT image_name from keywords_images where keyword in %s" % related_keywords, conn)
    related_images = "(" + str(image_df.image_name.tolist())[1:-1] + ")"
    color_shape_df = pd.read_sql_query("SELECT image_name, color_hist, contour from images where image_name in %s" % related_images, conn)

    hist_1 = color_shape_df[color_shape_df["image_name"] == image_name].color_hist.values
    if len(hist_1) == 0:
        print("hist_1 is null: ", hist_1)
        return []
    hist_1 = np.array(eval(hist_1[0]), dtype="float32")

    shape_1 = color_shape_df[color_shape_df["image_name"] == image_name].contour.values
    if len(shape_1) == 0:
        print("shape_1 is null: ", shape_1)
        return []
    shape_1 = np.array(eval(shape_1[0]), dtype="float32")

    color_d = []
    shape_d = []
    for _, image in color_shape_df.iterrows():
        if pd.isnull(image.color_hist) or pd.isnull(image.contour) or image.contour == []:
            print('nan')
            continue
        hist_2 = np.array(eval(image.color_hist), dtype="float32")
        shape_2 = np.array(eval(image.contour), dtype="float32")
        color_distance = cv2.compareHist(hist_1, hist_2, cv2.HISTCMP_CORREL)
        shape_distance = cv2.matchShapes(shape_1, shape_2, 1, 0.0)
        if color_distance <= 0.95:
            color_d.append((image.image_name, color_distance))
        if shape_distance >= 0.02:
            shape_d.append((image.image_name, shape_distance))

    color_imagelist = [i[0] for i in sorted(color_d, key=lambda x: x[1], reverse=True)[:topn]]
    shape_imagelist = [i[0] for i in sorted(shape_d, key=lambda x: x[1], reverse=False)[:topn]]

    return color_imagelist, shape_imagelist

# def exploreColor(conn, image_name, keyword, topn=10):
#     related_keywords = pd.read_sql_query("SELECT related from keywords where keyword == '%s'" % keyword, conn)
#     related_keywords = "('" + keyword + "', " + related_keywords.related[0][1:-1] + ")"

#     image_df = pd.read_sql_query("SELECT image_name from keywords_images where keyword in %s" % related_keywords, conn)
#     related_images = "(" + str(image_df.image_name.tolist())[1:-1] + ")"
#     color_df = pd.read_sql_query("SELECT image_name, color_hist from images where image_name in %s" % related_images,
#                                  conn)

#     hist_1 = color_df[color_df["image_name"] == image_name].color_hist.values
#     if len(hist_1) == 0:
#         print("hist_1 is null: ", hist_1)
#         return []

#     hist_1 = np.array(eval(hist_1[0]), dtype="float32")

#     d = []

#     for _, image in color_df.iterrows():
#         if pd.isnull(image.color_hist):
#             print('nan')
#             continue
#         hist_2 = np.array(eval(image.color_hist), dtype="float32")
#         distance = cv2.compareHist(hist_1, hist_2, cv2.HISTCMP_CORREL)
#         if distance <= 0.95:
#             d.append((image.image_name, distance))

#     imagelist = [i[0] for i in sorted(d, key=lambda x: x[1], reverse=True)[:topn]]

#     return imagelist


# def exploreShape(conn, image_name, keyword, topn=10):
#     related_keywords = pd.read_sql_query("SELECT related from keywords where keyword == '%s'" % keyword, conn)
#     related_keywords = "('" + keyword + "', " + related_keywords.related[0][1:-1] + ")"

#     image_df = pd.read_sql_query("SELECT image_name from keywords_images where keyword in %s" % related_keywords, conn)
#     related_images = "(" + str(image_df.image_name.tolist())[1:-1] + ")"

#     shape_df = pd.read_sql_query("SELECT image_name, contour from images where image_name in %s" % related_images, conn)

#     shape_1 = shape_df[shape_df["image_name"] == image_name].contour.values
#     if len(shape_1) == 0:
#         print("shape_1 is null: ", shape_1)
#         return []

#     shape_1 = np.array(eval(shape_1[0]), dtype="float32")

#     d = []

#     for _, image in shape_df.iterrows():
#         if pd.isnull(image.contour) or image.contour == []:
#             print('nan')
#             continue
#         shape_2 = np.array(eval(image.contour), dtype="float32")
#         distance = cv2.matchShapes(shape_1, shape_2, 1, 0.0)
#         if distance >= 0.01:
#             d.append((image.image_name, distance))

#     imagelist = [i[0] for i in sorted(d, key=lambda x: x[1], reverse=False)[:topn]]

#     return imagelist


@app.route('/', methods=['GET', 'POST'])
def index():
    RELOAD_DATABASE = False
    conn = create_connection(DATABASE)
    if conn is not None and RELOAD_DATABASE:
        keyword_data = pd.read_csv('./data_csv/keywords.csv')
        keyword_image_data = pd.read_csv('./data_csv/keyword_image.csv')
        image_data = pd.read_csv('./data_csv/images.csv')
        # store data to db
        keyword_data.to_sql('keywords', conn, if_exists='replace', index = False, index_label='keyword')
        keyword_image_data.to_sql('keywords_images', conn, if_exists='replace', index = False, index_label=['keyword', 'image_name'])
        image_data.to_sql('images', conn, if_exists='replace', index = False, index_label='image_name')
    conn.commit()
    conn.close()
    message = 'OK'
    return render_template('index.html', message=message)


@app.route('/search/<i>', methods=['GET', 'POST'])
def search(i):
    conn = create_connection(DATABASE)
    keyword = suggestKeyword(conn, i)
    image = searchImage(conn, i)
    # color_palette = colorPalette(conn, i)
    # data = {'search': i, 'keywords': keyword, 'images': image, 'colors': color_palette}
    data = {'search': i, 'keywords': keyword, 'images': image}
    color_palette = [
        {'color':"#1F77B4", 'portion':0.3},
        {'color':"#FF7F0E", 'portion':0.2},
        {'color':"#2CA02C", 'portion':0.2},
        {'color':"#D62728", 'portion':0.1},
        {'color':"#9467BD", 'portion':0.1},
        {'color':"#8C564B", 'portion':0.1},
    ]
    conn.close()
    return json.dumps(data)

# TODO: enable this API after finish front end
@app.route('/colorrank/<i>', methods=['GET', 'POST'])
def colorsearch(i):
    hex_code = i.split(',')[0]
    keyword = i.split(',')[1]
    conn = create_connection(DATABASE)
    
    image = colorReRank(conn, hex_code, keyword)
    data = {'images': image}
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
    conn = create_connection(DATABASE)

    d = checkImageAttributes(conn, imgName)
    d['semantic'] = imagelistRetrieve(conn, exploreSemantic(conn, imgName, keyword, topn=10))
    color, shape = exploreColorAndShape(conn, imgName, keyword, topn=10)
    d['color'] = imagelistRetrieve(conn, color)
    d['shape'] = imagelistRetrieve(conn, shape)

    conn.close()
    return json.dumps(d)


@app.route('/redir/<i>')
def redir(i):
    keyword = suggestKeyword(i)
    image = searchImage(i)
    message = 'OK'
    return render_template('index.html', keyword=keyword, image=image, message=message)
