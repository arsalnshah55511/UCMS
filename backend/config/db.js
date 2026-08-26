const mongoose = require("mongoose")

const connectDB = async ()=>{

   try{
     const conn = await mongoose.connect(process.env.MONGO_URL)
     console.log(`mongoose DB is connected ${conn.connection.host}`)
   }catch{
    console.log(`not connected the data base`,error.message)
    process.exit(1)
}
}

module.exports = connectDB