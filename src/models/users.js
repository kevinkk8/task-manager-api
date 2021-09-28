const mongoose = require("mongoose")
const validator = require("validator")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const Task = require("./tasks")

const userSchema = new mongoose.Schema({
    name : {
        type : String,
        required: true,
        trim: true,
        unique: true
    },
    email : {
        type: String,
        required : true,
        unique : true,
        trim: true,
        lowercase : true,
        validate (value) {
            if(!validator.isEmail(value)){
                throw new Error("This email is not valid")
            }
        }
    },
    password : {
        type: String,
        required : true,
        trim: true,
        minLength : 7,
        validate (value) {
            if(value.toLowerCase().includes('password')){
                throw new Error("This password is not valid")
            }
        }
    },
    age : {
        type : Number,
        default : 16,
        validate (value) {
            if(value <= 0) {
                throw new Error("Age must be positive")
            }
        }
    },
    tokens : [{
        token : {
            type : String,
            required : true
        }
    }],
    avatar : {
        type: Buffer
    }
}, {
    timestamps: true
})

userSchema.virtual('tasks', {
    ref : 'Task',
    localField: '_id',
    foreignField: 'owner'
})

userSchema.methods.generateAuthToken = async function() {
    const user = this
    const token = jwt.sign({ id : user._id.toString() }, process.env.JWT_SEC)

    user.tokens = user.tokens.concat({token})
    await user.save()
    return token
}

userSchema.methods.toJSON = function() {
    const user = this
    const userObj = user.toObject()

    delete userObj.password
    delete userObj.tokens
    delete userObj.avatar

    return userObj
}

userSchema.statics.findByCredentials = async (email, pass) => {
    const user = await User.findOne({email})
    if (!user) {
        throw new Error ("Unable to Log in")
    }

    const isMatch = await bcrypt.compare(pass, user.password)

    if (!isMatch) {
        throw new Error ("Unable to Log in")
    }

    return user
}

userSchema.pre('save', async function(next) {
    const user = this

    if (user.isModified('password')){
        user.password = await bcrypt.hash(user.password, 8)
    }

    next()
})

userSchema.pre('deleteOne',{ document: true, query: false }, async function(next) {
    const user = this

    await Task.deleteMany({owner: user._id})
    next()
})

const User = mongoose.model('User', userSchema)

module.exports = User