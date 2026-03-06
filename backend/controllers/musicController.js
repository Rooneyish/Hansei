const queries = require("../database/queries");

async function getAllMusic(req, res) {
  try {
    const musicData = await queries.getAllMusic();

    const baseUrl = `${req.protocol}://${req.get("host")}`;

    const formattedMusic = musicData.map((track) => ({
      id: track.id,
      title: track.title,
      artist: track.artist,
      category: track.category,
      description: track.description,
      mood_tags: track.mood_tags,
      url: `${baseUrl}/assets/music/${track.music_file}`,
      artwork: `${baseUrl}/assets/musicCovers/${track.artwork_file}`,
    }));

    res.status(200).json(formattedMusic);
  } catch (err) {
    console.error("Error in getAllMusic controller:", err);
    res.status(500).json({ error: "Failed to fetch music tracks" });
  }
}

module.exports = { getAllMusic };
