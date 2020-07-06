from flask import Flask, request, url_for, Response, render_template, jsonify, session, redirect, flash, g
import pandas as pd
import json
from collections import Counter
from nltk.corpus import wordnet
import sqlite3
from sqlite3 import Error
import sys
import warnings
import csv
from datetime import datetime
from werkzeug.security import check_password_hash
from werkzeug.security import generate_password_hash

if not sys.warnoptions:
    warnings.simplefilter("ignore")

# DATABASE = "./database.db"

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


def create_table(conn, create_table_sql):
    """ create a table from the create_table_sql statement
    :param conn: Connection object
    :param create_table_sql: a CREATE TABLE statement
    :return:
    """
    try:
        c = conn.cursor()
        c.execute(create_table_sql)
    except Error as e:
        print(e)


def create_interaction(conn, interaction):
    """
    Create a new task
    :param conn:
    :param task:
    :return:
    """
    sql = ''' INSERT INTO interactions (id, type, name, part, freq, child)
              VALUES(?, ?, ?, ?, ?, ?) '''
    cur = conn.cursor()
    cur.execute(sql, interaction)
    return cur.lastrowid


def create_action(conn, action):
    """
    Create a new task
    :param conn:
    :param task:
    :return:
    """
    sql = ''' INSERT INTO actions (id, name, freq, child, parent)
              VALUES(?, ?, ?, ?, ?) '''
    cur = conn.cursor()
    cur.execute(sql, action)
    return cur.lastrowid


def create_entity(conn, entity):
    """
    Create a new task
    :param conn:
    :param task:
    :return:
    """
    sql = ''' INSERT INTO entities (id, name, freq, child, parent)
              VALUES(?, ?, ?, ?, ?) '''
    cur = conn.cursor()
    cur.execute(sql, entity)
    return cur.lastrowid


def create_meaning(conn, meaning):
    """
    Create a new task
    :param conn:
    :param task:
    :return:
    """
    sql = ''' INSERT INTO meanings (id, name, freq, parent)
              VALUES(?, ?, ?, ?) '''
    cur = conn.cursor()
    cur.execute(sql, meaning)
    return cur.lastrowid


def create_relation(conn, relation):
    """
    Create a new task
    :param conn:
    :param task:
    :return:
    """
    sql = ''' INSERT INTO relations (i_id, a_id, e_id, m_id, i_item, a_item, e_item, m_item, i_type, i_part, i_freq, a_freq, e_freq, m_freq, freq, probability, id)
              VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) '''
    cur = conn.cursor()
    cur.execute(sql, relation)
    return cur.lastrowid


def create_sensor(conn, sensor):
    """
    Create a new task
    :param conn:
    :param task:
    :return:
    """
    sql = ''' INSERT INTO sensors (id, gesture, s_id, sensor_id, paper_id, link, domain, year, author, type, device, sensor, algo)
              VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) '''
    cur = conn.cursor()
    cur.execute(sql, sensor)
    return cur.lastrowid


def create_user(conn, user):
    sql = ''' INSERT INTO users (id, username, password) VALUES (?, ?, ?)'''
    cur = conn.cursor()
    cur.execute(sql, user)
    return cur.lastrowid


def create_history(conn, item):
    sql = ''' INSERT INTO history (id, user_id, created, operation, type, i, a, e, m) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'''
    cur = conn.cursor()
    cur.execute(sql, item)
    return cur.lastrowid


@app.route('/', methods=['GET', 'POST'])
def index():
    # sql_create_sensor_table = """ CREATE TABLE IF NOT EXISTS sensors (
    #                                                id integer NOT NULL,
    #                                                gesture text NOT NULL,
    #                                                s_id integer NOT NULL,
    #                                                sensor_id integer NOT NULL,
    #                                                paper_id integer NOT NULL,
    #                                                link text NOT NULL,
    #                                                domain text NOT NULL,
    #                                                year integer NOT NULL,
    #                                                author text NOT NULL,
    #                                                type text NOT NULL,
    #                                                device text NOT NULL,
    #                                                sensor text NOT NULL,
    #                                                algo text NOT NULL
    #                                            ); """
    #
    # sql_create_interaction_table = """ CREATE TABLE IF NOT EXISTS interactions (
    #                                            id integer NOT NULL,
    #                                            type text NOT NULL,
    #                                            name text NOT NULL,
    #                                            part text NOT NULL,
    #                                            freq integer NOT NULL,
    #                                            child text NOT NULL
    #                                        ); """
    #
    # sql_create_action_table = """ CREATE TABLE IF NOT EXISTS actions (
    #                                                id integer PRIMARY KEY,
    #                                                name text NOT NULL,
    #                                                freq integer NOT NULL,
    #                                                child text NOT NULL,
    #                                                parent text NOT NULL
    #                                            ); """
    #
    # sql_create_entity_table = """ CREATE TABLE IF NOT EXISTS entities (
    #                                                    id integer PRIMARY KEY,
    #                                                    name text NOT NULL,
    #                                                    freq integer NOT NULL,
    #                                                    child text NOT NULL,
    #                                                    parent text NOT NULL
    #                                                ); """
    #
    # sql_create_meaning_table = """ CREATE TABLE IF NOT EXISTS meanings (
    #                                                        id integer PRIMARY KEY,
    #                                                        name text NOT NULL,
    #                                                        freq integer NOT NULL,
    #                                                        parent text NOT NULL
    #                                                    ); """
    # sql_create_relation_table = """ CREATE TABLE IF NOT EXISTS relations (
    #                                                            i_id integer NOT NULL,
    #                                                            a_id integer NOT NULL,
    #                                                            e_id integer NOT NULL,
    #                                                            m_id integer NOT NULL,
    #                                                            i_item text NOT NULL,
    #                                                            a_item text NOT NULL,
    #                                                            e_item text NOT NULL,
    #                                                            m_item text NOT NULL,
    #                                                            i_type text NOT NULL,
    #                                                            i_part text NOT NULL,
    #                                                            i_freq integer NOT NULL,
    #                                                            a_freq integer NOT NULL,
    #                                                            e_freq integer NOT NULL,
    #                                                            m_freq integer NOT NULL,
    #                                                            freq integer NOT NULL,
    #                                                            probability REAL NOT NULL,
    #                                                            id integer PRIMARY KEY
    #                                                        ); """
    #
    # sql_create_user_table = ''' CREATE TABLE users (
    #                                                   id INTEGER PRIMARY KEY AUTOINCREMENT,
    #                                                   username TEXT UNIQUE NOT NULL,
    #                                                   password TEXT NOT NULL
    #                                                 );'''
    #
    # sql_create_history_table = ''' CREATE TABLE history (
    #                                                   id INTEGER PRIMARY KEY AUTOINCREMENT,
    #                                                   user_id INTEGER NOT NULL,
    #                                                   created TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    #                                                   operation TEXT NOT NULL,
    #                                                   type INTEGER NOT NULL,
    #                                                   i TEXT,
    #                                                   a TEXT,
    #                                                   e TEXT,
    #                                                   m TEXT,
    #                                                   FOREIGN KEY (user_id) REFERENCES user (id)
    #                                                 );'''
    #
    # # create a database connection
    # conn = create_connection(DATABASE)
    # cur = conn.cursor()
    # if conn is not None:
    #     # create projects table
    #     create_table(conn, sql_create_interaction_table)
    #     create_table(conn, sql_create_action_table)
    #     create_table(conn, sql_create_entity_table)
    #     create_table(conn, sql_create_meaning_table)
    #     create_table(conn, sql_create_relation_table)
    #     create_table(conn, sql_create_sensor_table)
    #     create_table(conn, sql_create_user_table)
    #     create_table(conn, sql_create_history_table)
    #     cur.execute("SELECT * FROM relations WHERE id = 1")
    #     tester = cur.fetchall()
    #     if len(tester) == 0:
    #         with open('app/data/relation/relation.csv') as f:
    #             reader = csv.reader(f)
    #             for field in reader:
    #                 cur.execute("INSERT INTO relations VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
    #                             (int(field[0]), int(field[1]), int(field[2]), int(field[3]), field[4],
    #                              field[5], field[6], field[7], field[8], field[9], int(field[10]),
    #                              int(field[11]), int(field[12]), int(field[13]), int(field[14]),
    #                              float(field[15]), int(field[16])))
    #         conn.commit()
    #     cur.execute("SELECT * FROM meanings WHERE id = 1")
    #     tester1 = cur.fetchall()
    #     if len(tester1) == 0:
    #         with open('app/data/entity/meaning.csv') as f:
    #             reader = csv.reader(f)
    #             for field in reader:
    #                 cur.execute("INSERT INTO meanings VALUES (?,?,?,?)",
    #                             (int(field[0]), field[1], int(field[2]), field[3]))
    #         conn.commit()
    #     cur.execute("SELECT * FROM entities WHERE id = 1")
    #     tester2 = cur.fetchall()
    #     if len(tester2) == 0:
    #         with open('app/data/entity/object.csv') as f:
    #             reader = csv.reader(f)
    #             for field in reader:
    #                 cur.execute("INSERT INTO entities VALUES (?,?,?,?,?)",
    #                             (int(field[0]), field[1], int(field[2]), field[3], field[4]))
    #         conn.commit()
    #     cur.execute("SELECT * FROM actions WHERE id = 1")
    #     tester3 = cur.fetchall()
    #     if len(tester3) == 0:
    #         with open('app/data/entity/action.csv') as f:
    #             reader = csv.reader(f)
    #             for field in reader:
    #                 cur.execute("INSERT INTO actions VALUES (?,?,?,?,?)",
    #                             (int(field[0]), field[1], int(field[2]), field[3], field[4]))
    #         conn.commit()
    #     cur.execute("SELECT * FROM interactions WHERE id = 1")
    #     tester4 = cur.fetchall()
    #     if len(tester4) == 0:
    #         with open('app/data/entity/interaction.csv') as f:
    #             reader = csv.reader(f)
    #             for field in reader:
    #                 cur.execute("INSERT INTO interactions VALUES (?,?,?,?,?,?)",
    #                             (int(field[0]), field[1], field[2], field[3], int(field[4]), field[5]))
    #         conn.commit()
    #     cur.execute("SELECT * FROM sensors WHERE id = 1")
    #     tester5 = cur.fetchall()
    #     if len(tester5) == 0:
    #         with open('app/data/entity/sensor.csv') as f:
    #             reader = csv.reader(f)
    #             for field in reader:
    #                 cur.execute("INSERT INTO sensors VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)",
    #                             (int(field[0]), field[1], int(field[2]), int(field[3]), int(field[4]), field[5],
    #                              field[6], int(field[7]), field[8], field[9], field[10], field[11], field[12]))
    #         conn.commit()
    #         conn.close()
    # else:
    #     print("Error! cannot create the database connection.")
    # message = {'content': 'Welcome to Metaphoriaction!',
    #            'type': 1}
    print('hello')
    message = 'OK'
    return render_template('index.html', message=message)


# @app.before_request
# def load_logged_in_user():
#     """If a user id is stored in the session, load the user object from
#     the database into ``g.user``."""
#     user_id = session.get("user_id")
#     conn = create_connection(DATABASE)
#     cur = conn.cursor()
#
#     if user_id is None:
#         g.user = None
#     else:
#         g.user = (
#             cur.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
#         )
#
# # data processing: the overview
# @app.route('/data/<dataname>')
# def data(dataname):
#     fpath = 'app/data/' + dataname + '.csv'
#     csv_data = pd.read_csv(fpath, encoding='cp1252')
#     items = csv_data.columns.values.tolist()
#     values = csv_data.values
#     json_data = []
#     for value in values:
#         data = {}
#         i = 0
#         for item in items:
#             data[item] = value[i]
#             i += 1
#         json_data.append(data)
#     return jsonify(json_data)
#
#
# # data processing: the synonym
# @app.route('/syn/<dataname>')
# def syn(dataname):
#     w, p = dataname.split('_')
#     final = {}
#     final['wordlist'] = []
#     final['legend'] = []
#     if p == 'n':
#         syn_lst = wordnet.synsets(w, pos=wordnet.NOUN)
#     elif p == 'v':
#         syn_lst = wordnet.synsets(w, pos=wordnet.VERB)
#     else:
#         return -1
#     for i in range(len(syn_lst)):
#         lst = [x.name().lower() for x in syn_lst[i].lemmas()]
#         lst = [x for x in lst if x != w]
#         if len(lst) == 0:
#             final['legend'].append({
#                 'def': syn_lst[i].definition(),
#                 'value': i
#             })
#         else:
#             for l in lst:
#                 final['wordlist'].append({
#                     'syn': l,
#                     'value': i
#                 })
#             final['legend'].append({
#                 'def': syn_lst[
#                            i].definition() + '<br> <i class="text-muted">synonyms:</i> <span class="syn">' + ', '.join(
#                     lst) + ', etc.</span>',
#                 'value': i
#             })
#     return jsonify(final)
#
#
# # data processing: the synonym
# @app.route('/table/<dataname>')
# def table(dataname):
#     conn = create_connection(DATABASE)
#     info = pd.read_sql_query("SELECT * FROM sensors WHERE id = (?) ORDER BY id", conn, params=(dataname,))
#     info = info[['link', 'domain', 'year', 'type', 'device', 'sensor', 'algo']]
#     return jsonify(info.to_json(orient='values'))
#
#
# def checkInteraction(i, w):
#     conn = create_connection(DATABASE)
#     data = pd.read_sql_query("SELECT * FROM interactions ORDER BY id", conn)
#     data.dropna(inplace=True)
#     df = pd.DataFrame(data, columns=['id', 'type', 'name', 'part', 'freq', 'child'])
#     # return json.loads(df[(df['id'] == i) & (df['name'].isin(list(w)))].to_json(orient='records'))
#     return json.loads(df[(df['id'] == i) & (df['name'] == w)].to_json(orient='records'))
#
#
# def checkAction(i):
#     conn = create_connection(DATABASE)
#     data = pd.read_sql_query("SELECT * FROM actions ORDER BY id", conn)
#     data.dropna(inplace=True)
#     df = pd.DataFrame(data, columns=['id', 'name', 'type', 'freq', 'child', 'parent'])
#     return json.loads(df[df['id'] == i].to_json(orient='records'))
#
#
# def checkEntity(i):
#     conn = create_connection(DATABASE)
#     data = pd.read_sql_query("SELECT * FROM entities ORDER BY id", conn)
#     data.dropna(inplace=True)
#     df = pd.DataFrame(data, columns=['id', 'name', 'freq', 'child', 'parent'])
#     return json.loads(df[df['id'] == i].to_json(orient='records'))
#
#
# def checkMeaning(i):
#     conn = create_connection(DATABASE)
#     data = pd.read_sql_query("SELECT * FROM meanings ORDER BY id", conn)
#     data.dropna(inplace=True)
#     df = pd.DataFrame(data, columns=['id', 'name', 'freq', 'parent'])
#     return json.loads(df[df['id'] == i].to_json(orient='records'))
#
#
# def checkInput(i, obj, prop, rest):
#     if len(i):
#         obj[prop] = i
#     else:
#         rest[prop] = []
#
#
# def generateData(matches):
#     # All the lists of nodes
#     nodes = []
#     i_df = pd.DataFrame()
#     a_df = pd.DataFrame()
#     e_df = pd.DataFrame()
#     m_df = pd.DataFrame()
#     nodeCount = 0
#     gdtemp = matches.groupby(['i_id', 'i_item']).size().reset_index()
#     # print("this is gdtemp: ", gdtemp)
#     for i in json.loads(gdtemp.to_json(orient='values')):
#         # print(i)
#         thisInteraction = checkInteraction(i[0], i[1])
#         # print("this is interaction1:", thisInteraction)
#         for _i in range(len(thisInteraction)):
#             thisInteraction[_i]['iden'] = thisInteraction[_i]['name']
#             thisInteraction[_i]['name'] = thisInteraction[_i]['name'] + ', ' + thisInteraction[_i]['type'] + ', ' + \
#                                           thisInteraction[_i]['part']
#             thisInteraction[_i]['nodes'] = nodeCount
#             thisInteraction[_i]['orid'] = thisInteraction[_i]['id']
#             thisInteraction[_i]['num'] = Counter(list(matches['i_id']))[i[0]]
#             thisInteraction[_i]['type'] = 'interaction'
#             nodes.append(thisInteraction[_i])
#             i_df_temp = pd.DataFrame({'i_id': [i[0]], 'i_item': [thisInteraction[_i]['iden']], 'source': [nodeCount]})
#             i_df = pd.concat([i_df, i_df_temp], ignore_index=True)
#             nodeCount += 1
#     for a in list(set(list(matches['a_id']))):
#         thisAction = checkAction(a)
#         for _a in range(len(thisAction)):
#             thisAction[_a]['iden'] = thisAction[_a]['name']
#             thisAction[_a]['type'] = 'action'
#             thisAction[_a]['nodes'] = nodeCount
#             thisAction[_a]['orid'] = thisAction[_a]['id']
#             thisAction[_a]['num'] = Counter(list(matches['a_id']))[a]
#             nodes.append(thisAction[_a])
#             a_df_temp = pd.DataFrame({'a_id': [a], 'source': [nodeCount]})
#             a_df = pd.concat([a_df, a_df_temp], ignore_index=True)
#             nodeCount += 1
#     for e in list(set(list(matches['e_id']))):
#         thisEntity = checkEntity(e)
#         for _e in range(len(thisEntity)):
#             thisEntity[_e]['iden'] = thisEntity[_e]['name']
#             thisEntity[_e]['type'] = 'entity'
#             thisEntity[_e]['nodes'] = nodeCount
#             thisEntity[_e]['orid'] = thisEntity[_e]['id']
#             thisEntity[_e]['num'] = Counter(list(matches['e_id']))[e]
#             nodes.append(thisEntity[_e])
#             e_df_temp = pd.DataFrame({'e_id': [e], 'source': [nodeCount]})
#             e_df = pd.concat([e_df, e_df_temp], ignore_index=True)
#             nodeCount += 1
#     for m in list(set(list(matches['m_id']))):
#         thisMeaning = checkMeaning(m)
#         for _m in range(len(thisMeaning)):
#             thisMeaning[_m]['iden'] = thisMeaning[_m]['name']
#             thisMeaning[_m]['type'] = 'meaning'
#             thisMeaning[_m]['nodes'] = nodeCount
#             thisMeaning[_m]['orid'] = thisMeaning[_m]['id']
#             thisMeaning[_m]['num'] = Counter(list(matches['m_id']))[m]
#             nodes.append(thisMeaning[_m])
#             m_df_temp = pd.DataFrame({'m_id': [m], 'target': [nodeCount]})
#             m_df = pd.concat([m_df, m_df_temp], ignore_index=True)
#             nodeCount += 1
#     # print(nodes)
#     # Find all the links among the nodes
#     ia = matches.groupby(["i_item", "i_id", "a_id"]).size().reset_index(name="value")
#     ia1 = pd.merge(ia, i_df, how='left', left_on=['i_id', 'i_item'], right_on=['i_id', 'i_item'])
#
#     a_df.columns = ['a_id', 'target']
#     ia2 = pd.merge(a_df, ia1, on='a_id')
#     ia2 = ia2[['source', 'target', 'value']]
#
#     ae = matches.groupby(["a_id", "e_id"]).size().reset_index(name="value")
#     a_df.columns = ['a_id', 'source']
#     ae1 = pd.merge(a_df, ae, on='a_id')
#
#     e_df.columns = ['e_id', 'target']
#     ae2 = pd.merge(e_df, ae1, on='e_id')
#     ae2 = ae2[['source', 'target', 'value']]
#
#     em = matches.groupby(["e_id", "m_id"]).size().reset_index(name="value")
#     e_df.columns = ['e_id', 'source']
#     em1 = pd.merge(e_df, em, on='e_id')
#
#     m_df.columns = ['m_id', 'target']
#     em2 = pd.merge(m_df, em1, on='m_id')
#     em2 = em2[['source', 'target', 'value']]
#     links = []
#     links.extend(json.loads(ia2.to_json(orient='records')))
#     links.extend(json.loads(ae2.to_json(orient='records')))
#     links.extend(json.loads(em2.to_json(orient='records')))
#     data = {
#         'nodes': nodes,
#         'links': links
#     }
#     return data
#
#
# @app.route('/revise', methods=['POST', 'GET'])
# def revise():
#     if request.method == 'POST':
#         jsdata = request.json
#         # print(jsdata[-1])
#
#         conn = create_connection(DATABASE)
#         cursor = conn.cursor()
#
#         if jsdata[-1][1] == 'interaction':
#             cursor.execute(
#                 "INSERT INTO history (user_id, created, operation, type, i) VALUES (?, ?, ?, ?, ?)",
#                 (session["user_id"], datetime.now(), jsdata[-1][0], jsdata[-1][4], jsdata[-1][2]))
#         elif jsdata[-1][1] == 'action':
#             cursor.execute(
#                 "INSERT INTO history (user_id, created, operation, type, a) VALUES (?, ?, ?, ?, ?)",
#                 (session["user_id"], datetime.now(), jsdata[-1][0], jsdata[-1][4], jsdata[-1][2]))
#         elif jsdata[-1][1] == 'entity':
#             cursor.execute(
#                 "INSERT INTO history (user_id, created, operation, type, e) VALUES (?, ?, ?, ?, ?)",
#                 (session["user_id"], datetime.now(), jsdata[-1][0], jsdata[-1][4], jsdata[-1][2]))
#         elif jsdata[-1][1] == 'meaning':
#             cursor.execute(
#                 "INSERT INTO history (user_id, created, operation, type, m) VALUES (?, ?, ?, ?, ?)",
#                 (session["user_id"], datetime.now(), jsdata[-1][0], jsdata[-1][4], jsdata[-1][2]))
#
#         conn.commit()
#
#         global TEMPData
#         df = TEMPData
#         for i in jsdata:
#             if i[4] == 1:
#                 if i[0] == 'add':
#                     if i[1] == 'interaction':
#                         df = df[(df['i_item'] == i[2]) & (df['i_id'] == i[3])]
#                     elif i[1] == 'action':
#                         df = df[df['a_item'] == i[2]]
#                     elif i[1] == 'entity':
#                         df = df[df['e_item'] == i[2]]
#                     elif i[1] == 'meaning':
#                         df = df[df['m_item'] == i[2]]
#                 else:
#                     if i[1] == 'interaction':
#                         df = df[~((df['i_item'] == i[2]) & (df['i_id'] == i[3]))]
#                     elif i[1] == 'action':
#                         df = df[df['a_item'] != i[2]]
#                     elif i[1] == 'entity':
#                         df = df[df['e_item'] != i[2]]
#                     elif i[1] == 'meaning':
#                         df = df[df['m_item'] != i[2]]
#         data = generateData(df)
#         result = {}
#         result['data'] = data
#         result['length'] = list(df.shape)[0]
#         return jsonify(result)
#
#
# @app.route('/update', methods=['POST', 'GET'])
# def update():
#     if request.method == 'POST':
#         scope = request.json
#         total = len(SCOPEData.index) - 50
#         starter = total * scope / 100
#         base = SCOPEData.reset_index(drop=True)
#         mask = (base.index >= int(starter)) & (base.index < int(starter) + 50)
#         global TEMPData
#         TEMPData = base.loc[mask]
#         data = generateData(base.loc[mask])
#     return jsonify(data)
#
#
# @app.route('/writeclick', methods=['POST', 'GET'])
# def writeclick():
#     if request.method == 'POST':
#         data = request.json
#         f = open('clickHistory.txt', 'a+')
#         f.write(json.dumps(data))
#         f.close()
#     return '1'
#
#
# @app.route('/writepin', methods=['POST', 'GET'])
# def writepin():
#     if request.method == 'POST':
#         data = request.json
#         f = open('pinHistory.txt', 'a+')
#         f.write(json.dumps(data))
#         f.close()
#     return '1'
#
#
# @app.route('/result', methods=['POST', 'GET'])
# def result():
#     if g.user is None:
#         return redirect(url_for("login"))
#
#     conn = create_connection(DATABASE)
#     if request.method == 'POST':
#         result = request.form
#         tree = {}
#         # Used for taking records of missing values
#         vain = {}
#         editHistory = []
#         checkInput(result['interaction'], tree, 'interaction', vain)
#         checkInput(result['action'], tree, 'action', vain)
#         checkInput(result['entity'], tree, 'entity', vain)
#         checkInput(result['mean'], tree, 'mean', vain)
#         # create a database connection
#         with conn:
#             # get the latest answer id
#             cursor = conn.cursor()
#             record = conn.cursor()
#             if len(vain.keys()) == 3 and tree.get('interaction'):
#                 cursor.execute("SELECT * FROM relations WHERE i_item = ? ORDER BY id",
#                                (result['interaction'].lower(),))
#                 editHistory.append(['add', 'interaction', result['interaction'].lower(), '', 0])
#                 record.execute(
#                     "INSERT INTO history (user_id, created, operation, type, i) VALUES (?, ?, ?, ?, ?)",
#                     (session["user_id"], datetime.now(), "search", 0, result['interaction'].lower()))
#             elif len(vain.keys()) == 3 and tree.get('action'):
#                 cursor.execute("SELECT * FROM relations WHERE a_item = ? ORDER BY id",
#                                (result['action'].lower(),))
#                 editHistory.append(['add', 'action', result['action'].lower(), '', 0])
#                 record.execute(
#                     "INSERT INTO history (user_id, created, operation, type, a) VALUES (?, ?, ?, ?, ?)",
#                     (session["user_id"], datetime.now(), "search", 0, result['action'].lower()))
#             elif len(vain.keys()) == 3 and tree.get('entity'):
#                 cursor.execute("SELECT * FROM relations WHERE e_item = ? ORDER BY id",
#                                (result['entity'].lower(),))
#                 editHistory.append(['add', 'entity', result['entity'].lower(), '', 0])
#                 record.execute(
#                     "INSERT INTO history (user_id, created, operation, type, e) VALUES (?, ?, ?, ?, ?)",
#                     (session["user_id"], datetime.now(), "search", 0, result['entity'].lower()))
#             elif len(vain.keys()) == 3 and tree.get('mean'):
#                 cursor.execute("SELECT * FROM relations WHERE m_item = ? ORDER BY id",
#                                (result['mean'].lower(),))
#                 editHistory.append(['add', 'meaning', result['mean'].lower(), '', 0])
#                 record.execute("INSERT INTO history (user_id, created, operation, type, m) VALUES (?, ?, ?, ?, ?)",
#                     (session["user_id"], datetime.now(), "search", 0, result['mean'].lower()))
#             elif len(vain.keys()) == 2 and tree.get('interaction') and tree.get('action'):
#                 cursor.execute("SELECT * FROM relations WHERE i_item = ? AND a_item = ? ORDER BY id",
#                                (result['interaction'].lower(), result['action'].lower(),))
#                 editHistory.append(['add', 'interaction', result['interaction'].lower(), '', 0])
#                 editHistory.append(['add', 'action', result['action'].lower(), '', 0])
#                 record.execute("INSERT INTO history (user_id, created, operation, type, i, a) VALUES (?, ?, ?, ?, ?, ?)",
#                     (session["user_id"], datetime.now(), "search", 0, result['interaction'].lower(), result['action'].lower()))
#             elif len(vain.keys()) == 2 and tree.get('interaction') and tree.get('entity'):
#                 cursor.execute("SELECT * FROM relations WHERE i_item = ? AND e_item = ? ORDER BY id",
#                                (result['interaction'].lower(), result['entity'].lower(),))
#                 editHistory.append(['add', 'interaction', result['interaction'].lower(), '', 0])
#                 editHistory.append(['add', 'entity', result['entity'].lower(), '', 0])
#                 record.execute(
#                     "INSERT INTO history (user_id, created, operation, type, i, e) VALUES (?, ?, ?, ?, ?, ?)",
#                     (session["user_id"], datetime.now(), "search", 0, result['interaction'].lower(),
#                      result['entity'].lower()))
#             elif len(vain.keys()) == 2 and tree.get('interaction') and tree.get('mean'):
#                 cursor.execute("SELECT * FROM relations WHERE i_item = ? AND m_item = ? ORDER BY id",
#                                (result['interaction'].lower(), result['mean'].lower(),))
#                 editHistory.append(['add', 'interaction', result['interaction'].lower(), '', 0])
#                 editHistory.append(['add', 'meaning', result['mean'].lower(), '', 0])
#                 record.execute(
#                     "INSERT INTO history (user_id, created, operation, type, i, e) VALUES (?, ?, ?, ?, ?, ?)",
#                     (session["user_id"], datetime.now(), "search", 0, result['interaction'].lower(),
#                      result['entity'].lower()))
#             elif len(vain.keys()) == 2 and tree.get('action') and tree.get('entity'):
#                 cursor.execute("SELECT * FROM relations WHERE a_item = ? AND e_item = ? ORDER BY id",
#                                (result['action'].lower(), result['entity'].lower(),))
#                 editHistory.append(['add', 'action', result['action'].lower(), '', 0])
#                 editHistory.append(['add', 'entity', result['entity'].lower(), '', 0])
#                 record.execute(
#                     "INSERT INTO history (user_id, created, operation, type, a, e) VALUES (?, ?, ?, ?, ?, ?)",
#                     (session["user_id"], datetime.now(), "search", 0, result['action'].lower(),
#                      result['entity'].lower()))
#             elif len(vain.keys()) == 2 and tree.get('action') and tree.get('mean'):
#                 cursor.execute("SELECT * FROM relations WHERE a_item = ? AND m_item = ? ORDER BY id",
#                                (result['action'].lower(), result['mean'].lower(),))
#                 editHistory.append(['add', 'action', result['action'].lower(), '', 0])
#                 editHistory.append(['add', 'meaning', result['mean'].lower(), '', 0])
#                 record.execute(
#                     "INSERT INTO history (user_id, created, operation, type, a, m) VALUES (?, ?, ?, ?, ?, ?)",
#                     (session["user_id"], datetime.now(), "search", 0, result['action'].lower(),
#                      result['mean'].lower()))
#             elif len(vain.keys()) == 2 and tree.get('entity') and tree.get('mean'):
#                 cursor.execute("SELECT * FROM relations WHERE e_item = ? AND m_item = ? ORDER BY id",
#                                (result['entity'].lower(), result['mean'].lower(),))
#                 editHistory.append(['add', 'entity', result['entity'].lower(), '', 0])
#                 editHistory.append(['add', 'meaning', result['mean'].lower(), '', 0])
#                 record.execute(
#                     "INSERT INTO history (user_id, created, operation, type, e, m) VALUES (?, ?, ?, ?, ?, ?)",
#                     (session["user_id"], datetime.now(), "search", 0, result['entity'].lower(),
#                      result['mean'].lower()))
#             elif len(vain.keys()) == 1 and tree.get('interaction') and tree.get('action') and tree.get('entity'):
#                 cursor.execute(
#                     "SELECT * FROM relations WHERE i_item = ? AND a_item = ? AND e_item = ? ORDER BY id",
#                     (result['interaction'].lower(), result['action'].lower(), result['entity'].lower(),))
#                 editHistory.append(['add', 'interaction', result['interaction'].lower(), '', 0])
#                 editHistory.append(['add', 'action', result['action'].lower(), '', 0])
#                 editHistory.append(['add', 'entity', result['entity'].lower(), '', 0])
#                 record.execute(
#                     "INSERT INTO history (user_id, created, operation, type, i, a, e) VALUES (?, ?, ?, ?, ?, ?, ?)",
#                     (session["user_id"], datetime.now(), "search", 0, result['interaction'].lower(), result['action'].lower(),
#                      result['entity'].lower()))
#             elif len(vain.keys()) == 1 and tree.get('interaction') and tree.get('action') and tree.get('mean'):
#                 cursor.execute(
#                     "SELECT * FROM relations WHERE i_item = ? AND a_item = ? AND m_item = ? ORDER BY id",
#                     (result['interaction'].lower(), result['action'].lower(), result['mean'].lower(),))
#                 editHistory.append(['add', 'interaction', result['interaction'].lower(), '', 0])
#                 editHistory.append(['add', 'action', result['action'].lower(), '', 0])
#                 editHistory.append(['add', 'meaning', result['mean'].lower(), '', 0])
#                 record.execute(
#                     "INSERT INTO history (user_id, created, operation, type, i, a, m) VALUES (?, ?, ?, ?, ?, ?, ?)",
#                     (session["user_id"], datetime.now(), "search", 0, result['interaction'].lower(),
#                      result['action'].lower(),
#                      result['mean'].lower()))
#             elif len(vain.keys()) == 1 and tree.get('interaction') and tree.get('entity') and tree.get('mean'):
#                 cursor.execute(
#                     "SELECT * FROM relations WHERE i_item = ? AND e_item = ? AND m_item = ? ORDER BY id",
#                     (result['interaction'].lower(), result['entity'].lower(), result['mean'].lower(),))
#                 editHistory.append(['add', 'interaction', result['interaction'].lower(), '', 0])
#                 editHistory.append(['add', 'entity', result['entity'].lower(), '', 0])
#                 editHistory.append(['add', 'meaning', result['mean'].lower(), '', 0])
#                 record.execute(
#                     "INSERT INTO history (user_id, created, operation, type, i, e, m) VALUES (?, ?, ?, ?, ?, ?, ?)",
#                     (session["user_id"], datetime.now(), "search", 0, result['interaction'].lower(),
#                      result['entity'].lower(),
#                      result['mean'].lower()))
#             elif len(vain.keys()) == 1 and tree.get('action') and tree.get('entity') and tree.get('mean'):
#                 cursor.execute(
#                     "SELECT * FROM relations WHERE a_item = ? AND e_item = ? AND m_item = ? ORDER BY id",
#                     (result['action'].lower(), result['entity'].lower(), result['mean'].lower(),))
#                 editHistory.append(['add', 'action', result['action'].lower(), '', 0])
#                 editHistory.append(['add', 'entity', result['entity'].lower(), '', 0])
#                 editHistory.append(['add', 'meaning', result['mean'].lower(), '', 0])
#                 record.execute(
#                     "INSERT INTO history (user_id, created, operation, type, a, e, m) VALUES (?, ?, ?, ?, ?, ?, ?)",
#                     (session["user_id"], datetime.now(), "search", 0, result['action'].lower(),
#                      result['entity'].lower(),
#                      result['mean'].lower()))
#             elif len(vain.keys()) == 0:
#                 cursor.execute(
#                     "SELECT * FROM relations WHERE i_item = ? AND a_item = ? AND e_item = ? AND m_item = ? ORDER BY id",
#                     (result['interaction'].lower(), result['action'].lower(), result['entity'].lower(),
#                      result['mean'].lower(),))
#                 editHistory.append(['add', 'interaction', result['interaction'].lower(), '', 0])
#                 editHistory.append(['add', 'action', result['action'].lower(), '', 0])
#                 editHistory.append(['add', 'entity', result['entity'].lower(), '', 0])
#                 editHistory.append(['add', 'meaning', result['mean'].lower(), '', 0])
#                 record.execute(
#                     "INSERT INTO history (user_id, created, operation, type, i, a, e, m) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
#                     (session["user_id"], datetime.now(), "search", 0, result['interaction'].lower(),
#                      result['action'].lower(),
#                      result['entity'].lower(), result['mean'].lower()))
#             else:
#                 message = {
#                     'content': 'Please provide at least one valid keyword.',
#                     'type': 0
#                 }
#                 return render_template('index.html', message=message)
#         matches_base = cursor.fetchall()
#         matches = pd.DataFrame(matches_base,
#                                columns=['i_id', 'a_id', 'e_id', 'm_id', 'i_item', 'a_item', 'e_item', 'm_item',
#                                         'i_type', 'i_part', 'i_freq', 'a_freq', 'e_freq', 'm_freq', 'freq',
#                                         'probability', 'id'])
#         if matches.empty:
#             reminder = {}
#             if result['interaction'] != '':
#                 reminder['interaction'] = result['interaction']
#             if result['action'] != '':
#                 reminder['action'] = result['action']
#             if result['entity'] != '':
#                 reminder['entity'] = result['entity']
#             if result['mean'] != '':
#                 reminder['meaning'] = result['mean']
#             if len(reminder) == 1:
#                 note = list(reminder.values())[0] + " (" + list(reminder.keys())[
#                     0] + ")"
#             else:
#                 note = ""
#                 for i in range(len(reminder)):
#                     note = note + " " + list(reminder.values())[i] + ' (' + list(reminder.keys())[
#                         i] + ') '
#             return render_template('blank.html', result=result, note=note)
#         else:
#             matches = matches.sort_values(by=['probability'], ascending=False)
#             shape = matches.shape
#             rows = list(shape)[0]
#             global SCOPEData
#             SCOPEData = matches
#             global SCOPEView
#             matches = matches.head(SCOPEView)
#             global TEMPData
#             TEMPData = matches
#             data = generateData(matches)
#             return render_template('result.html', result=result, data=data, rows=rows, edit=editHistory)
#     else:
#         return render_template('404.html')
#
#
# @app.route("/login", methods=("GET", "POST"))
# def login():
#     """Log in a registered user by adding the user id to the session."""
#     error = None
#     if request.method == "POST":
#         username = request.form["username"]
#         password = request.form["password"]
#         conn = create_connection(DATABASE)
#         cur = conn.cursor()
#         user = cur.execute(
#             "SELECT * FROM users WHERE username = ?", (username,)
#         ).fetchone()
#         # print(user)
#
#         if user is None:
#             error = "Incorrect username."
#         elif not check_password_hash(user[2], password):
#             error = "Incorrect password."
#
#         if error is None:
#             # store the user id in a new session and return to the index
#             session.clear()
#             session["user_id"] = user[0]
#             return redirect(url_for("index"))
#         else:
#             # print(error)
#             return render_template("login.html", message=error)
#         flash(error)
#     return render_template("login.html", message = error)
#
#
# @app.route("/register", methods=("GET", "POST"))
# def register():
#     """Register a new user.
#
#         Validates that the username is not already taken. Hashes the
#         password for security.
#         """
#     error = None
#     if request.method == "POST":
#         username = request.form["username"]
#         password = request.form["password"]
#         conn = create_connection(DATABASE)
#
#         if not username:
#             error = "Username is required."
#         elif not password:
#             error = "Password is required."
#         elif not (pd.read_sql("SELECT id FROM users WHERE username = ?", conn, params=[username]).empty):
#             error = "User {0} is already registered.".format(username)
#
#         if error is None:
#             # the name is available, store it in the database and go to
#             # the login page
#             cur = conn.cursor()
#             cur.execute("INSERT INTO users (username, password) VALUES (?, ?)",
#                 (username, generate_password_hash(password)),)
#             conn.commit()
#             return redirect(url_for("login"))
#         else:
#             # print(error)
#             return render_template("register.html", message = error)
#         flash(error)
#     return render_template("register.html", message = error)
#
#
# @app.route("/logout")
# def logout():
#     """Clear the current session, including the stored user id."""
#     session.clear()
#     return redirect(url_for("index"))