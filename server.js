var express = require("express");
var bodyParser = require("body-parser");
var app = express(app);
var passport = require('passport');
var Strategy = require('passport-twitter').Strategy;
var port = process.env.PORT || 8080;

var MongoClient = require("mongodb").MongoClient;
var mongoose = require("mongoose");
var poll = require("./models/poll");



mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/myDatabase');
mongoose.Promise = global.Promise;
// poll.remove({}, function(){}); 
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({ extended: true })); 
passport.use(new Strategy({
    consumerKey: "Ik0XJT3zd2E37qI6GXm1ZrMIE",
    consumerSecret: "WDK2oUs2GSgsmEBX7gwOlxOG9H3dPHQPDMp0aPxPpd2szBovx2",
    callbackURL: 'https://voting-app-nmaddp.herokuapp.com/login/twitter/return'
  },
  function(token, tokenSecret, profile, cb) {
    // In this example, the user's Twitter profile is supplied as the user
    // record.  In a production-quality application, the Twitter profile should
    // be associated with a user record in the application's database, which
    // allows for account linking and authentication with other identity
    // providers.
    return cb(null, profile);
  }));
passport.serializeUser(function(user, cb) {
  cb(null, user);
});

passport.deserializeUser(function(obj, cb) {
  cb(null, obj);
});
// app.use(require('morgan')('combined'));
app.use(require('cookie-parser')());
app.use(require('body-parser').urlencoded({ extended: true }));
app.use(require('express-session')({ secret: 'keyboard cat', resave: true, saveUninitialized: true }));

// Initialize Passport and restore authentication state, if any, from the
// session.
app.use(passport.initialize());
app.use(passport.session());


//data for test 
// var data = new poll({
// 		  pollName : "Test data" ,
//       userId : "asd" ,
//       options : [{
//       optionName : "Duc" ,
//       optionVote : 2  
//       }]
// 		})
// 		data.save();


app.get('/',function(req,res){
  // // console.log(req.user);
  res.render('home', { user: req.user });
  
 
});

app.get('/singlePoll',function(req,res){
  if (req.user) {
		res.render('single-poll', { user : req.user });
	}
	else {
		res.render('single-poll', { user : null });
	}
})

// get data from poll and push to html
app.get('/getSinglePoll',function(req, res) {
  
  
    var id = req.query.id;
    poll.find({
      _id : id 
    },function(err,data){
        if(err) console.log("Err");
        
        if(req.user) {
          
    data.push({"userId":req.user.id});
    
    res.json({"poll":data});
  } else 
        res.json({"poll":data});
        
    
});
});

app.get('/login',
  passport.authenticate('twitter'));

app.get('/login/twitter/return', 
  passport.authenticate('twitter', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/');
    
  });
app.get('/logout',function(req,res){
    req.logout();
    res.redirect('/');
})


app.get('/create-poll',function(req,res){
  res.render('create-poll',{ user: req.user });
})
app.listen(port,function(){
    console.log("Server is running");
})

app.get('/createPoll',function(req,res){
		var name =  req.query.title ;
		var options = req.query.options.split(";");
		var optionAndVote = [];
		for(var i=0;i<options.length;i++){
		  var tmp = {
		    optionName : options[i] ,
        optionVote : 0  
		  }
		  optionAndVote.push(tmp);
		}
		
		var userId= req.user.id;
		var data = new poll({
		  pollName : name ,
      userId : userId ,
      options : optionAndVote
		})
		data.save(err=>{
		  if(err){
		    return res.send(err);
		  }
		});
		res.render('home', { user: req.user });
	} );
	
	
	// get all of the polls
app.get('/getPolls', function(req, res){
        
        poll.find({},function(err,data){
        if(err) console.log("Err");
        
        res.json({"polls":data});
  }) 
   
});

// vote for a option 

app.get('/vote',function(req,res){
  var pollId= req.headers.referer.split('=')[1];
  console.log(pollId);
  var check ;// check optin is new or old
  if(req.query.select!=='Create new option'){
    var vote = req.query.select;
    check = "old" ;
    
  } else {
    vote = req.query.select2;
    check ="new" ;
  }
    // poll.findOneAndUpdate({_id:pollId}, req.body, function (err, data) {
    //   for(var i=0;i<data.options.length;i++){
    //     if(vote==data.options[i].optionName)  data.options[i].optionVote+=1;
    //   }
     
     poll.findById(pollId, function (err, data) {
  
  if(check =="old"){
  for(var i=0;i<data.options.length;i++){
    
        if(vote==data.options[i].optionName)  data.options[i].optionVote+=1;
      }
  } else {
    var length=data.options.length;
    var option={
      optionName : vote ,
      optionVote : 1 
    }
    data.options.push(option);
  }
      
      data.save(function(){});
      res.redirect(req.get('referer'));
});
  
})

// remove a vote

app.get("/remove",function(req,res){
  var pollId= req.headers.referer.split('=')[1];
//   poll.find({
//     _id : pollId
// }, function (err, docs) {
//     docs.remove(); //Remove all the documents that match!
//     res.redirect("/");
// })
poll.find({ _id:pollId }).remove().exec();
res.redirect("/");
})

// show my poll
app.get("/my-poll",function(req,res){
  // if(!req.user) {
  //   res.send("Please login first");
  // }
  res.render('my-poll', { user: req.user });
});

app.get("/getMyPolls",function(req,res){
  var userId= req.user.id;
   poll.find({
     userId: userId
   },function(err,data){
        if(err) console.log("Err");
        
        res.json({"polls":data});
});
});

// go to home 

app.get("/home",function(req,res){
  res.render('home', { user: req.user });
})
