console.log("Its Working");

// const token = getToken();
// if (!token) {
//   window.location.replace("/login.html");
// }

let habits = [];
let dailyEntry = { habits: [] };
let editingHabitId = null;

function formatDateValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateValue(date) {
  const parts = date.split("-");
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

const today = formatDateValue(new Date());
let selectedDate = today;

const dateSelector = document.getElementById("date-selector");
dateSelector.max = today;
dateSelector.value = today;
// general
const habitList = document.getElementById("habit-list");
const loadingSpinner = document.getElementById("loading-indicator");
const progressCircle = document.getElementById("progress-circle");
const progressPercent = document.getElementById("progress-percent");
const weekDates = document.getElementById("week-dates");

//Habit
const habitModal = document.getElementById("habit-modal");
const habitName = document.getElementById("habit-name");
const habitDescription = document.getElementById("habit-description");
const habitIcon = document.getElementById("habit-icon");
const habitSaveButton = document.getElementById("save-button");
//Profile
const profileModal = document.getElementById("profile-modal");
const profileName = document.getElementById("profile-name");
const profileEmail = document.getElementById("profile-email");
//Modal
const modalTitle = document.getElementById("modal-title");

function showLoading(isLoading) {
  if (isLoading) {
    loadingSpinner.classList.remove("hidden");
    loadingSpinner.classList.add("flex");
    habitList.classList.add("opacity-40", "pointer-events-none");
  } else {
    loadingSpinner.classList.remove("flex");
    loadingSpinner.classList.add("hidden");
    habitList.classList.remove("opacity-40", "pointer-events-none");
  }
}

async function loadData() {
  showLoading(true);
  try {
    const profileResponse = await authFetch("/api/auth/me");
    const habitsResponse = await authFetch("/api/habits");
    const dailyEntryResponse = await authFetch(
      "/api/dailyEntry/" + selectedDate,
    );

    if (!habitsResponse.ok || !dailyEntryResponse.ok || !profileResponse.ok) {
      return;
    }
    habits = await habitsResponse.json();
    dailyEntry = await dailyEntryResponse.json();
    const profile = await profileResponse.json();
    profileName.value = profile.user.name;
    profileEmail.value = profile.user.email;

    console.log(habits);
    console.log(dailyEntry);

    renderDates();
    renderHabits();
    updateProgress();
  } catch (error) {
    console.error(error);
  } finally {
    showLoading(false);
  }
}

function changeDate(date) {
  if (date === "" || date > today) {
    dateSelector.value = selectedDate;
    return;
  }
  selectedDate = date;
  loadData();
}

function renderDates() {
  dateSelector.value = selectedDate;
  weekDates.textContent = "";

  const selected = parseDateValue(selectedDate);

  for (let i = 0; i < 5; i++) {
    const date = new Date(selected);
    date.setDate(selected.getDate() + i - 2);

    const dateValue = formatDateValue(date);
    const button = document.createElement("button");
    const dayName = document.createElement("span");
    const dayNumber = document.createElement("strong");

    button.type = "button";
    button.className =
      "rounded-lg border border-surface p-3 hover:bg-surface cursor-pointer"; // Fixed typo: haver -> hover

    if (dateValue === selectedDate) {
      button.className = "rounded-lg bg-primary p-3 text-white cursor-pointer";
      button.setAttribute("aria-pressed", "true");
    }
    if (dateValue > today) {
      button.disabled = true;
      button.className = "rounded-lg border border-surface p-3 text-surface";
    }

    dayName.className = "block text-xl";
    // Changed undefined to 'en-AU' for Australian locale formatting
    dayName.textContent = date.toLocaleDateString("en-AU", {
      weekday: "short",
    });
    dayNumber.textContent = date.getDate();

    button.appendChild(dayName);
    button.appendChild(dayNumber);
    button.addEventListener("click", function () {
      changeDate(dateValue);
    });
    weekDates.appendChild(button);
  }
}

function openHabitModel() {
  editingHabitId = null;
  modalTitle.textContent = "Add Habit";
  habitName.value = "";
  habitDescription.value = "";
  habitIcon.value = "";
  habitModal.classList.remove("hidden");
  habitModal.classList.add("flex");
}

function editHabitModal(habit) {
  editingHabitId = habit._id;
  modalTitle.textContent = "edit Habit";
  habitName.value = habit.name;
  habitDescription.value = habit.description;
  habitIcon.value = habit.icon;
  habitModal.classList.remove("hidden");
  habitModal.classList.add("flex");
}

function openProfileModal() {
  profileModal.classList.remove("hidden");
  profileModal.classList.add("flex");
}

function isCompleted(habitId) {
  for (let i = 0; i < dailyEntry.habits.length; i++) {
    if (dailyEntry.habits[i].habit === habitId) {
      return dailyEntry.habits[i].completed;
    }
  }
  return false;
}

function setCompletion(habitId, completed) {
  for (let i = 0; i < dailyEntry.habits.length; i++) {
    if (dailyEntry.habits[i].habit === habitId) {
      dailyEntry.habits[i].completed = completed;
      return;
    }
  }

  dailyEntry.habits.push({ habit: habitId, completed: completed });
}
async function updateComletion(habitId, completed) {
  const previousValue = isCompleted(habitId);
  const date = selectedDate;

  setCompletion(habitId, completed);
  renderHabits();
  updateProgress();

  try {
    const response = await authFetch("/api/dailyEntry/update", {
      method: "PATCH",
      headers: { "Content-type": "application/json" },
      body: JSON.stringify({
        date: date,
        habitId: habitId,
        completed: completed,
      }),
    });

    if (!response.ok) {
      throw new Error("Could not save habit completion.");
    }
  } catch (error) {
    console.error(error);

    if (selectedDate === date) {
      setCompletion(habitId, previousValue);
      renderHabits();
      updateProgress();
    }
  }
}

function updateProgress() {
  let percent = 0;
}

function renderHabits() {
  habitList.textContent = "";

  if (habits.length === 0) {
    habitList.textContent = "No habits yet.";
    return;
  }

  for (let i = 0; i < habits.length; i++) {
    const habit = habits[i];
    const completed = isCompleted(habit._id);
    const card = document.createElement("div");
    const icon = document.createElement("div");
    const details = document.createElement("div");
    const title = document.createElement("h3");
    const description = document.createElement("p");
    const buttons = document.createElement("div");

    const editButton = document.createElement("button");
    editButton.textContent = "Edit";
    const deleteButton = document.createElement("button");
    deleteButton.textContent = "delete";
    const completeButton = document.createElement("button");

    card.className =
      "flex flex-wrap items-center gap-4 border border-surface p-4 rounded-lg";
    icon.className =
      "flex h-12 w-12 shrink-0 items-center justify-center bg-surface font-bold rounded-lg";
    details.classList = "min-w-0 flex-1";
    title.className = "font-bold";
    description.className = "text-sm text-foreground/70";
    buttons.className = "ml-auto flex flex-row items-center gap-2";

    editButton.className = "px-2 py-1 text-sm cursor-pointer select-none";
    deleteButton.className =
      "px-2 py-1 text-sm text-red-500 cursor-pointer select-none";
    completeButton.className =
      "h-10 w-10 rounded-full border-2 border-surface cursor-pointer";
    if (completed) {
      completeButton.className =
        "h-10 w-10 bg-primary rounded-full border-2 border-surface cursor-pointer";
    }

    title.textContent = habit.name;
    icon.textContent = habit.icon;
    description.textContent = habit.description;

    editButton.addEventListener("click", function () {
      editHabitModal(habit);
    });
    deleteButton.addEventListener("click", function () {
      deleteHabit(habit._id);
    });
    completeButton.addEventListener("click", function () {
      updateComletion(habit._id, !completed);
    });

    details.appendChild(title);
    details.appendChild(description);

    buttons.appendChild(editButton);
    buttons.appendChild(deleteButton);
    buttons.appendChild(completeButton);

    card.appendChild(icon);
    card.appendChild(details);
    card.appendChild(buttons);

    habitList.appendChild(card);
  }
}
function updateProgress() {
  let completedCount = 0;

  for (let i = 0; i < habits.length; i++) {
    if (isCompleted(habits[i]._id)) {
      completedCount += 1;
    }
  }
  let percent = 0;

  if (habits.length > 0) {
    percent = Math.round((completedCount / habits.length) * 100);
  }

  progressPercent.textContent = `${percent}%`;
  progressCircle.style.background =
    "conic-gradient(var(--color-primary) " +
    percent +
    "%, var(--color-surface) 0)";
}
function showConfetti() {
  const end = Date.now() + 2000;
  const colors = ["#91d06c", "#4c8ce4"];
  (function frame() {
    showConfetti({
      particleCount: 2,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors,
    });
    confetti({
      particleCount: 2,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors,
    });
    if (date.now() < end) requestAnimationFrame(frame);
  })();
}

async function saveHabit() {
  habitSaveButton.textContent = "Loading....";
  habitSaveButton.setAttribute("disabled", true);
  try {
    const name = habitName.value.trim();
    const description = habitDescription.value.trim();
    const icon = habitIcon.value.trim();

    if (name === "" || description === "") {
      alert("Enter a name and description");
      return;
    }

    let url = "/api/habits/add";
    let method = "POST";

    const body = {
      name: name,
      description: description,
      icon: icon,
    };

    if (editingHabitId !== null) {
      url = "/api/habits/update";
      method = "PATCH";
      body.id = editingHabitId;
    }
    await authFetch(url, {
      method: method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    closeModals();
    loadData();
  } catch (error) {
    console.error(error);
    alert("Could not save habit");
  } finally {
    habitName.value = "";
    habitDescription.value = "";
    habitIcon.value = "";
    habitSaveButton.removeAttribute("disabled");
    habitSaveButton.textContent = "Save Habit";
  }
}

async function deleteHabit(habitId) {
  showLoading(true);
  try {
    await authFetch("/api/habits/delete", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ habitId: habitId }),
    });

    loadData();
  } catch (error) {
    console.error;
  } finally {
    showLoading(false);
  }
}

function closeModals() {
  habitModal.classList.remove("flex");
  habitModal.classList.add("hidden");

  profileModal.classList.remove("flex");
  profileModal.classList.add("hidden");
}

document
  .getElementById("add-habit-button")
  .addEventListener("click", function () {
    openHabitModel();
  });
document.getElementById("save-button").addEventListener("click", function () {
  saveHabit();
});
document.getElementById("cancel-button").addEventListener("click", function () {
  closeModals();
});

//profile Model
document
  .getElementById("profile-button")
  .addEventListener("click", function () {
    openProfileModal();
  });
document.getElementById("logout-button").addEventListener("click", function () {
  logout();
});
document
  .getElementById("profile-cancel-button")
  .addEventListener("click", function () {
    closeModals();
  });

//Date
dateSelector.addEventListener("change", function () {
  changeDate(dateSelector.value);
});

loadData();
