const prisma = require("../prismaClient");
const { body, validationResult } = require("express-validator");
const path = require("node:path");
const cloudinary = require("../config/cloudinaryConfig");
const streamifier = require("streamifier");

const handleRootGet = (req, res) => {
  if (req.isAuthenticated()) {
    res.redirect("/homepage");
  } else {
    res.render("entry-page");
  }
};

const homepageViewGet = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const folderId = req.params.folderid || null;
    const sortBy = req.query.sortBy || "name";
    const order = sortBy === "name" ? "asc" : "desc";

    const contents = await prisma.getSortedContents(
      userId,
      folderId,
      sortBy,
      order
    );
    let path;
    if (folderId) {
      path = await prisma.getFolderPath(userId, folderId);
    }
    res.render("homepage", {
      user: req.user,
      contents: contents,
      sortBy: sortBy,
      order: order,
      folderId: folderId,
      path: path,
    });
  } catch (error) {
    res.status(500).send("error loading contents");
  }
};

const streamUpload = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    let stream = cloudinary.uploader.upload_stream((err, result) => {
      if (result) {
        resolve(result);
      } else {
        reject(err);
      }
    });
    streamifier.createReadStream(fileBuffer).pipe(stream);
  });
};

const handleFileUpload = async (req, res, next) => {
  if (!req.file) {
    const userId = req.user.id;
    const folderId = req.params.folderid || null;
    const sortBy = req.query.sortBy || "name";
    const order = req.query.order || "asc";
    const contents = await prisma.getSortedContents(
      userId,
      folderId,
      sortBy,
      order
    );
    let path;
    if (folderId) {
      path = await prisma.getFolderPath(userId, folderId);
    }
    return res.status(400).render("homepage", {
      user: req.user,
      contents: contents,
      errors: [{ msg: "no file chosen" }],
      sortBy: sortBy,
      order: order,
      folderId: folderId,
      path: path,
    });
  }
  const folderPath = req.params.folderid
    ? `homepage/${req.params.folderid}`
    : `homepage`;
  const filePath = path.join(folderPath, req.file.originalname);

  try {
    const cloudinaryResult = await streamUpload(req.file.buffer);
    const publicId = cloudinaryResult.public_id;
    const cloudinaryUrl = await cloudinary.url(publicId, {
      flags: "attachment",
    });

    const file = await prisma.uploadFile(
      req.user,
      req.file.originalname,
      filePath,
      req.file.size,
      req.params.folderid,
      cloudinaryUrl,
      publicId
    );

    if (req.params.folderid) {
      res.status(200).redirect(`/homepage/folder/${req.params.folderid}`);
    } else {
      res.status(200).redirect("/homepage");
    }
  } catch (error) {
    console.error("file upload failed", error);
    const userId = req.user.id;
    const folderId = req.params.folderid || null;
    const sortBy = req.query.sortBy || "name";
    const order = req.query.order || "asc";
    const contents = await prisma.getSortedContents(
      userId,
      folderId,
      sortBy,
      order
    );
    let path;
    if (folderId) {
      path = await prisma.getFolderPath(userId, folderId);
    }
    res.status(500).render("homepage", {
      user: req.user,
      contents: contents,
      errors: [{ msg: "File upload failed" }],
      sortBy: sortBy,
      order: order,
      folderId: folderId,
      path: path,
    });
  }
};

const folderValidator = [
  body("folderName").trim().notEmpty().withMessage("Name required").escape(),
];

const createFolderPost = [
  folderValidator,
  async (req, res, next) => {
    const errors = await validationResult(req);
    if (!errors.isEmpty()) {
      const userId = req.user.id;
      const folderId = req.params.folderid || null;
      const sortBy = req.query.sortBy || "name";
      const order = req.query.order || "asc";
      const contents = await prisma.getSortedContents(
        userId,
        folderId,
        sortBy,
        order
      );
      let path;
      if (folderId) {
        path = await prisma.getFolderPath(userId, folderId);
      }
      return res.status(400).render("homepage", {
        user: req.user,
        contents: contents,
        errors: errors.array(),
        sortBy: sortBy,
        order: order,
        folderId: folderId,
        path: path,
      });
    }
    try {
      const parentId = req.params.folderid || null;
      await prisma.createFolder(req.user.id, req.body.folderName, parentId);
      if (req.params.folderid) {
        res.status(200).redirect(`/homepage/folder/${req.params.folderid}`);
      } else {
        res.status(200).redirect("/homepage");
      }
    } catch (err) {
      return next(err);
    }
  },
];

const handleFileViewGet = async (req, res) => {
  try {
    const fileId = req.params.fileid;
    const file = await prisma.getFileById(req.user.id, fileId);
    if (!file) {
      return res.status(404).render("404", { message: "File not found" });
    }
    res.render("file-details", { file });
  } catch (error) {
    console.error("Error fetching file details", error);
    return next(error);
  }
};

const handleDeleteFolderPost = async (req, res, next) => {
  const { folderid } = req.params;
  try {
    const countCheck = await prisma.getCounts(req.user.id, folderid);
    const parentFolder = await prisma.getParent(req.user.id, folderid);
    // If the folder is empty, proceed with deletion
    if (countCheck == 0) {
      await prisma.deleteFolder(req.user.id, folderid);
      if (parentFolder.parentId !== null) {
        res.redirect(`/homepage/folder/${parentFolder.parentId}`);
      } else {
        res.redirect("/homepage");
      }
    } else {
      const userId = req.user.id;
      const folderId = req.params.folderid || null;
      const sortBy = req.query.sortBy || "name";
      const order = req.query.order || "asc";
      const contents = await prisma.getSortedContents(
        userId,
        folderId,
        sortBy,
        order
      );
      let path;
      if (folderId) {
        path = await prisma.getFolderPath(userId, folderId);
      }
      res.status(500).render("homepage", {
        user: req.user,
        contents: contents,
        errors: [{ msg: "Folder not empty" }],
        sortBy: sortBy,
        order: order,
        folderId: folderId,
        path: path,
      });
    }
  } catch (error) {
    console.error("Error deleting folder", error);
    return next(error);
  }
};

const handleDeleteFilePost = async (req, res, next) => {
  const { fileid } = req.params;
  try {
    const file = await prisma.getFileById(req.user.id, fileid);
    if (!file) {
      return res.status(404).render("404", { message: "File not found" });
    }
    if (file.cloudinaryUrl) {
      const publicId = file.publicId;
      await cloudinary.uploader.destroy(publicId);
    }
    await prisma.deleteFile(req.user.id, fileid);
    res.redirect("back");
  } catch (error) {
    console.error("Error deleting file", error);
    return next(error);
  }
};

const newNameFolderValidator = [
  body("newName").trim().notEmpty().withMessage("Name required").escape(),
];

const handleUpdateFolderPost = [
  newNameFolderValidator,
  async (req, res, next) => {
    const errors = await validationResult(req);
    if (!errors.isEmpty()) {
      const userId = req.user.id;
      const folderId =
        (await prisma.getParent(userId, req.params.folderid)) || null;
      const sortBy = req.query.sortBy || "name";
      const order = req.query.order || "asc";
      const contents = await prisma.getSortedContents(
        userId,
        folderId,
        sortBy,
        order
      );
      let path;
      if (folderId) {
        path = await prisma.getFolderPath(userId, folderId);
      }
      return res.status(400).render("homepage", {
        user: req.user,
        contents: contents,
        errors: errors.array(),
        sortBy: sortBy,
        order: order,
        folderId: folderId,
        path: path,
      });
    }
    try {
      const updatedName = req.body.newName;
      const folderId = req.params.folderid;
      const parentFolder = await prisma.getParent(req.user.id, folderId);
      await prisma.updateFolder(req.user.id, folderId, updatedName);
      if (parentFolder.id) {
        res.status(200).redirect(`/homepage/folder/${parentFolder.id}`);
      } else {
        res.status(200).redirect("/homepage");
      }
    } catch (err) {
      return next(err);
    }
  },
];

module.exports = {
  handleRootGet,
  homepageViewGet,
  handleFileUpload,
  createFolderPost,
  handleFileViewGet,
  handleDeleteFilePost,
  handleDeleteFolderPost,
  handleUpdateFolderPost,
};
