// Data Storage
let nutritionData = JSON.parse(localStorage.getItem('nutritionData')) || {};
let dailyGoal = parseInt(localStorage.getItem('dailyGoal')) || 2000;
let proteinGoal = parseInt(localStorage.getItem('proteinGoal')) || 150;
let currentDate = new Date();
let selectedDate = new Date();

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    initializeCalendar();
    updateNavStats();
    updateDailyLog();
    setupEventListeners();
    updateGoalDisplay();
});

// Setup Event Listeners
function setupEventListeners() {
    // Calendar navigation
    document.getElementById('prevMonth').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        initializeCalendar();
    });

    document.getElementById('nextMonth').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        initializeCalendar();
    });

    // Add meal modal
    document.getElementById('addMealBtn').addEventListener('click', openAddMealModal);
    document.getElementById('closeMealModal').addEventListener('click', closeAddMealModal);
    document.getElementById('cancelMealBtn').addEventListener('click', closeAddMealModal);
    document.getElementById('addMealForm').addEventListener('submit', handleAddMeal);

    // Set goal modal
    document.getElementById('setGoalBtn').addEventListener('click', openSetGoalModal);
    document.getElementById('closeGoalModal').addEventListener('click', closeSetGoalModal);
    document.getElementById('cancelGoalBtn').addEventListener('click', closeSetGoalModal);
    document.getElementById('setGoalForm').addEventListener('submit', handleSetGoal);

    // Quick actions
    document.getElementById('viewHistoryBtn').addEventListener('click', viewHistory);
    document.getElementById('exportDataBtn').addEventListener('click', exportData);

    // Close modal on outside click
    document.getElementById('addMealModal').addEventListener('click', (e) => {
        if (e.target.id === 'addMealModal') closeAddMealModal();
    });

    document.getElementById('setGoalModal').addEventListener('click', (e) => {
        if (e.target.id === 'setGoalModal') closeSetGoalModal();
    });
}

// Calendar Functions
function initializeCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Update month title
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'];
    document.getElementById('currentMonth').textContent = `${monthNames[month]} ${year}`;

    // Generate calendar grid
    const calendarGrid = document.getElementById('calendarGrid');
    calendarGrid.innerHTML = '';

    // Add day headers
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayHeaders.forEach(day => {
        const header = document.createElement('div');
        header.className = 'calendar-day-header';
        header.textContent = day;
        calendarGrid.appendChild(header);
    });

    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    // Add previous month's days
    for (let i = firstDay - 1; i >= 0; i--) {
        const day = daysInPrevMonth - i;
        const dayElement = createCalendarDay(day, month - 1, year, true);
        calendarGrid.appendChild(dayElement);
    }

    // Add current month's days
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = createCalendarDay(day, month, year, false);
        calendarGrid.appendChild(dayElement);
    }

    // Add next month's days
    const remainingDays = 42 - (firstDay + daysInMonth);
    for (let day = 1; day <= remainingDays; day++) {
        const dayElement = createCalendarDay(day, month + 1, year, true);
        calendarGrid.appendChild(dayElement);
    }
}

function createCalendarDay(day, month, year, isOtherMonth) {
    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-day';
    
    if (isOtherMonth) {
        dayElement.classList.add('other-month');
    }

    const dateStr = formatDate(new Date(year, month, day));
    const dayData = nutritionData[dateStr];
    
    // Check if it's today
    const today = new Date();
    if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
        dayElement.classList.add('today');
    }

    // Check if it's selected
    if (day === selectedDate.getDate() && month === selectedDate.getMonth() && year === selectedDate.getFullYear()) {
        dayElement.classList.add('selected');
    }

    // Add data indicator
    if (dayData && dayData.meals && dayData.meals.length > 0) {
        dayElement.classList.add('has-data');
        const totalCalories = calculateDayTotal(dayData.meals).calories;
        
        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        dayNumber.textContent = day;
        
        const dayCalories = document.createElement('div');
        dayCalories.className = 'day-calories';
        dayCalories.textContent = `${totalCalories} kcal`;
        
        dayElement.appendChild(dayNumber);
        dayElement.appendChild(dayCalories);
    } else {
        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        dayNumber.textContent = day;
        dayElement.appendChild(dayNumber);
    }

    dayElement.addEventListener('click', () => {
        if (!isOtherMonth) {
            selectedDate = new Date(year, month, day);
            initializeCalendar();
            updateDailyLog();
        }
    });

    return dayElement;
}

// Daily Log Functions
function updateDailyLog() {
    const dateStr = formatDate(selectedDate);
    const dayData = nutritionData[dateStr] || { meals: [] };
    
    // Update selected date header
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('selectedDate').textContent = selectedDate.toLocaleDateString('en-US', options);

    // Update meals list
    const mealsList = document.getElementById('mealsList');
    
    if (dayData.meals.length === 0) {
        mealsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🍽️</div>
                <p>No meals logged for this day</p>
                <p class="empty-subtitle">Click "Add Meal" to start tracking</p>
            </div>
        `;
    } else {
        mealsList.innerHTML = '';
        dayData.meals.forEach((meal, index) => {
            const mealCard = createMealCard(meal, index);
            mealsList.appendChild(mealCard);
        });
    }

    // Update nutrition summary
    updateNutritionSummary(dayData.meals);
    
    // Update weekly chart
    updateWeeklyChart();
    
    // Update nav stats
    updateNavStats();
}

function createMealCard(meal, index) {
    const card = document.createElement('div');
    card.className = 'meal-card';
    
    card.innerHTML = `
        <div class="meal-header">
            <span class="meal-type-badge ${meal.type}">${getMealTypeIcon(meal.type)} ${capitalize(meal.type)}</span>
            <div class="meal-actions">
                <button class="btn-icon" onclick="editMeal(${index})" title="Edit">✏️</button>
                <button class="btn-icon" onclick="deleteMeal(${index})" title="Delete">🗑️</button>
            </div>
        </div>
        <div class="meal-name">${meal.name}</div>
        <div class="meal-serving">${meal.servingSize}</div>
        <div class="meal-nutrition">
            <div class="nutrition-item">
                <span class="nutrition-value">${meal.calories}</span>
                <span class="nutrition-label">Calories</span>
            </div>
            <div class="nutrition-item">
                <span class="nutrition-value">${meal.protein}g</span>
                <span class="nutrition-label">Protein</span>
            </div>
            <div class="nutrition-item">
                <span class="nutrition-value">${meal.carbs}g</span>
                <span class="nutrition-label">Carbs</span>
            </div>
            <div class="nutrition-item">
                <span class="nutrition-value">${meal.fat}g</span>
                <span class="nutrition-label">Fat</span>
            </div>
        </div>
        ${meal.notes ? `<div class="meal-notes">Note: ${meal.notes}</div>` : ''}
    `;
    
    return card;
}

function updateNutritionSummary(meals) {
    const totals = calculateDayTotal(meals);
    
    document.getElementById('summaryCalories').textContent = totals.calories;
    document.getElementById('summaryProtein').textContent = totals.protein.toFixed(1);
    document.getElementById('summaryCarbs').textContent = totals.carbs.toFixed(1);
    document.getElementById('summaryFat').textContent = totals.fat.toFixed(1);
    document.getElementById('summaryCaloriesGoal').textContent = dailyGoal;
    document.getElementById('summaryProteinGoal').textContent = proteinGoal;
    
    // Update progress bars
    const caloriesPercent = Math.min((totals.calories / dailyGoal) * 100, 100);
    const proteinPercent = Math.min((totals.protein / proteinGoal) * 100, 100);
    const carbsPercent = Math.min((totals.carbs / (dailyGoal * 0.5 / 4)) * 100, 100);
    const fatPercent = Math.min((totals.fat / (dailyGoal * 0.2 / 9)) * 100, 100);
    
    document.getElementById('caloriesProgress').style.width = caloriesPercent + '%';
    document.getElementById('proteinProgress').style.width = proteinPercent + '%';
    document.getElementById('carbsProgress').style.width = carbsPercent + '%';
    document.getElementById('fatProgress').style.width = fatPercent + '%';
}

function updateWeeklyChart() {
    const weeklyChart = document.getElementById('weeklyChart');
    weeklyChart.innerHTML = '';
    
    // Get last 7 days
    const days = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date(selectedDate);
        date.setDate(date.getDate() - i);
        days.push(date);
    }
    
    // Find max calories for scaling
    let maxCalories = dailyGoal;
    days.forEach(date => {
        const dateStr = formatDate(date);
        const dayData = nutritionData[dateStr];
        if (dayData && dayData.meals) {
            const total = calculateDayTotal(dayData.meals).calories;
            maxCalories = Math.max(maxCalories, total);
        }
    });
    
    // Create bars
    days.forEach(date => {
        const dateStr = formatDate(date);
        const dayData = nutritionData[dateStr];
        const total = dayData && dayData.meals ? calculateDayTotal(dayData.meals).calories : 0;
        const height = (total / maxCalories) * 100;
        
        const bar = document.createElement('div');
        bar.className = 'weekly-bar';
        bar.style.height = height + '%';
        bar.title = `${total} kcal`;
        
        const label = document.createElement('div');
        label.className = 'weekly-bar-label';
        label.textContent = date.toLocaleDateString('en-US', { weekday: 'short' });
        
        if (total > 0) {
            const value = document.createElement('div');
            value.className = 'weekly-bar-value';
            value.textContent = total;
            bar.appendChild(value);
        }
        
        bar.appendChild(label);
        weeklyChart.appendChild(bar);
    });
}

function updateNavStats() {
    const today = new Date();
    const todayStr = formatDate(today);
    const todayData = nutritionData[todayStr];
    const todayTotals = todayData && todayData.meals ? calculateDayTotal(todayData.meals) : { calories: 0, protein: 0 };
    
    document.getElementById('todayCalories').textContent = todayTotals.calories;
    document.getElementById('calorieGoal').textContent = dailyGoal;
    document.getElementById('todayProtein').textContent = todayTotals.protein.toFixed(0) + 'g';
    document.getElementById('proteinGoal').textContent = proteinGoal + 'g';
}

// Modal Functions
let editingMealIndex = null;

function openAddMealModal() {
    editingMealIndex = null;
    document.getElementById('addMealModal').classList.add('active');
    document.getElementById('addMealForm').reset();
    document.querySelector('#addMealModal .modal-header h3').textContent = 'Add Meal';
    document.querySelector('#addMealForm button[type="submit"]').textContent = 'Add Meal';
}

function closeAddMealModal() {
    document.getElementById('addMealModal').classList.remove('active');
    editingMealIndex = null;
}

function openSetGoalModal() {
    document.getElementById('setGoalModal').classList.add('active');
    document.getElementById('dailyGoal').value = dailyGoal;
    document.getElementById('proteinGoalInput').value = proteinGoal;
}

function closeSetGoalModal() {
    document.getElementById('setGoalModal').classList.remove('active');
}

// Form Handlers
function handleAddMeal(e) {
    e.preventDefault();
    
    const meal = {
        type: document.getElementById('mealType').value,
        name: document.getElementById('foodName').value,
        servingSize: document.getElementById('servingSize').value,
        calories: parseInt(document.getElementById('calories').value),
        protein: parseFloat(document.getElementById('protein').value),
        carbs: parseFloat(document.getElementById('carbs').value),
        fat: parseFloat(document.getElementById('fat').value),
        notes: document.getElementById('notes').value,
        timestamp: new Date().toISOString()
    };
    
    const dateStr = formatDate(selectedDate);
    if (!nutritionData[dateStr]) {
        nutritionData[dateStr] = { meals: [] };
    }
    
    if (editingMealIndex !== null) {
        // Update existing meal
        nutritionData[dateStr].meals[editingMealIndex] = meal;
        editingMealIndex = null;
    } else {
        // Add new meal
        nutritionData[dateStr].meals.push(meal);
    }
    
    saveData();
    
    closeAddMealModal();
    updateDailyLog();
    initializeCalendar();
}

function handleSetGoal(e) {
    e.preventDefault();
    
    dailyGoal = parseInt(document.getElementById('dailyGoal').value);
    proteinGoal = parseInt(document.getElementById('proteinGoalInput').value);
    localStorage.setItem('dailyGoal', dailyGoal);
    localStorage.setItem('proteinGoal', proteinGoal);
    
    closeSetGoalModal();
    updateGoalDisplay();
    updateDailyLog();
}

function editMeal(index) {
    const dateStr = formatDate(selectedDate);
    const meal = nutritionData[dateStr].meals[index];
    
    editingMealIndex = index;
    
    // Populate form with meal data
    document.getElementById('mealType').value = meal.type;
    document.getElementById('foodName').value = meal.name;
    document.getElementById('servingSize').value = meal.servingSize;
    document.getElementById('calories').value = meal.calories;
    document.getElementById('protein').value = meal.protein;
    document.getElementById('carbs').value = meal.carbs;
    document.getElementById('fat').value = meal.fat;
    document.getElementById('notes').value = meal.notes || '';
    
    // Update modal title and button text
    document.querySelector('#addMealModal .modal-header h3').textContent = 'Edit Meal';
    document.querySelector('#addMealForm button[type="submit"]').textContent = 'Update Meal';
    
    // Open modal
    document.getElementById('addMealModal').classList.add('active');
}

function deleteMeal(index) {
    if (confirm('Are you sure you want to delete this meal?')) {
        const dateStr = formatDate(selectedDate);
        nutritionData[dateStr].meals.splice(index, 1);
        
        if (nutritionData[dateStr].meals.length === 0) {
            delete nutritionData[dateStr];
        }
        
        saveData();
        updateDailyLog();
        initializeCalendar();
    }
}

// Quick Actions
function viewHistory() {
    const totalDays = Object.keys(nutritionData).length;
    const totalMeals = Object.values(nutritionData).reduce((sum, day) => sum + (day.meals ? day.meals.length : 0), 0);
    
    let totalCalories = 0;
    Object.values(nutritionData).forEach(day => {
        if (day.meals) {
            totalCalories += calculateDayTotal(day.meals).calories;
        }
    });
    
    const avgCalories = totalDays > 0 ? Math.round(totalCalories / totalDays) : 0;
    
    alert(`📊 Your Nutrition History\n\n` +
          `Days Tracked: ${totalDays}\n` +
          `Total Meals: ${totalMeals}\n` +
          `Average Daily Calories: ${avgCalories} kcal\n` +
          `Total Calories Tracked: ${totalCalories.toLocaleString()} kcal`);
}

function exportData() {
    const dataStr = JSON.stringify(nutritionData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `nutrition-data-${formatDate(new Date())}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    alert('✅ Your nutrition data has been exported successfully!');
}

// Utility Functions
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function calculateDayTotal(meals) {
    return meals.reduce((totals, meal) => {
        totals.calories += meal.calories;
        totals.protein += meal.protein;
        totals.carbs += meal.carbs;
        totals.fat += meal.fat;
        return totals;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
}

function getMealTypeIcon(type) {
    const icons = {
        breakfast: '🌅',
        lunch: '☀️',
        dinner: '🌙',
        snack: '🍎'
    };
    return icons[type] || '🍽️';
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function saveData() {
    localStorage.setItem('nutritionData', JSON.stringify(nutritionData));
}

function updateGoalDisplay() {
    document.getElementById('calorieGoal').textContent = dailyGoal;
    document.getElementById('proteinGoal').textContent = proteinGoal + 'g';
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Press 'A' to add meal
    if (e.key === 'a' && !e.ctrlKey && !e.metaKey && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        openAddMealModal();
    }
    
    // Press 'Escape' to close modals
    if (e.key === 'Escape') {
        closeAddMealModal();
        closeSetGoalModal();
    }
});

// Console message
console.log('%c🥗 NutriTrack - Calorie & Nutrition Tracker', 'color: #10b981; font-size: 20px; font-weight: bold;');
console.log('%cTrack your nutrition, achieve your goals!', 'color: #6b7280; font-size: 14px;');
console.log('%cKeyboard shortcuts: Press "A" to add a meal', 'color: #6b7280; font-size: 12px;');