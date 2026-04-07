const API_KEY = "DEMO_KEY"; // Replace with your own NASA API key for better usage limits
const APOD_URL = "https://api.nasa.gov/planetary/apod";

const startDateInput = document.getElementById("startDate");
const endDateInput = document.getElementById("endDate");
const getImagesBtn = document.getElementById("getImagesBtn");
const gallery = document.getElementById("gallery");
const loadingMessage = document.getElementById("loadingMessage");
const errorMessage = document.getElementById("errorMessage");
const modal = document.getElementById("modal");
const modalBody = document.getElementById("modalBody");
const closeModalBtn = document.getElementById("closeModalBtn");
const modalBackdrop = document.getElementById("modalBackdrop");
const spaceFact = document.getElementById("spaceFact");

const spaceFacts = [
  "A day on Venus is longer than a year on Venus.",
  "Neutron stars can spin hundreds of times per second.",
  "Jupiter is so large that more than 1,300 Earths could fit inside it.",
  "The footprints on the Moon can last for millions of years.",
  "There are more stars in the universe than grains of sand on Earth.",
  "Saturn could float in water because it is mostly made of gas.",
  "Light from the Sun takes about 8 minutes to reach Earth.",
  "Olympus Mons on Mars is the tallest volcano in the solar system.",
  "Black holes do not suck everything in; objects must get very close first.",
  "The International Space Station travels around Earth about every 90 minutes."
];

document.addEventListener("DOMContentLoaded", () => {
  setDefaultDates();
  showRandomFact();
});

getImagesBtn.addEventListener("click", fetchAPODData);
closeModalBtn.addEventListener("click", closeModal);
modalBackdrop.addEventListener("click", closeModal);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !modal.classList.contains("hidden")) {
    closeModal();
  }
});

function setDefaultDates() {
  const today = new Date();
  const priorDate = new Date();
  priorDate.setDate(today.getDate() - 7);

  endDateInput.value = formatDate(today);
  startDateInput.value = formatDate(priorDate);

  // APOD minimum date from NASA documentation/project prompt
  startDateInput.min = "1995-06-16";
  endDateInput.min = "1995-06-16";

  const maxDate = formatDate(today);
  startDateInput.max = maxDate;
  endDateInput.max = maxDate;
}

function formatDate(date) {
  return date.toISOString().split("T")[0];
}

function showRandomFact() {
  const randomIndex = Math.floor(Math.random() * spaceFacts.length);
  spaceFact.textContent = spaceFacts[randomIndex];
}

async function fetchAPODData() {
  const startDate = startDateInput.value;
  const endDate = endDateInput.value;

  errorMessage.textContent = "";

  if (!startDate || !endDate) {
    errorMessage.textContent = "Please select both a start date and an end date.";
    return;
  }

  if (startDate > endDate) {
    errorMessage.textContent = "The start date cannot be later than the end date.";
    return;
  }

  showLoading(true);
  gallery.innerHTML = "";

  try {
    const requestUrl = `${APOD_URL}?api_key=${API_KEY}&start_date=${startDate}&end_date=${endDate}`;
    const response = await fetch(requestUrl);

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      gallery.innerHTML = `
        <div class="placeholder">
          No results were returned for that date range.
        </div>
      `;
      return;
    }

    // Show oldest to newest
    const sortedData = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));
    renderGallery(sortedData);
  } catch (error) {
    console.error("APOD fetch error:", error);
    gallery.innerHTML = `
      <div class="placeholder">
        Sorry, something went wrong while loading NASA data.
      </div>
    `;
    errorMessage.textContent = "There was an error loading the APOD data. Please try again.";
  } finally {
    showLoading(false);
  }
}

function showLoading(isLoading) {
  if (isLoading) {
    loadingMessage.classList.remove("hidden");
  } else {
    loadingMessage.classList.add("hidden");
  }
}

function renderGallery(items) {
  gallery.innerHTML = "";

  items.forEach((item) => {
    const card = document.createElement("article");
    card.className = "gallery-card";

    const mediaHTML =
      item.media_type === "image"
        ? `<img src="${item.url}" alt="${escapeHtml(item.title)}" loading="lazy" />`
        : getVideoPreviewHTML(item);

    card.innerHTML = `
      <div class="media-wrapper">
        ${mediaHTML}
      </div>
      <div class="card-body">
        <h3 class="card-title">${escapeHtml(item.title)}</h3>
        <p class="card-date">${item.date}</p>
        <p class="card-type">Type: ${capitalize(item.media_type || "unknown")}</p>
      </div>
    `;

    card.addEventListener("click", () => openModal(item));
    gallery.appendChild(card);
  });
}

function getVideoPreviewHTML(item) {
  if (isEmbeddableVideo(item.url)) {
    return `<iframe src="${convertToEmbedUrl(item.url)}" title="${escapeHtml(item.title)}" loading="lazy" allowfullscreen></iframe>`;
  }

  return `
    <div style="height: 100%; display: grid; place-items: center; padding: 20px; text-align: center;">
      <div>
        <p style="font-weight: bold; margin-bottom: 10px;">🎬 Video Entry</p>
        <p style="color: #c5d4ea;">Click to open more details.</p>
      </div>
    </div>
  `;
}

function openModal(item) {
  const mediaHTML =
    item.media_type === "image"
      ? `<img src="${item.hdurl || item.url}" alt="${escapeHtml(item.title)}" />`
      : getModalVideoHTML(item);

  modalBody.innerHTML = `
    <h2 id="modalTitle">${escapeHtml(item.title)}</h2>
    <p class="modal-date">${item.date}</p>
    <div class="modal-media">
      ${mediaHTML}
    </div>
    <p class="modal-explanation">${escapeHtml(item.explanation || "No explanation available.")}</p>
    ${
      item.media_type === "video"
        ? `<a class="video-link" href="${item.url}" target="_blank" rel="noopener noreferrer">Open original video in a new tab</a>`
        : ""
    }
  `;

  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");
}

function getModalVideoHTML(item) {
  if (isEmbeddableVideo(item.url)) {
    return `<iframe src="${convertToEmbedUrl(item.url)}" title="${escapeHtml(item.title)}" allowfullscreen></iframe>`;
  }

  return `
    <div style="padding: 24px;">
      <p>This APOD entry is a video and could not be embedded directly.</p>
      <p>Please use the link below to view it in a new tab.</p>
    </div>
  `;
}

function closeModal() {
  modal.classList.add("hidden");
  modal.setAttribute("aria-hidden", "true");
  modalBody.innerHTML = "";
}

function isEmbeddableVideo(url) {
  return typeof url === "string" && (
    url.includes("youtube.com") ||
    url.includes("youtu.be") ||
    url.includes("player.vimeo.com") ||
    url.includes("vimeo.com")
  );
}

function convertToEmbedUrl(url) {
  if (url.includes("youtube.com/embed/") || url.includes("player.vimeo.com/video/")) {
    return url;
  }

  if (url.includes("youtube.com/watch?v=")) {
    const videoId = new URL(url).searchParams.get("v");
    return `https://www.youtube.com/embed/${videoId}`;
  }

  if (url.includes("youtu.be/")) {
    const videoId = url.split("youtu.be/")[1]?.split("?")[0];
    return `https://www.youtube.com/embed/${videoId}`;
  }

  if (url.includes("vimeo.com/")) {
    const parts = url.split("/");
    const videoId = parts[parts.length - 1];
    return `https://player.vimeo.com/video/${videoId}`;
  }

  return url;
}

function capitalize(text) {
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
