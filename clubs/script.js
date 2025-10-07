document.addEventListener("DOMContentLoaded", async function () {
  const toggleBtn = document.getElementById("toggleFilters");
  const cardGrid = document.getElementById("clubCards");
  const searchInput = document.getElementById("searchInput");
  const tagMenu = document.getElementById("tagMenu");
  const overlay = document.getElementById("clubOverlay");
  const closeOverlay = document.getElementById("closeOverlay");
  const imgEl = document.getElementById("overlayImage");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const iconMap = {
  instagram: "instagram",
  twitter: "twitter",
  facebook: "facebook",
  website: "globe",
  remind: "bell",

  };

  let clubs = [];
  let selectedTag = "all";
  let currentImages = [];
  let currentIndex = 0;

  // Load clubs
  await fetch("./data.json")
    .then(response => response.json())
    .then(data => {
      clubs = data;
      clubs.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
      renderCards(clubs);
    });
    
  // Load tags
  async function loadTags() {
    const res = await fetch("tags.json");
    const clubTags = await res.json();
    clubTags.sort((a, b) => a.name.localeCompare(b.name));
    renderTagMenu(clubTags);
  }

 
    toggleBtn.addEventListener("click", () => {
    // Toggle "show" class
    tagMenu.classList.toggle("show");

    if (tagMenu.classList.contains("show")) {
      toggleBtn.textContent = "Hide Filters ⬆";
    } else {
      toggleBtn.textContent = "Show Filters ⬇";
    }
  });
  
  function renderCards(clubsToRender) {
    cardGrid.innerHTML = "";

    clubsToRender.forEach(club => {
      const card = document.createElement("div");
      card.classList.add("club-card");

      const tagSpans = club.tags
        .map(tag => `<span class="tag ${tag.toLowerCase().replace(/\s+/g, '-')}">${tag}</span>`)
        .join(" ");

      card.innerHTML = `
        <h2>${club.name}</h2>
        <div class="tag-card-row">${tagSpans}</div>
        <p class="description">${club.description}</p>
        <div class="club-footer">
          <span class="club-time">${club.time || ""}</span>
          <span class="club-day">${club.day || ""}</span>
        </div>
      `;
      
      //  Overlay open on click
      card.addEventListener("click", () => openOverlay(club));
       
      cardGrid.appendChild(card);
    });

      updateClubCount(clubsToRender.length);
  }
    function showImage(index) {
    console.log("showImage called with index:", index);
    if (currentImages.length > 0) {
      currentIndex = (index + currentImages.length) % currentImages.length;
      imgEl.src = currentImages[currentIndex];
    }
  }

  // Overlay functionality
  function openOverlay(club) {
    overlay.classList.remove("hide");

    console.log("openOverlay called with club:", club);
    document.getElementById("overlayTitle").textContent = club.name;
    document.getElementById("tags").innerHTML = club.tags.map(tag =>
      `<span class="tag ${tag.toLowerCase().replace(/\s+/g, '-')}">${tag}</span>`
    ).join(" ");
    
    // Handle gallery images
    currentImages = club.images || [];
    currentIndex = 0;

    if (currentImages.length > 0) {
      imgEl.src = currentImages[currentIndex];
      imgEl.style.display = "block";
    } else {
      imgEl.style.display = "none";
    }

    document.getElementById("overlayDescription").textContent = club.description;
    document.getElementById("overlayTime").textContent = club.time || "Not specified";
    document.getElementById("overlayDay").textContent = club.day || "Not specified";
    document.getElementById("overlayRoom").textContent = club.room || "Not specified";

    // Membership
    document.getElementById("overlayReq").textContent = club.requirements || "Open to all students";
    document.getElementById("overlayDues").textContent = club.dues || "None";
    // Contact
    document.getElementById("overlaySponsor").textContent = club.sponsors || "Not specified";
    document.getElementById("overlayEmail").textContent = club.emails || "Not specified";

    // Social Media
    const socialEl = document.getElementById("overlaySocial");
    socialEl.innerHTML = (club.social || []).map(link => {
      let platform = "";

      if (link.url.includes("instagram.com")) platform = "instagram";
      else if (link.url.includes("facebook.com")) platform = "facebook";
      else if (link.url.includes("twitter.com") || link.url.includes("x.com")) platform = "twitter";
      else if (link.url.includes("remind.com")) platform = "remind";
      else if (link.url.includes("http")) platform = "website";
      else platform = "website"; // default icon

      return `
        <a href="${link.url}" target="_blank" class="social-pill ${platform}">
          <i data-lucide="${platform === "remind" ? "bell" : platform}"></i>
          <span>${link.label}</span>
        </a>
      `;
    }).join("");

    // re-render lucide icons
    lucide.createIcons();

    
  }

  // ✅ attach listeners only once
  prevBtn.addEventListener("click", () => showImage(currentIndex - 1));
  nextBtn.addEventListener("click", () => showImage(currentIndex + 1));


  //Close overlay
  document.getElementById("closeOverlay").addEventListener("click", () => {
    overlay.classList.add("hide");
  });
  //also close overlay on clicking outside
  document.getElementById("clubOverlay").addEventListener("click", (e) => {
    if (e.target === overlay) {
      overlay.classList.add("hide");
    }
  });
  function updateClubCount(count) {
    const clubCountElement = document.getElementById("clubCount");
    clubCountElement.textContent = `${count} clubs found`;
  }
  function renderTagMenu(tags) {
    tagMenu.innerHTML = "";

    // "All" button
    const allBtn = document.createElement("button");
    allBtn.classList.add("tag-filter", "active");
    allBtn.dataset.tag = "all";
    allBtn.textContent = "All";
    tagMenu.appendChild(allBtn);

    // Tag buttons
    tags.forEach(tag => {
        
      const btn = document.createElement("button");
      btn.classList.add("tag-filter");
      btn.dataset.tag = tag.name.toLowerCase().replace(/\s+/g, '-');
      btn.textContent = tag.name;
      tagMenu.appendChild(btn);
    });

    // Add event listeners for tag filters
    document.querySelectorAll(".tag-filter").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".tag-filter").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        selectedTag = btn.dataset.tag;

        const filtered = selectedTag === "all"
          ? clubs
          : clubs.filter(club => club.tags.some(t => t.toLowerCase().replace(/\s+/g, '-') === selectedTag));

        renderCards(filtered);
      });
    });
  }

  // Search logic
  searchInput.addEventListener("input", function () {
    /*
    This is an array prototype I have that basiaclly does a "smart search", you can implement this to have a more dynamic search:
    export function closest(string, count = Infinity, minscore = 0) {
        let result = this.map(item => {
          const stringItem = typeof item == "string" ? item : JSON.stringify(item);
          let score = 0;
          if(stringItem == string) score++;
          for(let i = 0; i < string.length; i++) {
              if(stringItem.substring(i, i + string.length) == string) score++;
          }
          for(let i = 0; i < stringItem.length; i++) {
              for(let n = 0; n < string.length; n++) {
                  if(stringItem[i] == string[n]) score++;
              }
          }
          return { item, score };
      });
      result.sort((a, b) => b.score - a.score);
      result = result.slice(0, count);
      result = result.filter(e => e.score > minscore);
      return result;
    }

    Array.prototype.closest = closest;

    sourced from my js utils (the updated version should be avalible rn, its been a while since i updated the source)
    you can find all my utils at https://github.com/BeanTheAlien/utilpackages
    my js utils are at https://github.com/BeanTheAlien/utilpackages/blob/main/JavaScript/jsutils.js
    */
    const query = searchInput.value.toLowerCase();
    const min = 1;
    let result = clubs.map(c => {
      const stringItem = typeof item == "string" ? item : JSON.stringify(item);
          let score = 0;
          if(stringItem == string) score++;
          for(let i = 0; i < string.length; i++) {
              if(stringItem.substring(i, i + string.length) == string) score++;
          }
          for(let i = 0; i < stringItem.length; i++) {
              for(let n = 0; n < string.length; n++) {
                  if(stringItem[i] == string[n]) score++;
              }
          }
          return { item, score };
    });
    result.sort((a, b) => b.score - a.score);
    result = result.filter(r => r.score > min);
    result = selectedTag == "all" ? result : result.filter(r => r.tags.some(t => t.toLowerCase().replace(/\s+/g, "-") == selectedTag));
    // const filtered = clubs.filter(club =>
      // club.name.toLowerCase().split(" ").some(word => word.startsWith(query))
    // );

    // Apply tag filter *on top of search*
    // const finalFiltered = selectedTag === "all"
      // ? filtered
      // : filtered.filter(club => club.tags.some(t => t.toLowerCase().replace(/\s+/g, '-') === selectedTag));

    // renderCards(finalFiltered);
    renderCards(result);
  });

  loadTags();
});
