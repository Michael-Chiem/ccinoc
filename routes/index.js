const express = require('express');
const router = express.Router();
const Record = require('../models/record'); // Ensure this path is correct

// Home page
router.get('/', (req, res) => {
  res.render('index');
});

// Search functionality
router.get('/search', async (req, res) => {
  const keyword = req.query.keyword;
  try {
    const results = await Record.find({
      stringFields: { $regex: keyword, $options: 'i' }
    });
    req.session.searchResultsUrl = req.originalUrl; // Save the search URL to session
    res.render('results', { results });
  } catch (err) {
    console.error('Error searching data:', err);
    res.status(500).send('Error searching data');
  }
});

// Edit record page
router.get('/edit/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const record = await Record.findById(id);
    res.render('edit', { record });
  } catch (err) {
    console.error('Error retrieving record:', err);
    res.status(500).send('Error retrieving record');
  }
});

// Handle record update
router.post('/edit/:id', async (req, res) => {
  const id = req.params.id;
  const { stringFields, linkFields, linkLabels, imageFields } = req.body;

  const updatedFields = {
    stringFields: Array.isArray(stringFields) ? stringFields.filter(Boolean) : [],
    linkFields: Array.isArray(linkFields) && Array.isArray(linkLabels) ?
                linkFields.map((url, index) => ({ url, label: linkLabels[index] })).filter(link => link.url && link.label) : [],
    imageFields: Array.isArray(imageFields) ? imageFields.filter(Boolean) : []
  };

  try {
    await Record.findByIdAndUpdate(id, updatedFields, { new: true });
    const redirectUrl = req.session.searchResultsUrl || '/';
    res.redirect(redirectUrl); // Redirect back to the search results page or home if no search
  } catch (err) {
    console.error('Error saving data:', err);
    res.status(500).send('Error saving data');
  }
});

// Handle new record submission
router.post('/submit', async (req, res) => {
  const { stringFields, linkFields, linkLabels, imageFields } = req.body;

  const newRecord = new Record({
    stringFields: Array.isArray(stringFields) ? stringFields.filter(Boolean) : [],
    linkFields: Array.isArray(linkFields) && Array.isArray(linkLabels) ?
                linkFields.map((url, index) => ({ url, label: linkLabels[index] })).filter(link => link.url && link.label) : [],
    imageFields: Array.isArray(imageFields) ? imageFields.filter(Boolean) : []
  });

  try {
    await newRecord.save();
    res.redirect('/'); // Redirect to home after successful submission
  } catch (err) {
    console.error('Error saving new record:', err);
    res.status(500).send('Error saving new record');
  }
});

module.exports = router;
