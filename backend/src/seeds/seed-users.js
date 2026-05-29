const mongoose = require("mongoose");
const connectMongoDB = require("../config/mongodb");
const userRepository = require("../modules/users/user.repository");
const authUtils = require("../modules/auth/auth.utils");

const demoUsers = [
  {
    email: "demo1@example.com",
    password: "123456",
    name: "Demo User 1",
    role: "customer"
  },
  {
    email: "demo2@example.com",
    password: "123456",
    name: "Demo User 2",
    role: "customer"
  },
  {
    email: "demo3@example.com",
    password: "123456",
    name: "Demo User 3",
    role: "customer"
  },
  {
    email: "demo4@example.com",
    password: "123456",
    name: "Demo User 4",
    role: "customer"
  },
  {
    email: "demo5@example.com",
    password: "123456",
    name: "Demo User 5",
    role: "customer"
  }
];

async function seedUsers() {
  const savedUsers = [];

  for (const demoUser of demoUsers) {
    const passwordHash = await authUtils.hashPassword(demoUser.password);
    const user = await userRepository.upsertByEmail(demoUser.email, {
      passwordHash,
      name: demoUser.name,
      role: demoUser.role,
      status: "active"
    });
    savedUsers.push(user);
  }

  return savedUsers;
}

if (require.main === module) {
  connectMongoDB()
    .then(seedUsers)
    .then((users) => {
      console.log(`Seeded ${users.length} demo users`);
      return mongoose.disconnect();
    })
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = seedUsers;
