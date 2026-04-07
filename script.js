const apiKey = "PASTE_YOUR_NASA_API_KEY_HERE";
const gallery = document.getElementById("gallery");
const button = document.getElementById("getImages");
const loading = document.getElementById("loading");
const errorMessage = document.getElementById("errorMessage");

const modal = document.getElementById("modal");
const modalBody = document.getElementById("modalBody");
const closeBtn = document.getElementById("close");
const modalOverlay = document.querySelector(".modal-overlay");

const facts = [
  "A day on Venus is longer than a year on Venus.",
  "Neutron stars can spin hundreds of times per second.",
  "Jupiter is so large that more than 1,300 Earths could fit inside it.",
  "The footprints on the Moon can last for millions of years.",
  "Olympus Mons on Mars is the tallest volcano in the solar system.",
  "Light from the Sun takes about 8 minutes to reach Earth.",
  "There are more stars in the universe than grains of sand on Earth.",
  "Saturn could float in water because it is mostly made of gas."
];

document.addEventListener("DOMContentLoaded", () => {
  showRandomFact();
  setDefaultDates();
});

button.addEventListener("click", fetchImages);
closeBtn.addEventListener("click", closeModal);
modalOverlay.addEventListener("click", closeModal);

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !modal.classList.contains("hidden")) {
    closeModal();
  }
});

function showRandomFact() {
  const randomIndex = Math.floor(Math.random() * facts.length);
  document.getElementById("factBox").textContent = facts[randomIndex];
}

function setDefaultDates() {
  const today = new Date();
  const end = new Date(today);
  const start = new Date(today);

  start.setDate(end.getDate() - 8);

  const formattedEnd = formatDate(end);
  const formattedStart = formatDate(start);

  const startDateInput = document.getElementById("startDate");
  const endDateInput = document.getElementById("endDate");

  startDateInput.value = formattedStart;
  endDateInput.value = formattedEnd;

  startDateInput.min = "1995-06-16";
  endDateInput.min = "1995-06-16";
  startDateInput.max = formattedEnd;
  endDateInput.max = formattedEnd;
}

function formatDate(date) {
  return date.toISOString().split("T")[0];
}

async function fetchImages() {
  const startDate = document.getElementById("startDate").value;
  const endDate = document.getElementById("endDate").value;

  errorMessage.textContent = "";
  gallery.innerHTML = "";

  if (!startDate || !endDate) {
    errorMessage.textContent = "Please select both a start date and an end date.";
    return;
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = end - start;
  const diffDays = diffTime / (1000 * 60 * 60 * 24) + 1;

  if (diffDays !== 9) {
    errorMessage.textContent = "Please select exactly 9 consecutive days.";
    gallery.innerHTML = `
      <div class="placeholder">
        The selected range must be exactly 9 consecutive days.
      </div>
    `;
    return;
  }

  loading.classList.remove("hidden");

  try {
    const response = await fetch(
      `https://api.nasa.gov/planetary/apod?api_key=${apiKey}&start_date=${startDate}&end_date=${endDate}`
    );

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length !== 9) {
      throw new Error("The API did not return exactly 9 items.");
    }

    const sortedData = [...data].sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    renderGallery(sortedData);
  } catch (error) {
    console.error("NASA APOD fetch error:", error);
    errorMessage.textContent =
      "There was a problem loading the NASA data. Check your API key and date range, then try again.";

    gallery.innerHTML = `
      <div class="placeholder">
        Sorry, the gallery could not be loaded right now.
      </div>
    `;
  } finally {
    loading.classList.add("hidden");
  }
}

function renderGallery(items) {
  gallery.innerHTML = "";

  items.forEach((item) => {
    const card = document.createElement("div");
    card.classList.add("card");

    const preview =
      item.media_type === "image"
        ? `<img src="${item.url}" alt="${escapeHtml(item.title)}">`
        : `<div class="video-preview">🎬 Video Entry Available</div>`;

    card.innerHTML = `
      ${preview}
      <div class="card-body">
        <h3>${escapeHtml(item.title)}</h3>
        <p>${item.date}</p>
        <p class="card-type">Type: ${capitalize(item.media_type)}</p>
      </div>
    `;

    card.addEventListener("click", () => openModal(item));
    gallery.appendChild(card);
  });
}

function openModal(item) {
  const mediaSection =
    item.media_type === "image"
      ? `<img class="modal-image" src="${item.hdurl || item.url}" alt="${escapeHtml(item.title)}">`
      : `
        <div class="video-message">
          <p><strong>This APOD entry is a video.</strong></p>
          <p>Use the link below to watch the original video.</p>
          <a class="video-link" href="${item.url}" target="_blank" rel="noopener noreferrer">
            Watch Video
          </a>
        </div>
      `;

  modalBody.innerHTML = `
    <h2>${escapeHtml(item.title)}</h2>
    <p class="modal-date">${item.date}</p>
    ${mediaSection}
    <p>${escapeHtml(item.explanation || "No explanation available.")}</p>
  `;

  modal.classList.remove("hidden");
}

function closeModal() {
  modal.classList.add("hidden");
  modalBody.innerHTML = "";
}

function capitalize(text) {
  if (!text) return "Unknown";
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
