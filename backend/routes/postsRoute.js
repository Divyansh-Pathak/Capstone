const express = require("express");
const router = express.Router();
const multer = require('multer');
const storage = require('../config/gridStorage');
const mongoose = require('mongoose');
const Grid = require('gridfs-stream');
const Post = require('../models/posts');
const crypto = require("crypto");

const connection = mongoose.connection;

let gfs;

connection.once('open', () => {
  // Init stream
  gfs = Grid(connection.db, mongoose.mongo);
  gfs.collection('uploads');
});

const upload = multer({ storage });

// @route GET /
// @desc Loads form
router.get('/', (req, res) => {
  gfs.files.find().toArray((err, files) => {
    // Check if files
    if (!files || files.length === 0) {
      res.render('index', { files: false });
    } else {
      files.map(file => {
        if (
          file.contentType === 'image/jpeg' ||
          file.contentType === 'image/png'
        ) {
          file.isImage = true;
        } else {
          file.isImage = false;
        }
      });
      res.render('index', { files: files });
    }
  });
});


// @route POST /upload
// @desc  Uploads file to DB
router.post('/upload', upload.array('files'), async (req, res) => {

  console.log("Array should be multer", req.body);
  console.log("Array of files", req.files);

 

    let filenameAsId = req.files[0].filename;

   
  
    let fileNames = [];
    let contentType = [];
    for (let i = 0; i < req.files.length; i++) {
      fileNames.push(`/image/${req.files[i].filename}`);  
      contentType.push(req.files[i].contentType); 
    }
  
    const postDetails = new Post(
      {
        isMedia: true,
        postID: filenameAsId,
        fileType: contentType,
        postFileURL: fileNames, //to be set
        caption: req.body.caption,
        likes: [],
        dislikes: 0,
        uploadedBy: {
          userName: req.user.personalInformation.name,
          currentCity: req.user.personalInformation.currentCity,
          profileImageURL: req.user.profileImageURL,
          userProfileURL: req.user.userProfileURL,
        },
        userProfileURL: "http://www.google.com",
        views: 0,
        date: new Date(),
        tags: req.body.tags
      });
    postDetails.save();
  
    res.json({fileNames});

  


});

router.post('/uploadText', async (req, res) => {

    
    let filename =  crypto.randomBytes(32).toString('hex');

    console.log({hello: req.body, file: filename});
    

    const postDetails = new Post(
      {
        isMedia: false,
        postID: filename,
        fileType: "text",
        caption: req.body.caption,
        likes: [],
        dislikes: 0,
        uploadedBy: {
          userName: req.user.personalInformation.name,
          currentCity: req.user.personalInformation.currentCity,
          profileImageURL: req.user.profileImageURL,
          userProfileURL: req.user.userProfileURL,
        },
        views: 0,
        date: new Date(),
        tags: req.body.tags
      });
    postDetails.save();
  
    res.json({filename});

  
});

router.post('/multipleUpload', upload.array('files'), async (req, res) => {
  console.log("Array should be here bu multer", req.body);
  console.log("Array file", req.files);
  res.json({ file: req.files, body: req.body});
});




//@update like

router.post("/like", async (req, res) => {
  const filter = { postID: req.body.postID };
  let result = await Post.findOne(filter);
  if(req.body.isLiked){
    console.log({condition: req.body.isLiked});
    result.likes.push(req.user.contactDetails.email);

  }else{
    console.log({condition: result.likes});
    result.likes= result.likes.filter((email) => email!==req.user.contactDetails.email);
    
  }
  
  result.save().then(()=>{

    res.json({likeRequest: "successfull"});

  }).catch(err => res.json({likeRequest: "unsuccessfull"}))
  

});


//@update Comment

router.post("/comment", async (req, res) => {
  const filter = { postID: req.body.postID };
  let result = await Post.findOne(filter);
  result.CommentBox.push({
    commentByUser: {
      userName: req.user.personalInformation.name,
      currentCity: req.user.personalInformation.currentCity,
      profileImageURL: req.user.profileImageURL,
      userProfileURL: req.user.userProfileURL,
    },
    comment: req.body.comment
  });
  await result.save();
  res.json("Comment Uploaded");

});



// @route GET /files
// @desc  Display all files in JSON
router.get('/files', (req, res) => {
  gfs.files.find().toArray((err, files) => {
    // Check if files
    if (!files || files.length === 0) {
      return res.status(404).json({
        err: 'No files exist'
      });
    }

    // Files exist
    return res.json(files);
  });
});

router.get('/posts', async (req, res) => {

  const checker = ["Photography", "Reading Books"];

  const filter = { tags : { $in : checker }};

  const post = await Post.find(filter);

  // array.sort(function(a,b){
  //   // Turn your strings into dates, and then subtract them
  //   // to get a value that is either negative, positive, or zero.
  //   return new Date(b.date) - new Date(a.date);
  // });


 
  if (!post || post.length === 0) {
    res.status(404).json({
      err: "NO POST YET"
    });
  } else {


    return res.json(post);
  }
});

// router.get('/selectedPosts', async (req, res) => {

//   const selector = {tags: ""}
//   const post = await Post.find();
//   if (!post || post.length === 0) {
//     res.status(404).json({
//       err: "NO POST YET"
//     });
//   } else {


//     return res.json(post);
//   }
// });

// @route GET /image/:filename
// @desc Display Image
router.get('/posts/:postID', async (req, res) => {

  const post = await Post.findById(req.params.postID);


  // gfs.files.findOne({ filename: post.postFileName }, (err, file) => {
  //   // Check if file
  //   if (!file || file.length === 0) {
  //     return res.status(404).json({
  //       err: 'No file exists'
  //     });
  //   }

  //   // Check if image
  //   if (file.contentType === 'image/jpeg' || file.contentType === 'image/png') {
  //     // Read output to browser
  //     const readstream = gfs.createReadStream(file.filename);
  //     readstream.pipe(res);
  //   }
  //    else {
  //     res.status(404).json({
  //       err: 'Not an image'
  //     });
  //   }
  // });
});



router.get('/image/:filename', (req, res) => {
  gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
    // Check if file
    if (!file || file.length === 0) {
      return res.status(404).json({
        err: 'No file exists'
      });
    }

    // Check if image
    if (file.contentType === 'image/jpeg' || file.contentType === 'image/png' || file.contentType === 'video/mp4') {
      // Read output to browser
      const readstream = gfs.createReadStream(file.filename);
      readstream.pipe(res);
      // readstream.on('data', (chunk) => {
      //   res.render('newHandlebarFile', { image: chunk.toString('base64') });
      // });
    } else {
      res.status(404).json({
        err: 'Not an image'
      });
    }
  });
});


module.exports = router;
