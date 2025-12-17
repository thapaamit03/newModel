const express=require('express');
const app=express();
const userRoutes=require('./Routes/userRoutes');
const connectToDB = require('./models/DB');
const cors=require('cors')
const cookieParser=require('cookie-parser');

app.use(express.json());
app.use(cors());
app.use(cookieParser());
PORT=process.env.PORT;
connectToDB()
app.use('/api/user',userRoutes)


app.listen(PORT,()=>{

    console.log(`App is listening in port${PORT}`);
    
})
