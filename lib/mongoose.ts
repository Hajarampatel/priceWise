// "use server"
import mongoose from 'mongoose';

let isConnected = false;

export const connectToDB = async() =>{
  mongoose.set('strictQuery', true);
 if(!process.env.MONGODB_URI) return console.log("MONGODB_URI is not defined");

 if(isConnected) return console.log('=> using existing database connection');

 try {
    await mongoose.connect(process.env.MONGODB_URI);
     isConnected = true;
     console.log('MongoDB connected');

   //   const testSchema = new mongoose.0({
   //    name: String,
   //    age: Number,
   //    email: String,
   //    isActive: Boolean,
   //  });
    
    // Create a model
   //  const Test = mongoose.model('Test', testSchema);
 } catch (error) {
    console.log(error);
 }
}