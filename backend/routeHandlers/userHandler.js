const User = require("../models/user");
const genPassword = require('../lib/passwordUtils').genPassword;


// const express = require('express');
// const mongoose = require('mongoose');
// const passport = require('passport');



//signup
const addUser = (req, res,) => {

  const saltHash = genPassword(req.body.password);

  const salt = saltHash.salt;
  const hash = saltHash.hash;
  const details = new User({
    personalInformation: {
      name: req.body.name,
      DOB: req.body.dateOfBirth
    },
    contactDetails: {
      email: req.body.email,
    },
    loginDetails: {
      hash: hash,
      salt: salt,
    },
    userProfileURL: "http://www.google.com"
  });
  details.save()
    .then((savedDoc) => {
      res.json({
        isSignUpSuccessfull: true,
        password: req.body.password,
        email: req.body.email
      });
    })
    .catch(err => { res.json({ isSignUpSuccessfull: false }); });
};

// editProfile handler

const editUser = async (req, res) => {
  const filter = req.user._id;
  await User.findByIdAndUpdate(filter , {
    personalInformation : {
      ...req.user.personalInformation,
      birthPlace: req.body.birthPlace,
      currentCity: req.body.currentCity,
      profession : req.body.profession
    },
    contactDetails : {
      ...req.user.contactDetails,
      phone : req.body.phone   //unique
    },
    Bio : req.body.Bio,
    // profileImageURL : req.body.profileImageURL,
    // coverImageURL : req.body.coverImageURL,
    // userProfileURL: req.body.userProfileURL,
    followers : [],
    following : [],
    community : req.body.community,
    interests: req.body.interests,
    
  }, (err , details) => {
    if(err){
      res.json({isUpdated: false})
    }else{
      res.json({isUpdated: true});

    }
  });

  //console.log(res.body);
  
  // res.json(req.body);
}


//req.isAuthenticated() will return true if user is logged in

const sendUser = (req, res) => {
  if (req.isAuthenticated()) {

    const checkComplete = {
      personalInformation: false,
      contactDetails: false,
      interests: false,
      Bio: false,
      profileImageURL: false,
      coverImageURL: false,
    }

    if (!(req.user.personalInformation.birthPlace === undefined ||
      req.user.personalInformation.currentCity === undefined ||
      req.user.personalInformation.profession === undefined)
    ) {
      checkComplete.personalInformation = true;
    }

    if (req.user.contactDetails.phone !== undefined) {
      checkComplete.contactDetails = true;
    }
    if (req.user.Bio !== undefined || req.user.Bio === "") {
      checkComplete.Bio = true;
    }
    if (req.user.userProfileURL !== undefined) {
      checkComplete.userProfileURL = true;
    }
    if (req.user.coverImageURL !== undefined) {
      checkComplete.coverImageURL = true;
    }
    if (req.user.interests.length !== 0) {
      checkComplete.interests = true;
    }

    const currentUser = {
      personalInformation: {
        name: req.user.personalInformation.name,
        DOB: req.user.personalInformation.DOB,
        birthPlace: req.user.personalInformation.birthPlace,
        currentCity: req.user.personalInformation.currentCity,
        profession: req.user.personalInformation.profession
      },
      contactDetails: {
        email: req.user.contactDetails.email,  //unique
        phone: req.user.contactDetails.phone   //unique
      },
      checkComplete: checkComplete,
      interests: req.user.interests,
      Bio: req.user.Bio,
      profileImageURL: req.user.profileImageURL,
      coverImageURL: req.user.coverImageURL,
      userProfileURL: req.user.userProfileURL,
      community: req.user.community
    };
    res.send(currentUser);
  } else {
    res.send(401);
  }
}

//login


module.exports = {
  addUser,
  sendUser,
  editUser
};