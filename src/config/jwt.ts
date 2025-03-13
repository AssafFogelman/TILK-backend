import jwt, { Secret } from "jsonwebtoken";
import "dotenv/config";

//jsonwebtoken only has a callback function, and we want to use it in a try-catch block. so we will return a promise.
export const generateToken = (payload: object, expDate = "2d") => {
  return new Promise((resolve, reject) => {
    jwt.sign(
      payload,
      process.env.VALIDATION_KEY as Secret,
      { expiresIn: expDate },
      (err, token) => {
        if (err) reject(err);
        else resolve(token);
      }
    );
  });
};
/* default value - 6 months */
/* payload - the data */
/* (err, token)  - a function to determine what to do if there is an error or if we get a generated token */
/* process.env.VALIDATION_KEY  -our secret key */

export const verifyToken = (token: string) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, process.env.VALIDATION_KEY as Secret, (err, payload) => {
      if (err) reject(err);
      else resolve(payload);
    });
  });
};
