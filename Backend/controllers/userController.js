import User from "../models/Usermodel.js";

import bcrypt from "bcryptjs";
import generateTokenANdSetTOken from "../utils/helpers/generateTokenSetCookie.js";
async function signUpuser(req, res) {
  try {
    const { name, email, username, password } = req.body;
    const user = await User.findOne({ $or: [{ email }, { username }] });

    if (user) {
      return res.status(400).json({ error: "user already exists " });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      name,
      email,
      username,
      password: hashedPassword,
    });

    await newUser.save();

    if (newUser) {
      generateTokenANdSetTOken(newUser._id, res);
      res.status(200).json({
        _id: newUser._id,
        name: newUser.name,
        username: newUser.username,
        email: newUser.email,
      });
    } else {
      res.status(400).json({ error: "invallid user data" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
    console.log("error in singup user");
  }
}

async function loginUser(req, res) {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    const isPasswordcorrect = await bcrypt.compare(password, user?.password || "");


    if (!user || !isPasswordcorrect) {
      return res.status(400).json({ error: "Invalid username or password " });
    }

    generateTokenANdSetTOken(user._id,res);

    res.status(200).json({user:user})

  } catch (error) {
    res.status(500).json({ error: error.message });
    console.log("error in login user");
  }
}

async function logoutUser (req,res){
 try {
    res.cookie("jwt","",{maxAge:1});
    res.status(200).json({message:"user logged out successfull"})
 } catch (error) {
    res.status(500).json({ error: error.message });
    console.log("error in logout user");
 }
}

async function followandunfollowuser (req,res){
    try {
        const {id}=req.params
        const usertoModify = await  User.findById(id);
        const currentUser = await User.findById(req.user._id);
        
        
        console.log(id, currentUser._id)
        if (id ==currentUser._id)return res.status(400 ).json({error:"you cannot follow or unfollow your self "})
        
        if (!usertoModify || !currentUser) return res.status(500).json({error:"user not found "})

        const isFolloiwng = currentUser.following.includes(id);

        if (isFolloiwng){
            //unfollow user
            //modify the current user following 
            await User.findByIdAndUpdate(req.user._id,{$pull:{following:id}})
            
            //modify the modified user followers 
            await User.findByIdAndUpdate(id,{$pull:{followers:req.user._id}})
            res.status(200).json({message:"user Unfollowed "})
        }else{
            //follow the user with id
            //modify the following of current user 
            await User.findByIdAndUpdate(req.user._id,{$push:{following:id}})
            
            // modify the  followers of modified user 
            await User.findByIdAndUpdate(id,{$push:{followers:req.user._id}})
            res.status(200).json({message:"user followed "})
            
        }



    } catch (error) {
        res.status(500).json({ error: error.message });
    console.log("error in follow & unfollow  user");
    }
}

async function updateUser (req,res){
const {name, email, username, password, profilePic,bio}=req.body;
const userId= req.user._id
try {
  let user = await User.findById(userId)
  if (!user) return res.status (400).json({error:'User not found '})

  if(req.params.id !== userId.toString()){
    res.status(400).json({error:"cannot update others profile "})
  }

  if (password){
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password,salt)
    user.password=hashedPassword
  }

  user.name=name || user.name
  user.email=email || user.email
  user.username=username || user.username
  user.profilePic=profilePic || user.profilePic
  user.bio=bio || user.bio

  await user.save();

  res.json({error:'profile updated succesfullly' ,user})

} catch (error) {
  res.status(500).json({ error: error.message });
    console.log("error in Update user");
}
}

async function getUserProfile (req,res){
try {
  const {username}=req.params
  const user = await User.findOne({username}).select("-password").select("-updatedAt")
  console.log(user)

  if (!user){
    return res.status(404).json ({error:"user not found "})
  }

  res.status(200).json(user)
} catch (error) {
  res.status(500).json({ error: error.message });
    console.log("error in getUserProfile ");
}
}
export { signUpuser, loginUser ,logoutUser,followandunfollowuser, updateUser,getUserProfile};
