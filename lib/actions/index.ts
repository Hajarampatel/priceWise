"use server"
import { revalidatePath } from "next/cache";
import Product from "../models/product.model";
import { connectToDB } from "../mongoose";
import { scrapeAmazonProduct } from "../scrapper";
import { getAveragePrice, getHighestPrice, getLowestPrice } from "../utils";
import { log } from "console";
import { User } from "@/types";
import { generateEmailBody, sendEmail } from "../nodemailer";




export async function scrapAndStoreProduct(productUrl:string) {
    if(!productUrl) return;
     
    try {
        connectToDB();
        const scrapedProduct : any = await scrapeAmazonProduct(productUrl);
        if(!scrapedProduct ) return;
        if (!scrapedProduct || !scrapedProduct.priceHistory || !scrapedProduct.priceHistory.price) {
            // Handle the case where priceHistory.price is missing or invalid.
            return;
        }

        let product =  scrapedProduct;
        const existingProduct = await Product.findOne({ url : scrapedProduct.url });
         // console.log("data " , existingProduct);
        
        if(existingProduct){
            const updatedPriceHistory: any = [
                ...existingProduct.priceHistory,
                {price : scrapedProduct.currentPrice}
            ];
        
        product = {
            ...scrapedProduct, 
            priceHistory : updatedPriceHistory,
            lowestPrice : getLowestPrice(updatedPriceHistory),
            highestPrice : getHighestPrice(updatedPriceHistory),
            averagePrice : getAveragePrice(updatedPriceHistory),

        }
    }
        
       const newProduct =  await Product.findOneAndUpdate(
        {url : scrapedProduct.url},
       product,
       { upsert : true, new: true  }
      );
    //   console.log("newProduct :", newProduct)

    revalidatePath(`/products/${newProduct._id}`);
    } catch (error : any) {
        throw new Error(`Failed to create/update product : ${error.message}`)
    }
}

export async function getProductById(productId :string) {
    try {
        connectToDB();
         const product = Product.findOne({_id : productId});
         if(!product) return;
         return product;
    } catch (error) {
        console.log(error);
    }
}

export async function getAllProducts() {
    try {
        connectToDB();
        const products = await Product.find();
        return products;
    } catch (error) {
        console.log(error);
    }
}

export async function getSimilarProduct(productId : string) {
    try {
        connectToDB();
        const currentProduct = await Product.findById(productId);
        if(!currentProduct) return null;
         
        const similarProducts = await Product.find({
            _id : {$ne : productId}
        }).limit(3);
        return similarProducts;
    } catch (error) {
        console.log(error);
    }
}

export async function addUserEmailToProduct(productId:string,
    userEmail :string){
        try {
          const product = await Product.findById(productId);
          if(!product) return;
          const userExists = product.users.some((user : User) =>user.email === userEmail);
          if(!userExists){
            product.users.push({email : userEmail});
            await product.save();
            const emailContent = await generateEmailBody(product, "WELCOME");

            await sendEmail(emailContent, [userEmail]);
          }
          

        } catch (error) {
            console.log(error)
        }
    }