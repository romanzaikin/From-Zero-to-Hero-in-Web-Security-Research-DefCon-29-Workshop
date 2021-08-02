const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1/challenge', { useNewUrlParser: true } );

const Schema = mongoose.Schema;

const forumDataSchema = new Schema({
    username: String,
    msg: String,
});

let forum = module.exports = mongoose.model('forum', forumDataSchema);

