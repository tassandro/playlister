document.getElementById("login").addEventListener("click", () => { 
    window.location.href = "/login"; 
});

document.getElementById("createPlaylist").addEventListener("click", async () => {
    const musicList = document.getElementById("musicList").value;
    
    if (!musicList) {
        alert("Insira a lista de músicas!");
        return;
    }

    
    const urlParams = new URLSearchParams(window.location.search);
    const access_token = urlParams.get("access_token");
    
    if (!access_token) {
        alert("Faça login no Spotify primeiro!");
        return;
    }

    const userResponse = await fetch("https://api.spotify.com/v1/me", {
        headers: { Authorization: `Bearer ${access_token}` },
    });
    const userData = await userResponse.json();
    const user_id = userData.id;

    const playlistName = prompt("Nome da Playlist:");
    const playlistResponse = await fetch("/create-playlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            access_token,
            user_id,
            playlist_name: playlistName
        }),
    });
    const playlistData = await playlistResponse.json();
    const playlist_id = playlistData.playlist_id;

    const musicLines = musicList.split("\n");
    const trackURIs = [];

    function removeTimestamp(line) {
        const parts = line.split(" ");
        const timeParts = parts[0].split(":");
    
        if (
            timeParts.length >= 2 && timeParts.length <= 3 && /
            timeParts.every(part => !isNaN(part)) 
        ) {
            return parts.slice(1).join(" "); 
        }
    
        return line;
    }

    for (const line of musicLines) {

        const song = removeTimestamp(line).trim();

        console.log(`Buscando: ${song}`);

    
        const searchResponse = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(song)}&type=track&limit=1`, {
            headers: { Authorization: `Bearer ${access_token}` },
        });
        
        const searchData = await searchResponse.json();

    
        if (searchData.tracks.items.length > 0) {
            const bestMatch = searchData.tracks.items[0]; // Primeiro item retornado

            trackURIs.push(bestMatch.uri);
            console.log(`Adicionando música: ${bestMatch.name} - ${bestMatch.artists[0].name}`);
        } else {
            console.warn(`Não foi possível encontrar a música: "${song}"`);
        }
    }

    if (trackURIs.length > 0) {
        await fetch("/add-tracks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                access_token,
                playlist_id,
                track_uris: trackURIs
            }),
        });
        alert("Playlist criada com sucesso!");
    } else {
        alert("Nenhuma música foi encontrada para adicionar à playlist.");
    }
});
