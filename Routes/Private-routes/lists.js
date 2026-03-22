const router = require("express").Router();
const {
  createList,
  getAllLists,
  getListById,
  updateList,
  deleteList,
  deleteAllLists,
} = require("../../Controllers/Private-routes-controller/Lists/listsControllers.js");

// Create a new list for a collection
router.post("/:accountId/collections/:collectionId/lists", createList);

// Get all lists for a collection
router.get("/:accountId/collections/:collectionId/lists", getAllLists);

// Get a specific list by ID
router.get("/:accountId/collections/:collectionId/lists/:listId", getListById);

// Update a list
router.put("/:accountId/collections/:collectionId/lists/:listId", updateList);

// Delete a list
router.delete(
  "/:accountId/collections/:collectionId/lists/:listId",
  deleteList,
);

// Delete all lists for a collection
router.delete("/:accountId/collections/:collectionId/lists", deleteAllLists);

module.exports = router;
