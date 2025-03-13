import { validator } from "hono/validator";
import { z } from "zod";
import { verifyToken } from "../config/jwt.js";
import { Context, Next } from "hono";

//*"send-sms" route

export const phoneNumberSchema = z.string().regex(/^\+[1-9]\d{6,14}$/); //Regular expression matching E.164 formatted phone numbers

export const validatePhoneNo = validator("json", (value, c) => {
  const { phoneNumber } = value;
  const result = phoneNumberSchema.safeParse(phoneNumber);
  if (!result.success) {
    console.log("Invalid phone number!");
    return c.json({ message: "Invalid phone number!" }, 401);
  }
  return result.data;
});

export const codeSchema = z.string().regex(/^\d{5}$/); //5 digit code

//used for "markAsUnread" controller
export const uuidArraySchema = z.array(z.string().uuid());

export const validateCode = validator("json", (value, c) => {
  const { code } = value;
  const result = codeSchema.safeParse(code);
  if (!result.success) {
    console.log("Invalid code!");
    return c.json({ message: "Invalid code!" }, 401);
  }
  return result.data;
});

export const validateToken = async (c: Context, next: Next) => {
  try {
    const token = c.req.header("TILK-token");
    if (!token) throw new Error("no token provided");
    const payload = await verifyToken(token);
    c.set("tokenPayload", payload);
    await next();
  } catch (error) {
    console.log("Invalid token!");
    return c.json({ message: "Invalid token!", error }, 401);
  }
};
