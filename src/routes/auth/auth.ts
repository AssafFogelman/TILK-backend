import { Hono } from "hono";
import {
  validateCode,
  validatePhoneNo,
  validateToken,
} from "../../models/authSchemas.js";
import { sendSms } from "../../controllers/send-sms.js";
import { createToken } from "../../controllers/create-token.js";
import { userData } from "../../controllers/user-data.js";

export const auth = new Hono().basePath("/auth");

/*
receives a telephone number, 
validates it, 
makes-up a code, 
calculates a hash out of the key+code+phone number
sends an SMS with the code,
returns the hash
*/
auth.post("/send-sms", validatePhoneNo, sendSms);

/*  
    the user sends the server the code that he got+phone number+the hash. 
     - the server checks for validity of the hash,
     - the server checks whether the phone number exists in the database.
     - if so, it returns a token
     - if not, it creates a user and returns a token
     the token:
     * userId

     - the server also returns global user attributes: (to be added to the context)
     the attributes:
     * userId
     * chosenAvatar
     * chosenBio
     * chosenTags
     * isAdmin
     * off-grid (specifically not determined by the server, but by the app)


    create and return a new token containing the new user unique phone ID and phone number and register the user.
    
 */
auth.post("/create-token", validatePhoneNo, validateCode, createToken);

/* 
    1. receives a token
    2. checks that the token is valid
    3. checks whether the user exists in the database. 
    if not, returns an error.
    if so, returns all relevant user data.
*/

auth.get("/user-data", validateToken, userData);
