WinAPI.createWindow('jokes');

window.fetchJoke = async function() {
    const el = document.getElementById('joke-area');
    if (!el) return;
    el.textContent = 'Loading...';
    try {
        const res = await fetch('https://v2.jokeapi.dev/joke/Programming?type=single');
        const data = await res.json();
        el.textContent = data.joke;
    } catch {
        el.textContent = 'Error fetching joke.';
    }
};

fetchJoke();
