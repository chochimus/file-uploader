const { PrismaClient } = require("@prisma/client");
const formatFileSize = require("./utils/formatSize");

const prisma = new PrismaClient();

const uploadFile = async (
  user,
  name,
  path,
  size,
  folderId,
  cloudinaryUrl,
  publicId
) => {
  try {
    const formattedSize = formatFileSize(size);
    const data = {
      name: name,
      size: formattedSize,
      path: path,
      user: {
        connect: { id: user.id },
      },
      cloudinaryUrl: cloudinaryUrl,
      publicId: publicId,
    };

    // Conditionally add the folder connection if folderId is provided
    if (folderId) {
      data.folder = {
        connect: { id: folderId },
      };
    }
    return await prisma.file.create({ data });
  } catch (error) {
    console.error("Error creating file", error);
    throw error;
  }
};

const getFileById = async (userId, fileId) => {
  try {
    const file = await prisma.file.findUnique({
      where: {
        userId: userId,
        id: fileId,
      },
    });
    return file;
  } catch (error) {
    console.error("Couldn't find file", error);
    throw error;
  }
};

const getFiles = async (userId, folderId) => {
  try {
    if (folderId) {
      return await prisma.file.findMany({
        where: {
          userId: userId,
          folderId: folderId,
        },
      });
    }
    return await prisma.file.findMany({
      where: {
        userId: userId,
        folderId: null,
      },
    });
  } catch (error) {
    console.error("Error fetching files", error);
    throw error;
  }
};

const getFolders = async (userId, folderId = null) => {
  try {
    return await prisma.folder.findMany({
      where: {
        userId: userId,
        parentId: folderId,
      },
    });
  } catch (error) {
    console.error("Error fetching folders", error);
    throw error;
  }
};

const getFolderPath = async (userId, folderId) => {
  let currentFolderId = folderId;
  const path = [];
  let depth = 0;

  while (currentFolderId && depth < 3) {
    const folder = await prisma.folder.findUnique({
      where: { id: currentFolderId, userId: userId },
      select: { id: true, name: true, parentId: true },
    });

    if (!folder) {
      break;
    }

    path.unshift(folder);
    currentFolderId = folder.parentId;
    depth++;
  }

  if (path.length < 3) {
    path.unshift({ id: "/homepage", name: "homepage" }); // "home" is the root folder
  }

  return path;
};

const getFilesAndFolders = async (userId, folderId = null) => {
  try {
    const [folders, files] = await prisma.$transaction([
      prisma.folder.findMany({
        where: {
          userId: userId,
          parentId: folderId, // Get root folders or child folders
        },
      }),
      prisma.file.findMany({
        where: {
          userId: userId,
          folderId: folderId, // Get root files or files within a folder
        },
      }),
    ]);

    // Combine both results and mark them as either 'folder' or 'file'
    const combined = [
      ...folders.map((folder) => ({
        ...folder,
        type: "folder",
      })),
      ...files.map((file) => ({
        ...file,
        type: "file",
      })),
    ];

    return combined; // Return the combined array
  } catch (error) {
    console.error("Error fetching files and folders", error);
    throw error;
  }
};

const getSortedContents = async (
  userId,
  folderId,
  sortBy = "name",
  order = "asc"
) => {
  try {
    // Fetch combined files and folders
    const contents = await getFilesAndFolders(userId, folderId);

    // Sorting logic
    contents.sort((a, b) => {
      if (sortBy === "name") {
        const nameA = a.name.toLowerCase();
        const nameB = b.name.toLowerCase();
        if (nameA < nameB) return order === "asc" ? -1 : 1;
        if (nameA > nameB) return order === "asc" ? 1 : -1;
        return 0;
      } else if (sortBy === "createdAt") {
        return order === "asc"
          ? new Date(a.createdAt) - new Date(b.createdAt)
          : new Date(b.createdAt) - new Date(a.createdAt);
      }
    });

    return contents; // Return sorted contents
  } catch (error) {
    console.error("Error fetching and sorting contents", error);
    throw error;
  }
};

const createFolder = async (userId, folderName, parentId = null) => {
  try {
    await prisma.folder.create({
      data: {
        name: folderName,
        user: {
          connect: { id: userId },
        },
        parent: parentId ? { connect: { id: parentId } } : undefined,
      },
    });
  } catch (error) {
    console.error("Error creating folder", error);
  }
};

const createUser = async (username, hashedPassword) => {
  try {
    await prisma.user.create({
      data: {
        username: username,
        password: hashedPassword,
      },
    });
  } catch (error) {
    console.error("Couldn't create user", error);
    throw error;
  }
};

const getUserByUsername = async (username) => {
  try {
    const user = await prisma.user.findUnique({
      where: { username },
    });
    return user;
  } catch (error) {
    console.error("something went wrcontentsong", error);
    throw error;
  }
};

const getUserById = async (id) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
    });
    return user;
  } catch (error) {
    console.error("something went wrong", error);
    throw error;
  }
};

const deleteFile = async (userId, fileId) => {
  try {
    await prisma.file.delete({
      where: { id: fileId, userId: userId },
    });
  } catch (error) {
    console.error("something went wrong deleting the file", error);
    throw error;
  }
};

const deleteFolder = async (userId, folderId) => {
  try {
    await prisma.folder.delete({
      where: {
        id: folderId,
        userId: userId,
      },
    });
  } catch (error) {
    console.error("something went wrong deleting the folder", error);
    throw error;
  }
};

const updateFolder = async (userId, folderId, updatedName) => {
  try {
    await prisma.folder.update({
      where: {
        id: folderId,
        userId: userId,
      },
      data: {
        name: updatedName,
      },
    });
  } catch (error) {
    console.error("Error updating folder", error);
    throw error;
  }
};

const getCounts = async (userId, folderId) => {
  try {
    const filesCount = await prisma.file.count({
      where: {
        folderId,
      },
    });
    const folderCount = await prisma.folder.count({
      where: {
        parentId: folderId,
      },
    });
    if (filesCount > 0 || folderCount > 0) {
      return 1;
    } else {
      return 0;
    }
  } catch (error) {
    console.error("couldn't count files and folders", error);
    throw error;
  }
};

const getParent = async (userId, folderId) => {
  try {
    const folder = await prisma.folder.findUnique({
      where: { id: folderId, userId: userId },
      select: { parentId: true },
    });
    return folder;
  } catch (error) {
    console.error("couldn't get parent", error);
    throw error;
  }
};

module.exports = {
  uploadFile,
  createUser,
  getUserByUsername,
  getUserById,
  getFolders,
  getFiles,
  createFolder,
  getFilesAndFolders,
  getSortedContents,
  getFileById,
  getFolderPath,
  deleteFile,
  deleteFolder,
  getCounts,
  getParent,
  updateFolder,
};
