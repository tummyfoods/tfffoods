import { Mongoose } from "mongoose";

declare module "mongoose" {
  interface Global {
    mongoose: {
      conn: Mongoose | null;
      promise: Promise<Mongoose> | null;
    };
  }
}

declare global {
  namespace NodeJS {
    interface Global {
      mongoose: {
        conn: Mongoose | null;
        promise: Promise<Mongoose> | null;
      };
    }
  }
}
