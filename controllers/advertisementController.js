const Advertisement = require("../models/Advertisement");
const User = require("../models/User");
exports.createAd = async (req, res) => {
  try {
    // Check if user is authorized (gym_owner or admin)
    if (req.user.role !== "gym_owner" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Only gym owners and admins can create advertisements" });
    }

    // Verify user exists
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Collect Google Drive URLs for images and videos
    const imageFiles = [];

    if (req.files?.profilePic?.length) {
      imageFiles.push(req.files.profilePic[0].googleDriveUrl);
    }

    if (req.files?.media?.length) {
      imageFiles.push(req.files.media[0].googleDriveUrl);
    }

    if (!imageFiles.length) {
      return res.status(400).json({ message: "At least one image or video is required" });
    }

    const newAd = new Advertisement({
      ...req.body,
      owner: req.user.id,
      images: imageFiles, // Store Google Drive URLs
    });

    await newAd.save();
    res.status(201).json(newAd);
  } catch (error) {
    console.error("Create Ad Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getAds = async (req, res) => {
  try {
    const ads = await Advertisement.find().populate("owner", "name email");
    res.status(200).json(ads);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getAdsByLocation = async (req, res) => {
  try {
    const { longitude, latitude, maxDistance = 10000 } = req.query; // maxDistance in meters

    const ads = await Advertisement.find({
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(longitude), parseFloat(latitude)],
          },
          $maxDistance: parseInt(maxDistance),
        },
      },
    });

    res.status(200).json(ads);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.updateAdStats = async (req, res) => {
  try {
    const { adId } = req.params;
    const { type } = req.body; // type can be 'view', 'click', or 'conversion'

    const updateField = `statistics.${type}s`;
    const ad = await Advertisement.findByIdAndUpdate(adId, { $inc: { [updateField]: 1 } }, { new: true });

    if (!ad) {
      return res.status(404).json({ message: "Advertisement not found" });
    }

    res.status(200).json(ad);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.updateAd = async (req, res) => {
  try {
    const { adId } = req.params;
    const updateData = req.body;

    // Find the existing ad
    const ad = await Advertisement.findById(adId);

    if (!ad) {
      return res.status(404).json({
        success: false,
        message: "Advertisement not found",
      });
    }

    // Authorization check
    if (req.user.role !== "admin" && ad.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this ad",
      });
    }

    // Handle image updates if files are included
    if (req.files) {
      const imageFiles = [];

      if (req.files.profilePic?.length) {
        imageFiles.push(req.files.profilePic[0].googleDriveUrl);
      }

      if (req.files.media?.length) {
        req.files.media.forEach((file) => {
          imageFiles.push(file.googleDriveUrl);
        });
      }

      if (imageFiles.length > 0) {
        updateData.images = imageFiles;
      }
    }

    // Validate location data if provided
    if (updateData.location) {
      if (!updateData.location.type) {
        updateData.location.type = "Point";
      }
      if (updateData.location.coordinates) {
        updateData.location.coordinates = updateData.location.coordinates.map((coord) => parseFloat(coord));
      }
    }

    // Update the advertisement with validation
    const updatedAd = await Advertisement.findByIdAndUpdate(
      adId,
      {
        $set: {
          title: updateData.title,
          description: updateData.description,
          link: updateData.link,
          location: updateData.location,
          "campaign.budget": updateData.campaign?.budget,
          "campaign.status": updateData.campaign?.status,
          "campaign.startDate": updateData.campaign?.startDate,
          "campaign.endDate": updateData.campaign?.endDate,
          images: updateData.images,
          isActive: updateData.isActive,
        },
      },
      {
        new: true,
        runValidators: true,
        context: "query",
      }
    ).populate("owner", "name email");

    return res.status(200).json({
      success: true,
      message: "Advertisement updated successfully",
      data: updatedAd,
    });
  } catch (error) {
    console.error("Update Ad Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
