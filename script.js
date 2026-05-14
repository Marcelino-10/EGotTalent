// Helper to post a submission and update UI
async function postSubmission(name, score) {
    const resp = await fetch('/calcScore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, score })
    });
    return resp.json();
}

/**
 * Fetches score data from the server and updates the DOM with the final score and submission list.
 */
async function loadScores() {
    const resp = await fetch('/scores');
    if (!resp.ok) return;
    const data = await resp.json();
    document.getElementById('finalScore').textContent = data.stats.finalScore.toFixed(2);
    const list = document.getElementById('submissions');
    list.innerHTML = '';

    /**
     * Renders a single submission item, represented by the parameter `s`, into the DOM list element. The submission's name, score, weight, and calculated result are displayed.
     */
    data.submissions.forEach(s => {
        const li = document.createElement('li');
        li.textContent = `${s.name} — score: ${s.score} weight: ${s.weight} result: ${s.result.toFixed(2)}`;
        list.appendChild(li);
    });
}

/**
 * Handles form submission, validating name and score before posting to the API and optionally reloading scores if the name is "Marcelino".
 */
document.getElementById('submit').addEventListener('click', async function () {
    const name = document.getElementById('name').value || '';
    const scoreVal = document.getElementById('score').value;
    const score = Number(scoreVal);

    if (!name.trim()) {
        alert('Please enter your name');
        return;
    }
    if (Number.isNaN(score)) {
        alert('Please enter a valid score');
        return;
    }

    // Send to server
    try {
        const result = await postSubmission(name, score);
        if (result.error) {
            alert('Error: ' + result.error);
            return;
        }
        // refresh list and final score
        if(name == "Marcelino")
            await loadScores();
        // else{
        //     document.getElementById('finalScore').style.display = 'none';
        //     document.getElementById('finalScore').style.display = 'none';
        //     document.getElementById('submissions').style.display = 'none';
        // }
    } catch (err) {
        console.error(err);
        alert('Failed to submit');
    }
});

// // Load initial scores on page load
// window.addEventListener('load', () => {
//     loadScores();
// });