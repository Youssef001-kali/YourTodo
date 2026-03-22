module.exports = function handleServerErrors(res, error, location = null) {
  const errorLocation = location || __filename;

  console.error(`\n[SERVER ERROR] at ${errorLocation}`);
  console.error(error.stack || error);

  return res.status(500).json({
    success: false,
    message: "Internal server error.",
  });
};
