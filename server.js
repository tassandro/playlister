require("dotenv").config();
const express = require("express");
const axios = require("axios");
const querystring = require("querystring");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public"))); 

const SPOTIFY_AUTH_URL = "https://accounts.spotify.com/authorize";
const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";

app.get("/login", (req, res) => {
    const scopes = "playlist-modify-public playlist-modify-private";
    const authUrl = `${SPOTIFY_AUTH_URL}?${querystring.stringify({
        client_id: process.env.SPOTIFY_CLIENT_ID,
        response_type: "code",
        redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
        scope: scopes,
    })}`;
    res.redirect(authUrl);
});

app.get("/callback", async (req, res) => {
    const code = req.query.code || null;
    if (!code) return res.status(400).send("Erro ao autenticar no Spotify.");

    try {
        const tokenResponse = await axios.post(
            SPOTIFY_TOKEN_URL,
            querystring.stringify({
                grant_type: "authorization_code",
                code,
                redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
                client_id: process.env.SPOTIFY_CLIENT_ID,
                client_secret: process.env.SPOTIFY_CLIENT_SECRET,
            }),
            { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
        );

        const { access_token, refresh_token } = tokenResponse.data;
        res.redirect(`/index.html?access_token=${access_token}&refresh_token=${refresh_token}`);
    } catch (error) {
        console.error("Erro ao obter o token:", error.response.data);
        res.status(500).send("Erro ao obter token.");
    }
});


app.post("/create-playlist", async (req, res) => {
    const { access_token, user_id, playlist_name } = req.body;
    if (!access_token || !user_id || !playlist_name) {
        return res.status(400).json({ error: "Parâmetros ausentes" });
    }

    try {
        const playlistResponse = await axios.post(
            `https://api.spotify.com/v1/users/${user_id}/playlists`,
            { name: playlist_name, public: true },
            { headers: { Authorization: `Bearer ${access_token}` } }
        );
        res.json({ playlist_id: playlistResponse.data.id });
    } catch (error) {
        console.error("Erro ao criar playlist:", error.response.data);
        res.status(500).json({ error: "Erro ao criar playlist" });
    }
});

app.post("/add-tracks", async (req, res) => {
    const { access_token, playlist_id, track_uris } = req.body;
    if (!access_token || !playlist_id || !track_uris.length) {
        return res.status(400).json({ error: "Parâmetros inválidos" });
    }

    try {
        await axios.post(
            `https://api.spotify.com/v1/playlists/${playlist_id}/tracks`,
            { uris: track_uris },
            { headers: { Authorization: `Bearer ${access_token}` } }
        );
        res.json({ message: "Músicas adicionadas com sucesso!" });
    } catch (error) {
        console.error("Erro ao adicionar músicas:", error.response.data);
        res.status(500).json({ error: "Erro ao adicionar músicas" });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
