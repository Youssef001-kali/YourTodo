const router = require("express").Router();
const {
  createTodo,
  getAllTodos,
  getTodoById,
  updateTodo,
  deleteTodo,
  deleteAllTodos,
} = require("../../Controllers/Private-routes-controller/Todos/todosControllers.js");

// Create a new todo for a list
router.post(
  "/:accountId/collections/:collectionId/lists/:listId/todos",
  createTodo,
);

// Get all todos for a list
router.get(
  "/:accountId/collections/:collectionId/lists/:listId/todos",
  getAllTodos,
);

// Get a specific todo by ID
router.get(
  "/:accountId/collections/:collectionId/lists/:listId/todos/:todoId",
  getTodoById,
);

// Update a todo
router.put(
  "/:accountId/collections/:collectionId/lists/:listId/todos/:todoId",
  updateTodo,
);

// Delete a todo
router.delete(
  "/:accountId/collections/:collectionId/lists/:listId/todos/:todoId",
  deleteTodo,
);

// Delete all todos for a list
router.delete(
  "/:accountId/collections/:collectionId/lists/:listId/todos",
  deleteAllTodos,
);

module.exports = router;
