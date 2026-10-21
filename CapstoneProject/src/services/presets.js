/**
 * Preset templates matching Section 2 ("Who is affected") of the Decision Duel Problem Statement:
 * - Friends: Where to eat, which film to watch
 * - Families: Weekend outing, dinner order
 * - Roommates: Takeaway, shared purchases
 * - Colleagues & classmates: Team lunch, outing venue
 */

export const DECISION_PRESETS = [
  {
    id: 'friends_eat',
    group: 'Friends',
    title: 'Where should we eat tonight?',
    icon: '🍕',
    description: '8 popular dinner spots — stop saying "anything is fine"!',
    options: [
      { label: 'Woodfire Neapolitan Pizza', emoji: '🍕', price_tag: '$$', is_veg: true, duration_tag: 'Quick' },
      { label: 'Spicy Korean Fried Chicken', emoji: '🍗', price_tag: '$$', is_veg: false, duration_tag: 'Relaxed' },
      { label: 'Authentic Masala Dosa & Filter Coffee', emoji: '🥞', price_tag: '$', is_veg: true, duration_tag: 'Quick' },
      { label: 'Street Style Tacos & Nachos', emoji: '🌮', price_tag: '$', is_veg: true, duration_tag: 'Quick' },
      { label: 'Ramen & Gyoza Noodle Bar', emoji: '🍜', price_tag: '$$', is_veg: false, duration_tag: 'Relaxed' },
      { label: 'Royal Hyderabadi Biryani House', emoji: '🍲', price_tag: '$$', is_veg: false, duration_tag: 'Relaxed' },
      { label: 'Gourmet Smash Burgers & Shakes', emoji: '🍔', price_tag: '$$', is_veg: true, duration_tag: 'Quick' },
      { label: 'Mediterranean Falafel & Mezze Platter', emoji: '🥙', price_tag: '$$', is_veg: true, duration_tag: 'Quick' },
    ],
  },
  {
    id: 'friends_movie',
    group: 'Friends',
    title: 'Which film should we watch?',
    icon: '🎬',
    description: '8 crowd-pleasing movie night picks across genres',
    options: [
      { label: 'Dune: Part Two (Sci-Fi Epic)', emoji: '🏜️', price_tag: '$', is_veg: true, duration_tag: 'Relaxed' },
      { label: 'Spider-Man: Across the Spider-Verse', emoji: '🕷️', price_tag: '$', is_veg: true, duration_tag: 'Quick' },
      { label: 'Knives Out (Mystery Whodunit)', emoji: '🔍', price_tag: '$', is_veg: true, duration_tag: 'Quick' },
      { label: 'Interstellar (Space Odyssey)', emoji: '🚀', price_tag: '$', is_veg: true, duration_tag: 'Relaxed' },
      { label: 'Everything Everywhere All at Once', emoji: '🥯', price_tag: '$', is_veg: true, duration_tag: 'Quick' },
      { label: 'The Grand Budapest Hotel (Comedy)', emoji: '🏨', price_tag: '$', is_veg: true, duration_tag: 'Quick' },
      { label: 'Mad Max: Fury Road (Action)', emoji: '🔥', price_tag: '$', is_veg: true, duration_tag: 'Quick' },
      { label: '3 Idiots (Feel-Good Classic)', emoji: '🎓', price_tag: '$', is_veg: true, duration_tag: 'Relaxed' },
    ],
  },
  {
    id: 'family_weekend',
    group: 'Families',
    title: 'Weekend Family Outing',
    icon: '🎡',
    description: 'Give quiet family members an equal say on the weekend plan',
    options: [
      { label: 'Botanical Garden & Picnic', emoji: '🌿', price_tag: '$', is_veg: true, duration_tag: 'Relaxed' },
      { label: 'Science & Planetarium Show', emoji: '🔭', price_tag: '$', is_veg: true, duration_tag: 'Quick' },
      { label: 'Bowling Alley & Arcade Games', emoji: '🎳', price_tag: '$$', is_veg: true, duration_tag: 'Quick' },
      { label: 'Lakeside Boating & Sunset Walk', emoji: '🚣', price_tag: '$', is_veg: true, duration_tag: 'Relaxed' },
      { label: 'Family Thali Dinner Outing', emoji: '🍛', price_tag: '$$', is_veg: true, duration_tag: 'Quick' },
      { label: 'Pottery & Art Workshop', emoji: '🎨', price_tag: '$$', is_veg: true, duration_tag: 'Relaxed' },
    ],
  },
  {
    id: 'colleagues_lunch',
    group: 'Colleagues & Classmates',
    title: 'Team Lunch & Outing Venue',
    icon: '🍱',
    description: 'Skip the 100-message thread and settle team lunch in 2 minutes',
    options: [
      { label: 'Pan-Asian Dim Sum & Sushi Buffet', emoji: '🥟', price_tag: '$$$', is_veg: true, duration_tag: 'Relaxed' },
      { label: 'North Indian Tandoori & Naan Dhaba', emoji: '🫓', price_tag: '$$', is_veg: true, duration_tag: 'Quick' },
      { label: 'Artisanal Cafe — Paninis & Iced Latte', emoji: '☕', price_tag: '$$', is_veg: true, duration_tag: 'Quick' },
      { label: 'Woodfired Pizzeria & Garlic Breads', emoji: '🍕', price_tag: '$$', is_veg: true, duration_tag: 'Quick' },
      { label: 'South Indian Banana Leaf Feast', emoji: '🍃', price_tag: '$', is_veg: true, duration_tag: 'Quick' },
      { label: 'Mexican Burrito Bowl Bar', emoji: '🌯', price_tag: '$$', is_veg: true, duration_tag: 'Quick' },
      { label: 'Rooftop Barbecue Grill Buffet', emoji: '🔥', price_tag: '$$$', is_veg: true, duration_tag: 'Relaxed' },
      { label: 'Healthy Salad & Smoothie Bowls', emoji: '🥗', price_tag: '$$', is_veg: true, duration_tag: 'Quick' },
    ],
  },
];
