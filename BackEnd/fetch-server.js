const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const propertiesReader = require('properties-reader');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

// Load the properties file to get the MongoDB connection details
let propertiesPath = path.resolve(__dirname, 'conf/demo.db.properties');
let properties = propertiesReader(propertiesPath);

let dbPrefix = properties.get('db.prefix');
let dbUsername = encodeURIComponent(properties.get('db.user'));
let dbPwd = encodeURIComponent(properties.get('db.pwd'));
let dbUrl = properties.get('db.dbUrl');
let dbName = properties.get('db.dbName');
let dbParams = properties.get('db.params');

// Construct the MongoDB URI
const uri = `${dbPrefix}${dbUsername}:${dbPwd}${dbUrl}${dbParams}`;

const client = new MongoClient(uri, { serverApi: ServerApiVersion.v1 });
let db;

client.connect()
  .then(() => {
    console.log('MongoDB connected successfully');
    db = client.db(dbName);
    console.log('Database initialized:', dbName);
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err);
  });

const app = express();

// Middleware setup
app.use(cors());
app.use(morgan('short'));
app.use(express.json());

// Route to get all lessons
app.get('/collections/lessons', async (req, res, next) => {
  try {
    const lessons = await db.collection('lessons').find({}).toArray();
    res.json(lessons);
  } catch (err) {
    next(err);
  }
});

// Route to add a new lesson
app.post('/collections/lessons', async (req, res, next) => {
  try {
    const newLesson = req.body;
    const result = await db.collection('lessons').insertOne(newLesson);
    const insertedLesson = await db.collection('lessons').findOne({ _id: result.insertedId });
    res.status(201).send(insertedLesson);
  } catch (err) {
    console.error('Error occurred while inserting new lesson:', err);
    res.status(500).send({ message: 'Failed to insert lesson', error: err.message });
  }
});

// Route to update a lesson by ID
app.put('/collections/lessons/:id', async (req, res, next) => {
  try {
    const lessonId = req.params.id;
    const updatedFields = req.body;

    if (!ObjectId.isValid(lessonId)) {
      return res.status(400).send({ msg: "Invalid ID" });
    }

    const result = await db.collection('lessons').updateOne(
      { _id: new ObjectId(lessonId) },
      { $set: updatedFields }
    );

    if (result.matchedCount === 0) {
      return res.status(404).send({ msg: "Lesson not found" });
    }

    const updatedLesson = await db.collection('lessons').findOne({ _id: new ObjectId(lessonId) });

    res.status(200).send(updatedLesson);

  } catch (err) {
    console.error('Error occurred while updating lesson:', err);
    res.status(500).send({ message: 'Failed to update lesson', error: err.message });
  }
});

// Route to delete a lesson by ID
app.delete('/collections/:collectionName/:id', function (req, res, next) {
  console.log('DELETE Request Received for ID:', req.params.id);

  if (!ObjectId.isValid(req.params.id)) {
    return res.status(400).send({ msg: "invalid ID" });
  }

  req.collection.deleteOne(
    { _id: new ObjectId(req.params.id) },
    function (err, result) {
      if (err) {
        console.error('Error during deletion:', err);
        return next(err);
      }
      console.log('Delete Result:', result);
      res.send(
        result.deletedCount === 1
          ? { msg: "success" }
          : { msg: "error: document not found" }
      );
    }
  );
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).send('Server Error');
});

// 404 error handler
app.use((req, res) => {
  res.status(404).send('Resource not found!');
});

// Start the server
app.listen(3000, () => {
  console.log('Server started on port 3000');
});
