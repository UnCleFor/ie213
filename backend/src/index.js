const express = require("express");
const dotenv = require('dotenv');
const mongoose  = require("mongoose");
const routes = require("./routes");
const cors = require("cors");
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser')

dotenv.config()

const app = express()
const port = process.env.PORT || 3001

//react-query
app.use(cors({
    origin: 'https://ie213.vercel.app',
    //origin: 'http://localhost:3000',
    credentials: true
  }));
app.set('trust proxy', 1);  
app.use(cookieParser())
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
// định tuyến
routes(app);

// Kết nối mongodb
mongoose.connect(`${process.env.MONGO_DB}`)
.then(() => {
    console.log('Ket noi database thanh cong')
})
.catch((err) => {
    console.log('Loi')
})

app.use(bodyParser.json())

app.listen(port,() => {
    console.log('Server is running in port: ',+port)
})
// dùng lệnh "npm start" để chạy server ở cổng 3001, nhớ cd vào backend trước