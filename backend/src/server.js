import express from "express"
import dotenv from "dotenv"
import authRoutes from "./routes/auth.route.js"
import messageRoutes from "./routes/message.route.js"

dotenv.config()
const app = express();

const PORT = process.env.PORT || 3000

app.use("/api/auth", authRoutes)
app.use("/api/messages", messageRoutes)


app.listen(process.env.PORT, () => {
    console.log(`Server is running at port:${PORT}`)
})