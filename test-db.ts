import { db } from './src/prisma/db';

async function main() {
  const model = db.orm.public.User;
  // Get all methods on the model
  let proto = Object.getPrototypeOf(model);
  const methods = new Set();
  while (proto && proto !== Object.prototype) {
    Object.getOwnPropertyNames(proto).forEach(name => methods.add(name));
    proto = Object.getPrototypeOf(proto);
  }
  console.log("Methods on User:", Array.from(methods));
}

main().catch(console.error);
