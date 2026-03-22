const router = require("express").Router();
const {
  createAccount,
  getAllAccounts,
  getAccountById,
  updateAccount,
  deleteAccount,
  deleteAllAccounts,
} = require("../../Controllers/Private-routes-controller/Accounts/accountsControllers.js");

// Create a new account
router.post("/", createAccount);

// Get all accounts for the authenticated user
router.get("/", getAllAccounts);

// Get a specific account by ID
router.get("/:accountId", getAccountById);

// Update an account
router.put("/:accountId", updateAccount);

// Delete an account
router.delete("/:accountId", deleteAccount);

// Delete all accounts for the authenticated user
router.delete("/", deleteAllAccounts);

module.exports = router;
