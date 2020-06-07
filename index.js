
var express=require("express"); 
var bodyParser=require("body-parser"); 
const Datastore = require('nedb');
const app = express();
var path = require('path');

app.listen(3000,() => console.log('listening at 3000'));
app.use(express.static(path.join(__dirname, 'public')));


app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ 
    extended: true
})); 
  
const database = new Datastore('database.db');
database.loadDatabase();


app.post('/sign_up', function(req,res){ 
 console.log('I got a req');
    var name = req.body.name; 
    var email =req.body.email; 
    var score01 = req.body.score01;
    var cmnt01 =req.body.cmnt01; 
	 var score02 = req.body.score02;
    var cmnt02 =req.body.cmnt02;
	 var score03 = req.body.score03;
    var cmnt03 =req.body.cmnt03;
	 var score04 = req.body.score04;
    var cmnt04 =req.body.cmnt04;
	var score05 = req.body.score05;
    var cmnt05 =req.body.cmnt05;
	var score06 = req.body.score06;
    var cmnt06 =req.body.cmnt06;
    var score07 = req.body.score07;
    var cmnt07 =req.body.cmnt07;
	var score08 = req.body.score08;
    var cmnt08 =req.body.cmnt08;
	var score09 = req.body.score09;
    var cmnt09 =req.body.cmnt09;
	var score10 = req.body.score10;
    var cmnt10 =req.body.cmnt10;
  
    var data = { 
        "name": name, 
        "email":email, 
        "score01": score01,
		"commnet01": cmnt01,
		"score02": score02,
		"commnet02": cmnt02,
		"score03": score03,
		"commnet03": cmnt03,
		"score04": score04,
		"commnet04": cmnt04,
		"score05": score05,
		"commnet05": cmnt05,
		"score06": score06,
		"commnet06": cmnt06,
		"score07": score07,
		"commnet07": cmnt07,
		"score08": score08,
		"commnet08": cmnt08,
		"score09": score09,
		"commnet09": cmnt09,
		"Final Score": score10,
		"Final Comment": cmnt10
    } 
database.insert(data);	
 return res.redirect('test.html');

 
})
	
    