const expr = require("express")
const User = require("../models/users")
const auth = require("../middleware/authentication")
const sharp = require('sharp')
const multer = require('multer')
const router = new expr.Router()
const { sendWelcomeEmail, sendCancelationEmail } = require('../emails/account')

///////////////// Login ///////////////////////

router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        if(!user) { return res.status(404).send() }
        res.send({user, token})
        
    } catch (e) {
        res.status(400).send(e)
    }
})

///////////////// Log Out ///////////////////////

router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter( (token) => {
            return token.token !== req.token
        })

        await req.user.save()
        res.send()
    } catch (e) {
      res.status(500).send()  
    }
})

router.post('/users/logout_all', auth, async (req, res) => {
    try {
        req.user.tokens = []
        await req.user.save()
        res.send()
    } catch (e) {
      res.status(500).send()  
    }
})


///////////////// Profile ///////////////////////

router.get('/users/me', auth, async (req, res) => {
    res.send(req.user)
})


///////////////// CRUD ///////////////////////

router.post('/users', async (req, res) => {
    const user = new User(req.body)
    
    try { 
        await user.generateAuthToken()
        await user.save()
        sendWelcomeEmail(user.email, user.name)
        res.status(201).send(user)
    } catch (e) {
        res.status(400).send(e)
    }
})

// router.get('/users/:id', async (req, res) => {
//     const id = req.params.id

//     try { 
//         const user = await User.findById(id)
//         if(!user) { return res.status(404).send() }
//         res.send(user)
//     } catch (e) {
//         res.status(500).send(e)
//     }

// })

router.patch('/users/me', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['name','email','password','age']
    const isValidUpdate = updates.every((update) => allowedUpdates.includes(update))

    if(!isValidUpdate){ return res.status(404).send( {error : 'Invalid Update' } ) }

    try {
        const user = req.user
        updates.forEach((update) => user[update] = req.body[update] )
        await user.save()

        res.send(user)
    } catch (e) {
        res.status(500).send(e)
    }
    
})

router.delete('/users/me', auth, async (req, res) => {
    try {
        await req.user.deleteOne();
        sendCancelationEmail(req.user.email, req.user.name)
        res.status(200).send(req.user)
    } catch (e) {
        res.status(500).send(e)
    }
})

/////////// Profile Photo ///////////////

const upload = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/)){
            return cb(new Error("Please upload a photo"))
        }

        cb(undefined, true)
    }
})

router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
    req.user.avatar = await sharp(req.file.buffer).resize({width: 250, height: 250}).png().toBuffer()
    await req.user.save()
    res.status(200).send()
}, (error, req, res, next) => {
    res.status(400).send({error: error.message})
})

router.get('/users/:id/avatar', async (req,res) => {
    try {
        const user = await User.findById(req.params.id)

        if (!user || !user.avatar) {
            throw new Error()
        }

        res.set('Content-Type', 'image/png')
        res.send(user.avatar)
    } catch (e) {
        res.status(400).send()
    }
})

router.delete('/users/me/avatar', auth, async (req,res) => {
    req.user.avatar = undefined
    await req.user.save()
    res.status(200).send()
})

module.exports = router