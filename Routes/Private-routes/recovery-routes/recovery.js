const router = require("express").Router();
const {
  recoverAccount,
  getAllSoftDeletedAccounts,
  recoverCollection,
  getAllSoftDeletedCollections,
  recoverList,
  getAllSoftDeletedLists,
  recoverTodo,
  getAllSoftDeletedTodos,
} = require("../../../Controllers/Private-routes-controller/Recovery-routes-controller/recoveryControllers.js");

// Get all soft-deleted accounts for the authenticated user
router.get("/accounts", getAllSoftDeletedAccounts);

// Recover a soft-deleted account and all its associated data
router.patch("/accounts/:accountId", recoverAccount);

// Get all soft-deleted collections for an account
router.get("/:accountId/collections", getAllSoftDeletedCollections);

// Recover a soft-deleted collection and all its associated data
router.patch("/:accountId/collections/:collectionId", recoverCollection);

// Get all soft-deleted lists for a collection
router.get(
  "/:accountId/collections/:collectionId/lists",
  getAllSoftDeletedLists,
);

// Recover a soft-deleted list and all its associated data
router.patch(
  "/:accountId/collections/:collectionId/lists/:listId",
  recoverList,
);

// Get all soft-deleted todos for a list
router.get(
  "/:accountId/collections/:collectionId/lists/:listId/todos",
  getAllSoftDeletedTodos,
);

// Recover a soft-deleted todo
router.patch(
  "/:accountId/collections/:collectionId/lists/:listId/todos/:todoId",
  recoverTodo,
);

module.exports = router;
