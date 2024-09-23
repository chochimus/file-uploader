const { Router } = require("express");
const indexController = require("../controllers/indexController");
const indexRouter = Router();
const { protectRoute } = require("../config/passport");
const multer = require("multer");
const upload = multer();

indexRouter.get("/", indexController.handleRootGet);
indexRouter.get("/homepage", protectRoute, indexController.homepageViewGet);
indexRouter.post(
  "/upload",
  upload.single("file"),
  indexController.handleFileUpload
);
indexRouter.post("/create-folder", indexController.createFolderPost);
indexRouter.post(
  "/create-folder/folder/:folderid",
  protectRoute,
  indexController.createFolderPost
);
indexRouter.get(
  "/homepage/file/:fileid",
  protectRoute,
  indexController.handleFileViewGet
);
indexRouter.post(
  "/delete/file/:fileid",
  protectRoute,
  indexController.handleDeleteFilePost
);
indexRouter.get(
  "/homepage/folder/:folderid",
  protectRoute,
  indexController.homepageViewGet
);
indexRouter.post(
  "/delete/folder/:folderid",
  protectRoute,
  indexController.handleDeleteFolderPost
);
indexRouter.post(
  "/update/folder/:folderid",
  protectRoute,
  indexController.handleUpdateFolderPost
);

module.exports = indexRouter;
