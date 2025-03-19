import bcrypt from "bcryptjs";
export const createHash = (password) => bcrypt.hash(password, 10);
export const compareHash = (password, hash) => bcrypt.compare(password, hash);
