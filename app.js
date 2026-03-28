document.addEventListener('DOMContentLoaded', () => {
    // --- PWA Service Worker & Install Prompt ---
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then(() => console.log('Service Worker Registered'))
            .catch(err => console.error('Service Worker Failed', err));
    }

    let deferredPrompt;
    const installBtn = document.getElementById('installBtn');

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        installBtn.style.display = 'block';
    });

    installBtn.addEventListener('click', async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                installBtn.style.display = 'none';
            }
            deferredPrompt = null;
        }
    });

    // --- Journal Data Management ---
    const storageKey = 'insomnia_journal_data';
    let journalData = JSON.parse(localStorage.getItem(storageKey)) || {
        nightly: [],
        dreams: [],
        thoughts: []
    };

    const saveData = () => {
        localStorage.setItem(storageKey, JSON.stringify(journalData));
    };

    // --- Navigation Logic ---
    const tabs = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));
            
            tab.classList.add('active');
            document.getElementById(tab.dataset.target).classList.add('active');
        });
    });

    // --- Form Toggles ---
    document.querySelectorAll('.toggle-form-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const form = e.target.nextElementSibling;
            form.classList.toggle('hidden');
        });
    });

    // --- Entry Creation & Rendering ---
    const formatTimestamp = (date) => {
        return new Intl.DateTimeFormat('en-US', {
            weekday: 'short', month: 'short', day: 'numeric', 
            hour: 'numeric', minute: '2-digit'
        }).format(date);
    };

    const renderEntries = (type) => {
        const container = document.getElementById(`${type}-entries`);
        container.innerHTML = '';
        
        const entries = journalData[type];
        
        entries.forEach(entry => {
            const card = document.createElement('div');
            card.className = 'entry-card';
            
            let moodHtml = entry.mood ? `<span class="entry-mood">${entry.mood}</span>` : '';
            
            card.innerHTML = `
                <div class="entry-header">
                    <span class="entry-time">${entry.timestamp}</span>
                    ${moodHtml}
                </div>
                <div class="entry-text">${entry.text}</div>
            `;
            container.appendChild(card);
        });
    };

    // Initial Render
    renderEntries('nightly');
    renderEntries('dreams');
    renderEntries('thoughts');

    // Save Buttons Logic
    document.querySelectorAll('.save-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const type = e.target.dataset.type;
            const textInput = document.getElementById(`${type}-text`);
            const text = textInput.value.trim();
            
            if (!text) return;

            const newEntry = {
                id: Date.now(),
                timestamp: formatTimestamp(new Date()),
                text: text
            };

            if (type === 'nightly') {
                const moodInput = document.getElementById('nightly-mood');
                newEntry.mood = moodInput.value || 'Unspecified';
                moodInput.value = '';
            }

            // Add to beginning of array (Reverse Chronological)
            journalData[type].unshift(newEntry);
            saveData();
            renderEntries(type);

            // Clear and hide form
            textInput.value = '';
            e.target.parentElement.classList.add('hidden');
        });
    });
});
