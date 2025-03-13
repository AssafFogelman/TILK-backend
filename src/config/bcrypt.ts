import bcrypt from "bcryptjs";

export const createHash = (password: string) => bcrypt.hash(password, 10);

export const compareHash = (password: string, hash: string) =>
  bcrypt.compare(password, hash);
