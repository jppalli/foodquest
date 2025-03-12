import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';

// Helper functions
const getInitialData = (key, defaultValue) => {
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : defaultValue;
};

const generateDailyQuests = () => [
  { id: 1, text: 'Log 3 meals', target: 3, progress: 0, reward: 50 },
  { id: 2, text: 'Eat 2 fruits', target: 2, progress: 0, reward: 30 },
  { id: 3, text: 'Drink 8 waters', target: 8, progress: 0, reward: 40 }
];

const generateWeeklyChallenges = () => [
  { id: 1, text: 'Log 15 meals', target: 15, progress: 0, reward: 200 },
  { id: 2, text: 'Exercise 5 times', target: 5, progress: 0, reward: 150 }
];

// Main App Component
const App = () => {
  const [foods, setFoods] = useState(getInitialData('foods', []));
  const [points, setPoints] = useState(getInitialData('points', 0));
  const [level, setLevel] = useState(getInitialData('level', 1));
  const [streak, setStreak] = useState(getInitialData('streak', 0));
  const [lastLoggedDate, setLastLoggedDate] = useState(getInitialData('lastLoggedDate', null));
  const [dailyQuests, setDailyQuests] = useState(getInitialData('dailyQuests', generateDailyQuests()));
  const [weeklyChallenges, setWeeklyChallenges] = useState(getInitialData('weeklyChallenges', generateWeeklyChallenges()));
  const [badges, setBadges] = useState(getInitialData('badges', []));
  const [showShop, setShowShop] = useState(false);
  const [notification, setNotification] = useState(null);

  const achievements = [
    { id: 1, name: "First Meal", target: 1, progress: 0, reward: 100, type: 'totalMeals' },
    { id: 2, name: "Hydration Master", target: 100, progress: 0, reward: 500, type: 'totalWater' },
    { id: 3, name: "Fruit Ninja", target: 50, progress: 0, reward: 300, type: 'totalFruits' }
  ];

  const shopItems = [
    { id: 1, name: 'Custom Avatar', cost: 500 },
    { id: 2, name: 'Special Theme', cost: 300 },
    { id: 3, name: 'Animated Badge', cost: 700 }
  ];

  useEffect(() => {
    const saveData = {
      foods, points, level, streak, lastLoggedDate,
      dailyQuests, weeklyChallenges, badges
    };
    Object.entries(saveData).forEach(([key, value]) => {
      localStorage.setItem(key, JSON.stringify(value));
    });
  }, [foods, points, level, streak, lastLoggedDate, dailyQuests, weeklyChallenges, badges]);

  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  const updateStreak = () => {
    const today = new Date().toISOString().split('T')[0];
    if (!lastLoggedDate) {
      setStreak(1);
      setLastLoggedDate(today);
      showNotification('🔥 New streak started!');
      return 10;
    }

    const daysDifference = Math.floor((new Date(today) - new Date(lastLoggedDate)) / 86400000);
    
    if (daysDifference === 0) return 0;
    
    if (daysDifference === 1) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      setLastLoggedDate(today);
      
      if (newStreak % 7 === 0) {
        addBadge(`${newStreak} Day Streak!`);
        showNotification(`🎉 ${newStreak} day streak!`);
        return 50;
      }
      if (newStreak % 30 === 0) {
        addBadge(`${newStreak} Day Streak Master!`);
        return 200;
      }
      return 10 + Math.floor(newStreak / 2) * 5;
    }
    
    setStreak(1);
    setLastLoggedDate(today);
    showNotification('🔥 New streak started!');
    return 10;
  };

  const addBadge = (name) => {
    if (!badges.includes(name)) {
      setBadges([...badges, name]);
      showNotification(`🏆 New badge earned: ${name}`);
    }
  };

  const checkLevelUp = (newPoints) => {
    const newLevel = Math.floor(newPoints / 100) + 1;
    if (newLevel > level) {
      setLevel(newLevel);
      addBadge(`Level ${newLevel} Achieved!`);
    }
  };

  const updateQuests = (category) => {
    setDailyQuests(prevQuests => prevQuests.map(quest => {
      let newProgress = quest.progress;
      if (quest.id === 1) newProgress += 1;
      if (quest.id === 2 && category === 'fruit') newProgress += 1;
      if (quest.id === 3 && category === 'water') newProgress += 1;

      if (newProgress === quest.target) {
        setPoints(p => {
          const newPoints = p + quest.reward;
          checkLevelUp(newPoints);
          return newPoints;
        });
        if (quest.id === 1) addBadge("Meal Master");
        if (quest.id === 2) addBadge("Fruit Lover");
        if (quest.id === 3) addBadge("Hydration Hero");
      }

      return { ...quest, progress: newProgress };
    }));
  };

  const updateAchievements = () => {
    const totalMeals = foods.filter(f => f.category === 'meal').length;
    const totalWater = foods.filter(f => f.category === 'water').length;
    const totalFruits = foods.filter(f => f.category === 'fruit').length;

    achievements.forEach(ach => {
      let progress;
      switch(ach.type) {
        case 'totalMeals': progress = totalMeals; break;
        case 'totalWater': progress = totalWater; break;
        case 'totalFruits': progress = totalFruits; break;
        default: progress = 0;
      }
      
      if (progress >= ach.target && !badges.includes(ach.name)) {
        addBadge(ach.name);
        setPoints(p => p + ach.reward);
      }
    });
  };

  const addFood = (event) => {
    event.preventDefault();
    const category = event.target.category.value;
    const newFood = {
      id: Date.now(),
      name: event.target.food.value,
      category,
      timestamp: new Date().toISOString()
    };

    setFoods([...foods, newFood]);
    const streakPoints = updateStreak();
    const basePoints = category === 'water' ? 5 : 10;
    setPoints(p => {
      const newPoints = p + basePoints + streakPoints;
      checkLevelUp(newPoints);
      return newPoints;
    });

    updateQuests(category);
    updateAchievements();
    event.target.reset();
  };

  const purchaseItem = (item) => {
    if (points >= item.cost) {
      setPoints(p => p - item.cost);
      addBadge(item.name);
      showNotification(`🎉 Purchased ${item.name}!`);
    } else {
      showNotification('❌ Not enough points!');
    }
  };

  // Sub-components
  const MobileWrapper = ({ children }) => (
    <div style={{
      maxWidth: '100%',
      minHeight: '100vh',
      margin: '0 auto',
      padding: '1rem',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f5f5f5'
    }}>
      {children}
    </div>
  );

  const Header = () => (
    <header style={{ 
      backgroundColor: '#4CAF50',
      color: 'white',
      padding: '1rem',
      borderRadius: '1rem',
      marginBottom: '2rem'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{ margin: 0 }}>🍎 FoodQuest</h1>
        <button 
          onClick={() => setShowShop(true)}
          style={{
            backgroundColor: '#FFD700',
            color: 'black',
            padding: '0.5rem 1rem',
            borderRadius: '0.5rem',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Shop ({points} points)
        </button>
      </div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-around',
        marginTop: '1rem'
      }}>
        <div>Level {level}</div>
        <div>🔥 {streak} Day Streak</div>
      </div>
    </header>
  );

  const Shop = () => (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '1rem',
        maxWidth: '90%'
      }}>
        <h2>🎁 Reward Shop</h2>
        {shopItems.map(item => (
          <div key={item.id} style={{ 
            margin: '1rem 0',
            padding: '1rem',
            border: '1px solid #ddd',
            borderRadius: '0.5rem'
          }}>
            <h3 style={{ margin: '0 0 0.5rem 0' }}>{item.name}</h3>
            <button 
              onClick={() => purchaseItem(item)}
              style={{ 
                padding: '0.5rem 1rem',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '0.25rem',
                cursor: 'pointer'
              }}
            >
              Buy ({item.cost} points)
            </button>
          </div>
        ))}
        <button 
          onClick={() => setShowShop(false)}
          style={{
            marginTop: '1rem',
            padding: '0.5rem 1rem',
            backgroundColor: '#ff4444',
            color: 'white',
            border: 'none',
            borderRadius: '0.25rem',
            cursor: 'pointer'
          }}
        >
          Close
        </button>
      </div>
    </div>
  );

  const QuestSection = () => (
    <section style={{
      backgroundColor: 'white',
      padding: '1.5rem',
      borderRadius: '1rem',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <h2 style={{ marginTop: 0 }}>Quests & Challenges</h2>
      
      <h3>Daily Quests</h3>
      {dailyQuests.map(quest => (
        <div key={quest.id} style={{
          margin: '1rem 0',
          padding: '1rem',
          backgroundColor: '#f8f9fa',
          borderRadius: '0.5rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>{quest.text}</span>
            <span>{quest.progress}/{quest.target}</span>
          </div>
          <div style={{
            height: '5px',
            backgroundColor: '#e9ecef',
            borderRadius: '2.5px',
            marginTop: '0.5rem'
          }}>
            <div style={{
              width: `${(quest.progress / quest.target) * 100}%`,
              height: '100%',
              backgroundColor: '#4CAF50',
              borderRadius: '2.5px'
            }} />
          </div>
        </div>
      ))}

      <h3>Weekly Challenges</h3>
      {weeklyChallenges.map(challenge => (
        <div key={challenge.id} style={{
          margin: '1rem 0',
          padding: '1rem',
          backgroundColor: '#f8f9fa',
          borderRadius: '0.5rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>{challenge.text}</span>
            <span>{challenge.progress}/{challenge.target}</span>
          </div>
          <div style={{
            height: '5px',
            backgroundColor: '#e9ecef',
            borderRadius: '2.5px',
            marginTop: '0.5rem'
          }}>
            <div style={{
              width: `${(challenge.progress / challenge.target) * 100}%`,
              height: '100%',
              backgroundColor: '#2196F3',
              borderRadius: '2.5px'
            }} />
          </div>
        </div>
      ))}
    </section>
  );

  const FoodLogSection = ({ addFood }) => (
    <section style={{
      backgroundColor: 'white',
      padding: '1.5rem',
      borderRadius: '1rem',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <h2 style={{ marginTop: 0 }}>Log Your Food</h2>
      <form onSubmit={addFood} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <input
          type="text"
          name="food"
          placeholder="What did you eat?"
          required
          style={{
            padding: '0.8rem',
            border: '1px solid #ddd',
            borderRadius: '0.5rem'
          }}
        />
        <select 
          name="category" 
          required 
          style={{
            padding: '0.8rem',
            border: '1px solid #ddd',
            borderRadius: '0.5rem'
          }}
        >
          <option value="meal">Meal</option>
          <option value="fruit">Fruit</option>
          <option value="vegetable">Vegetable</option>
          <option value="water">Water</option>
          <option value="snack">Snack</option>
        </select>
        <button 
          type="submit"
          style={{
            backgroundColor: '#4CAF50',
            color: 'white',
            padding: '1rem',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer'
          }}
        >
          Add Entry
        </button>
      </form>
    </section>
  );

  const BadgeSection = () => (
    <section style={{
      backgroundColor: 'white',
      padding: '1.5rem',
      borderRadius: '1rem',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      marginTop: '2rem'
    }}>
      <h2 style={{ marginTop: 0 }}>Your Badges ({badges.length})</h2>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
        gap: '1rem'
      }}>
        {badges.map((badge, index) => (
          <div key={index} style={{
            backgroundColor: '#FFD700',
            padding: '1rem',
            borderRadius: '0.5rem',
            textAlign: 'center',
            fontSize: '0.9rem'
          }}>
            {badge}
          </div>
        ))}
      </div>
    </section>
  );

  return (
    <MobileWrapper>
      <Header />
      
      {showShop && <Shop />}

      {notification && (
        <div style={{
          position: 'fixed',
          bottom: '1rem',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#4CAF50',
          color: 'white',
          padding: '1rem',
          borderRadius: '0.5rem',
          zIndex: 1000
        }}>
          {notification}
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '2rem'
      }}>
        <QuestSection />
        <FoodLogSection addFood={addFood} />
      </div>

      <BadgeSection />
    </MobileWrapper>
  );
};

const container = document.getElementById('renderDiv');
const root = ReactDOM.createRoot(container);
root.render(<App />);
