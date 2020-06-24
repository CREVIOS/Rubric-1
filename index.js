const express=require("express"); 
const bodyParser=require("body-parser"); 
const app = express();
const path = require('path');
var cookieSession = require('cookie-session')
require('dotenv').config();

var firebase = require("firebase/app");
require("firebase/firestore");

var firebaseConfig = {
	apiKey: process.env.FIREBASE_API_KEY,
	authDomain: process.env.FIREBASE_AUTH_DOMAIN,
	databaseURL: process.env.FIREBASE_DB_DOMAIN,
	projectId: "ams-v4",
	storageBucket: process.env.FIREBASE_,
	messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
	appId: process.env.FIREASE_APP_ID,
	measurementId: process.env.MEASURE_ID
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
let db = firebase.firestore();

app.engine('view engine', require('ejs').renderFile);
app.use(express.static('public'));
app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ 
    extended: true
}));

app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2'],
  maxAge: 24 * 60 * 60 * 1000
}))

function isAuthenticated(req) {
	if (req.session.authenticatedUser && req.session.authenticatedUserLevel && req.session.authenticatedUserRole) {
		return true;
	} else {
		req.session.authenticatedUser = undefined;
		req.session.authenticatedUserRole = undefined;
		req.session.authenticatedUserLevel = undefined;
		return false;
	}
};

function getArticle(req, res, article_id, asUser, completion) {
	if (typeof article_id === "undefined") {
		return res.render(path.join(__dirname+'/views/result.ejs'), {	resultMessage: "Undefined<br>article<br>id!",
																		gifURL : "https://media.giphy.com/media/26BROrSHlmyzzHf3i/giphy.gif"});
	}

	// Get article data with firebase
	db.collection("articles").doc(article_id).get().then(doc => {
    	if (!doc.exists) {
    		console.log('Error getting document');
			return res.render(path.join(__dirname+'/views/result.ejs'), {	resultMessage: "Cannot<br>find the<br>article!",
																			gifURL : "https://media.giphy.com/media/26BROrSHlmyzzHf3i/giphy.gif"});
    	} else {
    		let tempData = doc.data();
    		let found = false;
    		for (var i = tempData.editors.length - 1; i >= 0; i--) {
    			if (tempData.editors[i].email == asUser || req.session.authenticatedUserLevel > 1) {
    				found = true;
					completion(req, res, tempData, asUser);
					return;
    			}
    		}
    		if (!found) {
				return res.render(path.join(__dirname+'/views/result.ejs'), {	resultMessage: "Doesn't seem<br>like you are<br>the editor :(",
																				gifURL : "https://media.giphy.com/media/26BROrSHlmyzzHf3i/giphy.gif"});
    		}
    	}
  	})
  	.catch(err => {
    	console.log('Error getting document', err);
		return res.render(path.join(__dirname+'/views/result.ejs'), {	resultMessage: "Error<br>during<br>query!",
																		gifURL : "https://media.giphy.com/media/26BROrSHlmyzzHf3i/giphy.gif"});
  	});
}

app.get("/get_rubric", function(req, res) {
	if (!isAuthenticated(req)) {
		return res.render(path.join(__dirname+'/views/result.ejs'), {	resultMessage: "You are<br>NOT<br>authenticated!<br>Please login in the JMS",
																		gifURL : "https://media.giphy.com/media/26BROrSHlmyzzHf3i/giphy.gif"});
	}
	let asUser = req.session.authenticatedUser;
	if (req.session.authenticatedUserLevel > 1) {
		if (typeof req.query.asUser !== "undefined") {
			asUser = req.query.asUser;
		}
	}
	getArticle(req, res, req.query.id, asUser, function(req, res, tempData, asUser) {
		let rubrics = tempData.rubrics;
		if (typeof rubrics === "undefined") { rubrics = {};	}
		let owners = Object.keys(rubrics);
		let rubric = rubrics[asUser];
		if (typeof rubric === "undefined") { rubric = [{}];	}
		let readOnly = false;
		if (asUser != req.session.authenticatedUser) {
			readOnly = true;
		}
		return res.render(path.join(__dirname+'/views/index.ejs'), {id: req.query.id, readOnly: readOnly, owners: owners, title: tempData.title, rubric: rubric[rubric.length - 1], article_id: req.query.id, editor: req.session.authenticatedUser, asUser: asUser});
	})
});

app.post('/save_form', function(req,res){
	if (!isAuthenticated(req)) {
		return res.render(path.join(__dirname+'/views/result.ejs'), {	resultMessage: "You are<br>NOT<br>authenticated!<br>Please login to the JMS",
																		gifURL : "https://media.giphy.com/media/26BROrSHlmyzzHf3i/giphy.gif"});
	}
	getArticle(req, res, req.query.id, req.session.authenticatedUser, function(req, res, oldData) {
		if (typeof oldData.rubrics === "undefined") { oldData.rubrics = {}; }
		if (typeof oldData.rubrics[req.session.authenticatedUser] === "undefined") { oldData.rubrics[req.session.authenticatedUser] = []; }
		if (oldData.rubrics[req.session.authenticatedUser].length > 10) {
			oldData.rubrics[req.session.authenticatedUser].shift();
		}
		oldData.rubrics[req.session.authenticatedUser].push(req.body);
        let article = db.collection("articles").doc(req.query.id);
		article.update(oldData);
		return res.render(path.join(__dirname+'/views/result.ejs'), {	resultMessage: "Thank<br>you for<br>your work<br> <3",
																		gifURL : "https://media.giphy.com/media/RtXueZ1RxcBna/giphy.gif"});
	})
})

app.post('/autosave_form', function(req, res) {
	if (!isAuthenticated(req)) {
		return res.sendStatus(403);
	}
	getArticle(req, res, req.query.id, function(req, res, oldData) {
		if (typeof oldData.rubrics === "undefined") { oldData.rubrics = {}; }
		if (typeof oldData.rubrics[req.session.authenticatedUser] === "undefined") { oldData.rubrics[req.session.authenticatedUser] = []; }
		if (oldData.rubrics[req.session.authenticatedUser].length > 10) {
			oldData.rubrics[req.session.authenticatedUser].shift();
		}
		oldData.rubrics[req.session.authenticatedUser].push(req.body);
        let article = db.collection("articles").doc(req.query.id);
		article.update(oldData);
		return res.sendStatus(200);
	})
})

app.listen(3000,() => console.log('listening at 3000'));
    