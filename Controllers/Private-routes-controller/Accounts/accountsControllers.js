const {
  Accounts,
  ValidateAccountCreation,
  ValidateAccountUpdate,
} = require("../../../Database/Models/Accounts.js");
const { Users } = require("../../../Database/Models/Users.js");
const handleServerErrors = require("../../../Helpers/others/handleServerError.js");

// Create a new account for the authenticated user
const createAccount = async (req, res) => {
  try {
    const userId = req.userId;
    const { error, account } = ValidateAccountCreation(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: "Bad request, invalid account data",
        errors: error.details.map((detail) => detail.message),
      });
    }

    // Check if username is already taken by this user
    const existingAccount = await Accounts.findOne({
      userId,
      username: account.username,
      is_deleted: false,
    });

    if (existingAccount) {
      return res.status(400).json({
        success: false,
        message: "Bad request, username already exists for this user",
      });
    }

    const newAccount = new Accounts({
      userId,
      username: account.username,
      bio: account.bio || "",
      pfp: account.pfp || null,
    });

    await newAccount.save();

    res.status(201).json({
      success: true,
      message: "Account created successfully",
      account: {
        id: newAccount._id,
        username: newAccount.username,
        bio: newAccount.bio,
        pfp: newAccount.pfp,
        created_at: newAccount.created_at,
      },
    });
  } catch (error) {
    handleServerErrors(res, error, "controllers/accounts.js(createAccount)");
  }
};

// Get all accounts for the authenticated user
const getAllAccounts = async (req, res) => {
  try {
    const userId = req.userId;

    const accounts = await Accounts.find({
      userId,
      is_deleted: false,
    }).select("-__v");

    res.status(200).json({
      success: true,
      accounts,
      count: accounts.length,
    });
  } catch (error) {
    handleServerErrors(res, error, "controllers/accounts.js(getAllAccounts)");
  }
};

// Get a specific account by ID
const getAccountById = async (req, res) => {
  try {
    const userId = req.userId;
    const accountId = req.params.accountId;

    const account = await Accounts.findOne({
      _id: accountId,
      userId,
      is_deleted: false,
    }).select("-__v");

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }

    res.status(200).json({
      success: true,
      account,
    });
  } catch (error) {
    handleServerErrors(res, error, "controllers/accounts.js(getAccountById)");
  }
};

// Update an account
const updateAccount = async (req, res) => {
  try {
    const userId = req.userId;
    const accountId = req.params.accountId;
    const { error, account } = ValidateAccountUpdate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: "Bad request, invalid account data",
        errors: error.details.map((detail) => detail.message),
      });
    }

    // Check if account exists and belongs to user
    const existingAccount = await Accounts.findOne({
      _id: accountId,
      userId,
      is_deleted: false,
    });

    if (!existingAccount) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }

    // Check if username is already taken by another account of this user
    if (account.username && account.username !== existingAccount.username) {
      const usernameExists = await Accounts.findOne({
        userId,
        username: account.username,
        _id: { $ne: accountId },
        is_deleted: false,
      });

      if (usernameExists) {
        return res.status(400).json({
          success: false,
          message: "Bad request, username already exists for this user",
        });
      }
    }

    const updateData = {
      ...account,
      updated_at: new Date(),
    };

    const updatedAccount = await Accounts.findByIdAndUpdate(
      accountId,
      updateData,
      { new: true },
    ).select("-__v");

    res.status(200).json({
      success: true,
      message: "Account updated successfully",
      account: updatedAccount,
    });
  } catch (error) {
    handleServerErrors(res, error, "controllers/accounts.js(updateAccount)");
  }
};

// Delete an account (soft delete)
const deleteAccount = async (req, res) => {
  try {
    const userId = req.userId;
    const accountId = req.params.accountId;

    const account = await Accounts.findOne({
      _id: accountId,
      userId,
      is_deleted: false,
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }

    // Soft delete the account
    await Accounts.findByIdAndUpdate(accountId, {
      is_deleted: true,
      deleted_at: new Date(),
    });

    // Cascade: Soft delete all collections for this account
    const { Collections } = require("../../../Database/Models/Collections.js");
    await Collections.updateMany(
      { accountId, is_deleted: false },
      {
        is_deleted: true,
        deleted_at: new Date(),
      },
    );

    // Cascade: Soft delete all lists for this account
    const { Lists } = require("../../../Database/Models/Lists.js");
    await Lists.updateMany(
      { accountId, is_deleted: false },
      {
        is_deleted: true,
        deleted_at: new Date(),
      },
    );

    // Cascade: Soft delete all todos for this account
    const { Todos } = require("../../../Database/Models/Todos.js");
    await Todos.updateMany(
      { accountId, is_deleted: false },
      {
        is_deleted: true,
        deleted_at: new Date(),
      },
    );

    res.status(200).json({
      success: true,
      message: "Account and all associated data deleted successfully",
    });
  } catch (error) {
    handleServerErrors(res, error, "controllers/accounts.js(deleteAccount)");
  }
};

// Delete all accounts for the authenticated user
const deleteAllAccounts = async (req, res) => {
  try {
    const userId = req.userId;

    // Get all account IDs that will be deleted
    const accountsToDelete = await Accounts.find(
      { userId, is_deleted: false },
      { _id: 1 },
    );
    const accountIds = accountsToDelete.map((account) => account._id);

    // Soft delete all accounts
    const result = await Accounts.updateMany(
      { userId, is_deleted: false },
      {
        is_deleted: true,
        deleted_at: new Date(),
      },
    );

    if (accountIds.length > 0) {
      // Cascade: Soft delete all collections for these accounts
      const {
        Collections,
      } = require("../../../Database/Models/Collections.js");
      await Collections.updateMany(
        { accountId: { $in: accountIds }, is_deleted: false },
        {
          is_deleted: true,
          deleted_at: new Date(),
        },
      );

      // Cascade: Soft delete all lists for these accounts
      const { Lists } = require("../../../Database/Models/Lists.js");
      await Lists.updateMany(
        { accountId: { $in: accountIds }, is_deleted: false },
        {
          is_deleted: true,
          deleted_at: new Date(),
        },
      );

      // Cascade: Soft delete all todos for these accounts
      const { Todos } = require("../../../Database/Models/Todos.js");
      await Todos.updateMany(
        { accountId: { $in: accountIds }, is_deleted: false },
        {
          is_deleted: true,
          deleted_at: new Date(),
        },
      );
    }

    res.status(200).json({
      success: true,
      message: `Successfully deleted ${result.modifiedCount} accounts and all associated data`,
    });
  } catch (error) {
    handleServerErrors(
      res,
      error,
      "controllers/accounts.js(deleteAllAccounts)",
    );
  }
};

module.exports = {
  createAccount,
  getAllAccounts,
  getAccountById,
  updateAccount,
  deleteAccount,
  deleteAllAccounts,
};
