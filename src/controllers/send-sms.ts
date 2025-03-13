import { Context } from "hono";
import { createHash } from "../config/bcrypt.js";
import twilio from "twilio";
import "dotenv/config";

// /** Twilio setup */
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

//today's requests. This is to prevent endless SMS send requests
type todaysRequestsType = { weekDay: number; uniqueOSCode: string }[] | [];
let todaysRequests: todaysRequestsType = [];

/*
receives a telephone number, 
validates it, 
makes-up a code, 
calculates a hash out of the key+code+phone number
sends an SMS with the code,
returns the hash
*/

export const sendSms = async (c: Context) => {
  try {
    const {
      phoneNumber,
      uniqueOSCode,
    }: { phoneNumber: string; uniqueOSCode: string } = await c.req.json();
    //add new request to log
    todaysRequests = [
      ...todaysRequests,
      { weekDay: new Date().getDay(), uniqueOSCode },
    ];

    //exclude (don't limit) the requests from the developer's 2 phones
    if (process.env.NODE_ENV?.toLowerCase() !== "production") {
      if (
        uniqueOSCode === "82a517fa0d9bfe4b" ||
        uniqueOSCode === "e35e4cf2794eed31"
      ) {
        todaysRequests.pop();
      }
    }

    //trim the request log to only the requests of the current 3 days (because the app will be applied globally)
    todaysRequests = todaysRequests.filter(
      (request) =>
        request.weekDay >= new Date().getDay() - 1 &&
        request.weekDay <= new Date().getDay() + 1
    );
    if (areTooManyInstances(todaysRequests, uniqueOSCode, 5)) {
      throw "this user's ID has sent too many SMS requests today";
    }
    const code = Math.floor(10000 + Math.random() * 90000).toString();
    const hash = await createHash(
      phoneNumber + code + process.env.VALIDATION_KEY
    );
    //send SMS
    await client.messages
      .create({
        body: "enter the following code: " + code,
        from: "TILK",
        to: phoneNumber,
      })
      .then((message) => console.log("SMS sent! Id:", message.sid));
    console.log("the code to be entered: ", code);
    return c.json({ hash: hash }, 201);
  } catch (error) {
    console.log('error in "sms-send" route:', error);
    return c.json({ message: 'error in "sms-send" route:' + error }, 401);
  }
};

type countsType = Record<string, number>;

// counting duplicate requests
function areTooManyInstances(
  arr: todaysRequestsType,
  uniqueOSCode: string,
  restrictNumber: number
) {
  let count = 0;

  // Count how many instances of the uniqueOSCode there are
  arr.forEach((sendSMSRequest) => {
    if (sendSMSRequest.uniqueOSCode === uniqueOSCode) count++;
  });
  if (count > restrictNumber) {
    return true;
  }
  return false;
}
