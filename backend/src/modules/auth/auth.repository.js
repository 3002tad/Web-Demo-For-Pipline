const userRepository = require("../users/user.repository");

module.exports = {
  findUserByEmail: userRepository.findByEmail,
  findUserById: userRepository.findById,
  createUser: userRepository.createUser
};
