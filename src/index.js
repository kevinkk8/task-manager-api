const express = require("express")
const user_route = require("./routers/user.js")
const task_route = require("./routers/task.js")

const app = express()
require("./db/mongoose.js")
const port = process.env.PORT || 3000

// parse incoming json to an object
app.use(express.json()) 

// routes
app.use(user_route)
app.use(task_route)

app.listen(port, () => {
    console.log(port)
})