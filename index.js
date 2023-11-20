const express = require('express');
const mongo = require("mongodb");
const mongoose = require("mongoose");
const bodyParser = require('body-parser');
const cors = require('cors');
const validURL = require('valid-url');
const shortID = require('shortid');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// MongoDB and mongoose connect
mongoose.connect(process.env.MONGO_URII, { useNewUrlParser: true, useUnifiedTopology: true });

//Database Schema
const Schema = mongoose.Schema;
const urlSchema = new Schema({
  original_url: String,
  short_url: String
});
const URL = mongoose.model('URL', urlSchema);


// App middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use('/public', express.static(`${process.cwd()}/public`));
app.get('/', function(req, res) {
  res.sendFile(`${process.cwd()}/views/index.html`);
});





// Response for POST request
app.post('/api/shorturl', async (req, res) => {
  const { url } = req.body;

  // Generate a short URL using shortID
  const shortURL = shortID.generate();

  console.log('Received URL:', url);
  // Check if the provided URL is a valid web URI
  if (!validURL.isWebUri(url)) {
    console.log('Invalid URL:', url);
    res.json({
      error: 'invalid url',
    });
  } else {
    console.log('Valid URL:', url)
    try {
      const trimmedURL = url.trim();

      // Check if the URL already exists in db
      const existingURL = await URL.findOne({ original_url: new RegExp('^' + trimmedURL + '$', 'i') });


      console.log('Existing URL:', existingURL);
      if (existingURL) {
        console.log('URL already exists in DB:', trimmedURL);
        res.json({
          original_url: existingURL.original_url,
          short_url: existingURL.short_url,
        });
      } else {
        const newURL = await URL.create({
          original_url: trimmedURL,
          short_url: shortURL,
        });

        console.log('New URL created:', newURL)
        res.json({
          original_url: newURL.original_url,
          short_url: newURL.short_url,
        });
      }
    } catch (err) {
      console.error('Error:', err);
      console.error(err);
      res.status(500).json('Server error..');
    }
  }
});

// Redirect shortened URL to Original URL
app.get('/api/shorturl/:shortURL?', async (req, res) => {
  try {
    if (!req.params.shortURL) {
      return res.status(400).json('Invalid short URL');
    }

    console.log('Requested short URL:', req.params.shortURL);
    const urlParams = await URL.findOne({ short_url: { $regex: new RegExp('^' + req.params.shortURL + '$', 'i') } });
    console.log('Found URL Params:', urlParams);

    if (urlParams) {
      return res.redirect(urlParams.original_url);
    } else {
      console.log('No URL found');
      return res.status(404).json('No URL found');
    }

  } catch (err) {
      console.log(err);
      res.status(500).json('Server error..');
    }
  });

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
