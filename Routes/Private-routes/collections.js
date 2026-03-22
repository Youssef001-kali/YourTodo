const router = require("express").Router();
const {
  createCollection,
  getAllCollections,
  getCollectionById,
  updateCollection,
  deleteCollection,
  deleteAllCollections,
} = require("../../Controllers/Private-routes-controller/Collections/collectionsControllers.js");

// Create a new collection for an account
router.post("/:accountId/collections", createCollection);

// Get all collections for an account
router.get("/:accountId/collections", getAllCollections);

// Get a specific collection by ID
router.get("/:accountId/collections/:collectionId", getCollectionById);

// Update a collection
router.put("/:accountId/collections/:collectionId", updateCollection);

// Delete a collection
router.delete("/:accountId/collections/:collectionId", deleteCollection);

// Delete all collections for an account
router.delete("/:accountId/collections", deleteAllCollections);

module.exports = router;
