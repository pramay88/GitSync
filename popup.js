//popup.js
document.addEventListener('DOMContentLoaded', () => {
    const connectBtn = document.getElementById('connect-btn');
    const tokenInput = document.getElementById('github-token');
    const authStatus = document.getElementById('auth-status');

    const saveBtn = document.getElementById('save-settings-btn');
    const repoInput = document.getElementById('repo-name');
    const commitMsgInput = document.getElementById('commit-message');
    const autoSyncCheckbox = document.getElementById('auto-sync');
    const messageContainer = document.getElementById('message-container');

    // Check saved auth on load
    chrome.runtime.sendMessage({ action: 'checkAuth' }, (response) => {
        if (response.success && response.authenticated) {
            authStatus.classList.remove('disconnected');
            authStatus.classList.add('connected');
            authStatus.innerHTML = `
                <div class="status-dot"></div>
                <span>Connected as ${response.username}</span>
            `;
        }
    });

    // Handle connect to GitHub
    connectBtn.addEventListener('click', () => {
        const token = tokenInput.value.trim();

        if (!token.startsWith('ghp_') && token.length < 40) {
            alert('Please enter a valid GitHub personal access token');
            return;
        }

        chrome.runtime.sendMessage({
            action: 'authenticate',
            data: { token }
        }, (response) => {
            if (response.success) {
                authStatus.classList.remove('disconnected');
                authStatus.classList.add('connected');
                authStatus.innerHTML = `
                    <div class="status-dot"></div>
                    <span>Connected as ${response.username}</span>
                `;
                showMessage('Connected to GitHub!', 'success');
            } else {
                alert('Authentication failed: ' + response.error);
            }
        });
    });

    // Handle saving sync settings
    saveBtn.addEventListener('click', () => {
        const config = {
            repoName: repoInput.value.trim(),
            defaultCommitMessage: commitMsgInput.value.trim(),
            autoCommit: autoSyncCheckbox.checked,
        };

        chrome.runtime.sendMessage({
            action: 'saveConfig',
            data: config
        }, (response) => {
            if (response.success) {
                showMessage('Settings saved successfully', 'success');
            } else {
                showMessage('Failed to save settings: ' + response.error, 'error');
            }
        });
    });

    // Display message
    function showMessage(text, type) {
        messageContainer.innerHTML = `
            <div class="message ${type}">${text}</div>
        `;
        setTimeout(() => messageContainer.innerHTML = '', 4000);
    }
});

// stats

const totalSyncedEl = document.getElementById("total-synced");
const easyCountEl = document.getElementById("easy-count");
const mediumCountEl = document.getElementById("medium-count");
const hardCountEl = document.getElementById("hard-count");

chrome.storage.local.get(["syncedSolutions"], (result) => {
  const history = result.syncedSolutions || [];
  const seen = new Set();
  const counts = { Easy: 0, Medium: 0, Hard: 0 };

  history.forEach(item => {
    const id = item.title?.split('.')[0]; // unique ID from title
    if (!seen.has(id)) {
      seen.add(id);
      const diff = item.difficulty?.trim();
      if (counts[diff] !== undefined) counts[diff]++;
    }
  });

  const total = seen.size;

  // Animate ring fill (max ring is 100)
  const fg = document.querySelector('.progress-ring .fg');
  const circumference = 2 * Math.PI * 40;
  const percent = Math.min((total / 100) * 100, 100);
  const offset = circumference - (percent / 100) * circumference;
  fg.style.strokeDashoffset = offset;

  document.getElementById("synced-count").textContent = total;
  document.getElementById("easy-count-box").textContent = counts.Easy;
  document.getElementById("medium-count-box").textContent = counts.Medium;
  document.getElementById("hard-count-box").textContent = counts.Hard;
});

document.querySelectorAll(".tab-button").forEach(button => {
  button.addEventListener("click", () => {
    const tab = button.getAttribute("data-tab");

    // Toggle active tab button
    document.querySelectorAll(".tab-button").forEach(btn => btn.classList.remove("active"));
    button.classList.add("active");

    // Toggle content
    document.querySelectorAll(".tab-content").forEach(content => {
      content.classList.remove("active");
      if (content.getAttribute("data-tab") === tab) {
        content.classList.add("active");
      }
    });
  });
});

// Handle auto-sync toggle
function switchTab(tabName) {
    document.querySelectorAll(".tab-button").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.tab === tabName);
    });

    document.querySelectorAll(".tab-content").forEach(content => {
      content.classList.toggle("active", content.dataset.tab === tabName);
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    chrome.storage.local.get(["githubToken"], (result) => {
      const token = result.githubToken;
      const defaultTab = token && token.startsWith("ghp_") ? "stats" : "sync";
      switchTab(defaultTab);
    });

    document.querySelectorAll(".tab-button").forEach(button => {
      button.addEventListener("click", () => {
        const tab = button.getAttribute("data-tab");
        switchTab(tab);
      });
    });
  });
