const FOOD_DB = {
  breakfast: {
    low_cal: [
      { name: "Oatmeal with Berries", cal: 220, protein: 7, carbs: 38, fat: 4, prep: 5, emoji: "🥣", ingredients: ["80g oats", "mixed berries", "250ml water or milk", "honey (optional)"], steps: ["Bring 250ml of water or milk to a boil in a small saucepan over medium-high heat.", "Add 80g of oats, reduce heat to medium-low, and stir occasionally for 3-5 minutes until creamy and thick.", "Transfer to a bowl and top with a generous handful of fresh mixed berries. Drizzle with honey if desired."] },
      { name: "Greek Yogurt with Honey", cal: 180, protein: 15, carbs: 20, fat: 5, prep: 2, emoji: "🍯", ingredients: ["200g Greek yogurt", "1 tbsp honey", "walnuts (optional)"], steps: ["Scoop 200g of Greek yogurt into a bowl.", "Drizzle one tablespoon of honey evenly over the surface.", "Sprinkle with finely chopped walnuts for crunch and extra healthy fats. Serve immediately."] },
      { name: "Egg White Omelette with Spinach", cal: 160, protein: 18, carbs: 3, fat: 7, prep: 8, emoji: "🍳", ingredients: ["4 egg whites", "handful fresh spinach", "salt", "pepper", "olive oil spray"], steps: ["Heat a non-stick pan over medium heat and spray lightly with olive oil. Whisk 4 egg whites in a bowl.", "Pour the egg whites into the pan and cook for 1-2 minutes until the edges begin to set.", "Add a handful of fresh spinach to one half, fold the omelette over, and cook 1-2 more minutes. Season with salt and pepper."] },
      { name: "Avocado Toast", cal: 240, protein: 6, carbs: 28, fat: 12, prep: 5, emoji: "🥑", ingredients: ["1 slice whole-grain bread", "half avocado", "squeeze of lemon juice", "pinch of salt", "red pepper flakes"], steps: ["Toast a slice of whole-grain bread until golden and crisp.", "Mash half an avocado in a small bowl with a squeeze of lemon juice and a pinch of salt.", "Spread the mashed avocado onto the toast, sprinkle with red pepper flakes, and serve immediately."] },
      { name: "Green Smoothie", cal: 250, protein: 20, carbs: 35, fat: 4, prep: 5, emoji: "🥤", ingredients: ["1 banana", "handful spinach", "1 scoop protein powder", "250ml almond milk", "ice cubes"], steps: ["Add one banana, a generous handful of spinach, and one scoop of protein powder to a blender.", "Pour in 250ml of almond milk and add a few ice cubes.", "Blend on high speed for 30-60 seconds until completely smooth. Pour into a glass and enjoy immediately."] },
    ],
    high_cal: [
      { name: "Oatmeal with Banana & Peanut Butter", cal: 420, protein: 14, carbs: 58, fat: 16, prep: 5, emoji: "🥜", ingredients: ["80g oats", "1 banana", "1 tbsp peanut butter", "250ml milk", "pinch of cinnamon"], steps: ["Cook 80g of oats in 250ml milk over medium-low heat for 3-5 minutes, stirring occasionally.", "Slice one banana into rounds and arrange over the oatmeal.", "Add a generous tablespoon of peanut butter and sprinkle with cinnamon. Stir if desired."] },
      { name: "Scrambled Eggs on Toast", cal: 400, protein: 22, carbs: 30, fat: 22, prep: 8, emoji: "🍳", ingredients: ["3 eggs", "knob of butter", "2 slices bread", "salt", "pepper"], steps: ["Whisk 3 eggs in a bowl with salt and pepper. Melt a knob of butter in a pan over medium-low heat.", "Pour in the eggs and slowly stir with a wooden spoon until softly set and creamy.", "Toast 2 slices of bread and serve the scrambled eggs on top. Add pepper to taste."] },
      { name: "Protein Pancakes", cal: 450, protein: 25, carbs: 55, fat: 12, prep: 12, emoji: "🥞", ingredients: ["1 scoop protein powder", "40g oats", "1 egg", "1 banana", "maple syrup"], steps: ["Blend 30g protein powder, 40g oats, 1 egg, and 1 banana in a blender until smooth.", "Heat a pan over medium heat with a little oil. Pour small rounds and cook 2-3 minutes each side until golden.", "Stack the pancakes and drizzle with maple syrup. Add fresh fruit if desired."] },
      { name: "Granola Bowl with Fruit", cal: 380, protein: 10, carbs: 55, fat: 14, prep: 3, emoji: "🥣", ingredients: ["60g granola", "150ml milk", "1 banana", "handful of berries"], steps: ["Pour 60g of granola into a deep bowl.", "Add 150ml of cold milk.", "Slice the banana, add fresh berries, and eat immediately while the granola is still crunchy."] },
      { name: "Bagel with Cream Cheese & Salmon", cal: 440, protein: 20, carbs: 42, fat: 18, prep: 5, emoji: "🥯", ingredients: ["1 bagel", "2 tbsp cream cheese", "50g smoked salmon", "1 tsp capers"], steps: ["Slice the bagel in half and lightly toast both sides.", "Spread cream cheese evenly on each half.", "Layer smoked salmon slices over the cheese and garnish with capers. Serve immediately."] },
    ],
    balanced: [
      { name: "Peanut Butter Toast", cal: 300, protein: 10, carbs: 32, fat: 14, prep: 3, emoji: "🍞", ingredients: ["1 slice whole-grain bread", "2 tbsp peanut butter", "half banana, sliced"], steps: ["Toast a slice of whole-grain bread until golden.", "Spread a thick layer of peanut butter evenly over the toast.", "Arrange banana slices on top and serve."] },
      { name: "Oatmeal with Milk & Banana", cal: 320, protein: 10, carbs: 50, fat: 8, prep: 5, emoji: "🥣", ingredients: ["80g oats", "250ml milk", "1 banana", "1 tbsp honey"], steps: ["Cook 80g of oats in 250ml of milk for 3-5 minutes, stirring occasionally.", "Slice one banana into rounds and arrange over the oatmeal.", "Drizzle with a tablespoon of honey and eat warm."] },
      { name: "Two Eggs with Whole-Wheat Toast", cal: 310, protein: 18, carbs: 24, fat: 16, prep: 8, emoji: "🍳", ingredients: ["2 eggs", "2 slices whole-wheat bread", "knob of butter", "pinch of salt"], steps: ["Prepare eggs to your liking — fried, scrambled, or boiled. Season with salt.", "Toast 2 slices of whole-wheat bread and spread lightly with butter.", "Serve the eggs alongside the toast on a plate."] },
      { name: "Yogurt Parfait with Granola", cal: 290, protein: 12, carbs: 38, fat: 10, prep: 3, emoji: "🍨", ingredients: ["150g yogurt", "40g granola", "mixed berries", "1 tbsp honey"], steps: ["In a glass or bowl, add a layer of yogurt, then a layer of granola, then a layer of berries.", "Repeat the layers until the container is full.", "Drizzle honey on top and serve immediately."] },
      { name: "Fruit Smoothie with Oats", cal: 280, protein: 8, carbs: 48, fat: 6, prep: 5, emoji: "🥤", ingredients: ["1 banana", "handful of berries", "30g oats", "200ml milk", "1 tbsp honey"], steps: ["Add one banana, a handful of berries, and 30g of oats to a blender.", "Pour in 200ml of milk and a tablespoon of honey.", "Blend for 30-60 seconds until smooth and drink immediately."] },
    ],
  },
  lunch: {
    low_cal: [
      { name: "Grilled Chicken Salad", cal: 320, protein: 38, carbs: 12, fat: 10, prep: 15, emoji: "🥗", ingredients: ["150g chicken breast", "mixed greens", "1 tomato", "half cucumber", "1 tbsp olive oil", "juice of half lemon"], steps: ["Season chicken breast with salt and pepper. Grill or pan-fry 6-7 minutes per side until fully cooked through.", "Slice the tomato into wedges and cucumber into rounds. Arrange a bed of mixed greens on a plate.", "Slice the chicken into strips and place on the salad. Drizzle with olive oil and fresh lemon juice."] },
      { name: "Turkey Wrap", cal: 350, protein: 28, carbs: 35, fat: 10, prep: 8, emoji: "🌯", ingredients: ["1 whole-wheat tortilla", "100g turkey slices", "lettuce leaves", "1 tomato", "1 tsp mustard"], steps: ["Lay the tortilla flat on a clean surface.", "Layer turkey slices, lettuce leaves, and tomato slices. Spread mustard as desired.", "Roll the tortilla tightly from one end to the other and slice diagonally."] },
      { name: "Tuna Salad", cal: 300, protein: 32, carbs: 8, fat: 14, prep: 10, emoji: "🐟", ingredients: ["1 can tuna (drained)", "mixed greens", "1 tbsp olive oil", "juice of half lemon", "quarter red onion"], steps: ["Drain the can of tuna thoroughly and break apart with a fork in a bowl.", "Thinly slice the red onion into rings and toss together with mixed greens.", "Add the tuna on top, drizzle with olive oil and fresh lemon juice. Season with salt and pepper."] },
      { name: "Lentil Soup", cal: 340, protein: 18, carbs: 48, fat: 6, prep: 20, emoji: "🍲", ingredients: ["200g lentils", "1 carrot", "2 celery stalks", "1 onion", "2 garlic cloves", "500ml vegetable broth"], steps: ["Finely dice the onion, carrot, and celery. Sauté in olive oil for 3-4 minutes until softened.", "Add 200g of lentils, crushed garlic, and 500ml of vegetable broth. Season with salt.", "Simmer on low heat for 15-20 minutes until lentils are tender. Adjust seasoning and serve warm."] },
      { name: "Grilled Fish with Broccoli", cal: 310, protein: 35, carbs: 15, fat: 10, prep: 15, emoji: "🐠", ingredients: ["150g white fish fillet", "200g broccoli", "1 tbsp olive oil", "juice of half lemon", "1 garlic clove"], steps: ["Season the fish fillet with lemon juice, crushed garlic, salt, and pepper.", "Grill or pan-fry the fish for 4 minutes per side until white and flaky.", "Steam broccoli florets for 3-4 minutes until al dente. Serve alongside the fish with a drizzle of olive oil."] },
    ],
    high_cal: [
      { name: "Chicken Rice Bowl", cal: 550, protein: 42, carbs: 60, fat: 12, prep: 20, emoji: "🍗", ingredients: ["150g chicken breast", "150g rice", "mixed vegetables", "1 tbsp soy sauce", "1 tsp sesame oil"], steps: ["Cook rice according to package instructions. Let it sit covered to fluff.", "Grill chicken breast 6-7 minutes per side until golden and cooked through. Slice into strips.", "Assemble the bowl: rice on the bottom, chicken and vegetables on top. Drizzle with soy sauce and sesame oil."] },
      { name: "Steak with Mashed Potatoes", cal: 620, protein: 40, carbs: 45, fat: 28, prep: 25, emoji: "🥩", ingredients: ["200g beef steak", "400g potatoes", "1 tbsp butter", "splash of milk", "salt", "pepper"], steps: ["Peel and chop 400g of potatoes. Boil in salted water for 15-20 minutes until soft.", "Drain and mash with butter and a splash of milk until creamy. Season with salt and pepper.", "Season the steak and sear on high heat 3-4 minutes per side (for medium). Rest for 5 minutes before slicing."] },
      { name: "Pasta with Meat Sauce", cal: 580, protein: 30, carbs: 70, fat: 16, prep: 20, emoji: "🍝", ingredients: ["150g pasta", "200g ground beef", "200ml tomato sauce", "1 onion", "2 garlic cloves", "grated parmesan"], steps: ["Cook pasta al dente according to package instructions. Drain and reserve some pasta water.", "Sauté diced onion and crushed garlic in olive oil for 2 minutes. Add 200g ground beef and cook until browned.", "Stir in tomato sauce and simmer for 10 minutes on low heat. Toss with pasta and top with grated parmesan."] },
      { name: "Salmon Quinoa Bowl", cal: 560, protein: 38, carbs: 42, fat: 24, prep: 20, emoji: "🍣", ingredients: ["150g salmon fillet", "100g quinoa", "half avocado", "half cucumber", "1 tbsp soy sauce"], steps: ["Rinse quinoa and cook in double the amount of water for 15 minutes until all liquid is absorbed.", "Pan-sear salmon fillet skin-side down for 4 minutes, flip and cook 3 more minutes.", "Assemble the bowl: quinoa base, sliced avocado, diced cucumber, and the salmon on top. Drizzle with soy sauce."] },
      { name: "Burrito Bowl", cal: 600, protein: 32, carbs: 65, fat: 20, prep: 15, emoji: "🌮", ingredients: ["150g rice", "100g black beans", "150g chicken breast", "grated cheese", "salsa", "1 tbsp sour cream"], steps: ["Cook rice and drain a can of black beans. Heat the beans in a small pot.", "Grill chicken breast on a pan or grill, then dice into cubes.", "Layer in a bowl: rice, beans, chicken, grated cheese, salsa, and a dollop of sour cream."] },
    ],
    balanced: [
      { name: "Chicken with Brown Rice", cal: 420, protein: 38, carbs: 45, fat: 8, prep: 18, emoji: "🍗", ingredients: ["150g chicken breast", "150g brown rice", "mixed vegetables", "1 tbsp olive oil"], steps: ["Cook brown rice according to instructions (usually 20-25 minutes). Let sit covered for 5 minutes.", "Season and pan-fry chicken breast 6-7 minutes per side until golden.", "Sauté mixed vegetables in a little olive oil for 3-4 minutes. Serve chicken alongside rice and vegetables."] },
      { name: "Salmon with Vegetables", cal: 400, protein: 34, carbs: 20, fat: 18, prep: 15, emoji: "🐟", ingredients: ["150g salmon fillet", "mixed vegetables", "1 tbsp olive oil", "juice of half lemon", "fresh herbs"], steps: ["Preheat oven to 200°C. Season salmon with fresh herbs, salt, pepper, and lemon juice.", "Bake salmon for 12-15 minutes until it flakes easily with a fork.", "Toss vegetables with olive oil and roast alongside the salmon. Serve together."] },
      { name: "Chicken Wrap", cal: 380, protein: 30, carbs: 35, fat: 12, prep: 10, emoji: "🌯", ingredients: ["1 tortilla", "120g grilled chicken", "lettuce leaves", "1 tomato", "2 tbsp yogurt sauce"], steps: ["Slice the grilled chicken into thin strips.", "Layer chicken, lettuce leaves, and tomato slices onto the tortilla.", "Add a spoonful of yogurt sauce, roll the wrap tightly, and serve."] },
      { name: "Tofu Noodle Stir-Fry", cal: 390, protein: 20, carbs: 48, fat: 12, prep: 15, emoji: "🍜", ingredients: ["200g tofu", "100g noodles", "1 bell pepper", "100g broccoli", "2 tbsp soy sauce", "1 tsp fresh ginger"], steps: ["Drain tofu and press out excess moisture. Cut into cubes. Cook noodles according to package instructions.", "Fry tofu in hot oil for 3-4 minutes until golden on all sides. Set aside.", "In the same pan, stir-fry sliced bell pepper and broccoli for 3 minutes. Add noodles, tofu, soy sauce, and grated ginger. Toss for 2 minutes."] },
      { name: "Quinoa Chicken Bowl", cal: 430, protein: 35, carbs: 42, fat: 12, prep: 15, emoji: "🥙", ingredients: ["100g quinoa", "150g chicken breast", "100g canned chickpeas", "half cucumber", "2 tbsp tahini"], steps: ["Cook quinoa for 15 minutes. Drain chickpeas from can.", "Grill chicken breast 6-7 minutes per side, then slice into strips.", "Assemble the bowl: quinoa, chicken, chickpeas, and diced cucumber. Drizzle with tahini dressing."] },
    ],
  },
  dinner: {
    low_cal: [
      { name: "Baked Salmon with Asparagus", cal: 320, protein: 34, carbs: 10, fat: 16, prep: 20, emoji: "🐟", ingredients: ["150g salmon fillet", "bunch of asparagus", "1 tbsp olive oil", "juice of half lemon", "1 garlic clove"], steps: ["Preheat oven to 200°C. Place salmon fillet and asparagus on a lined baking sheet.", "Drizzle with olive oil, add thin garlic slices, and squeeze lemon juice over everything.", "Bake for 15 minutes until the salmon is pink and flaky, and asparagus is tender."] },
      { name: "Chicken Stir-Fry", cal: 300, protein: 30, carbs: 22, fat: 10, prep: 15, emoji: "🍗", ingredients: ["150g chicken breast", "1 bell pepper", "100g broccoli", "2 tbsp soy sauce", "1 tsp fresh ginger"], steps: ["Slice chicken into thin strips and chop vegetables into bite-size pieces.", "Stir-fry chicken on high heat for 4-5 minutes until golden and cooked through.", "Add vegetables, soy sauce, and grated ginger. Stir-fry on high heat for 3-4 more minutes until vegetables are al dente."] },
      { name: "Grilled Fish with Salad", cal: 280, protein: 32, carbs: 8, fat: 12, prep: 15, emoji: "🐠", ingredients: ["150g white fish fillet", "mixed greens", "handful cherry tomatoes", "1 tbsp olive oil", "1 tsp balsamic vinegar"], steps: ["Season the fish fillet with salt and pepper. Grill or pan-fry 3-4 minutes per side.", "Toss mixed greens with halved cherry tomatoes in a bowl.", "Dress the salad with olive oil and balsamic vinegar. Serve alongside the fish."] },
      { name: "Turkey Meatballs with Zucchini", cal: 310, protein: 28, carbs: 18, fat: 14, prep: 20, emoji: "🧆", ingredients: ["300g ground turkey", "2 zucchini", "1 egg", "2 tbsp breadcrumbs", "200ml tomato sauce"], steps: ["Mix 300g ground turkey with 1 egg and 2 tablespoons of breadcrumbs. Form into small meatballs.", "Bake in the oven at 200°C for 20 minutes or until browned, turning halfway.", "Spiralize or slice zucchini into noodles. Heat tomato sauce and serve meatballs over zucchini with sauce."] },
      { name: "Shrimp with Vegetables", cal: 260, protein: 30, carbs: 12, fat: 8, prep: 12, emoji: "🦐", ingredients: ["200g shrimp", "mixed vegetables", "1 garlic clove", "1 tbsp olive oil", "juice of half lemon"], steps: ["Heat olive oil in a pan, add finely chopped garlic and sauté for 30 seconds.", "Add the shrimp and cook 2-3 minutes per side until they turn pink.", "Add mixed vegetables, season with salt and lemon juice, and cook for 3-4 more minutes."] },
    ],
    high_cal: [
      { name: "Steak with Sweet Potato", cal: 580, protein: 42, carbs: 40, fat: 24, prep: 25, emoji: "🥩", ingredients: ["200g beef steak", "1 large sweet potato", "1 tbsp butter", "sprig of rosemary", "salt"], steps: ["Preheat oven to 200°C. Slice sweet potato into rounds, drizzle with oil, and bake for 25-30 minutes.", "Season steak with salt and pepper. Sear on high heat 3-4 minutes per side for medium-rare.", "Let the steak rest 5 minutes. Serve with sweet potato and a sprig of fresh rosemary."] },
      { name: "Chicken Thighs with Rice", cal: 560, protein: 35, carbs: 55, fat: 22, prep: 25, emoji: "🍗", ingredients: ["4 chicken thighs", "150g rice", "1 onion", "2 garlic cloves", "300ml chicken broth"], steps: ["Season chicken thighs and brown skin-side down in a hot pan for 5-6 minutes until crispy.", "Flip, add diced onion and crushed garlic, cook for 2 more minutes.", "Cook rice in chicken broth for 15 minutes. Serve thighs on rice with pan juices drizzled over."] },
      { name: "Pesto Chicken Pasta", cal: 600, protein: 38, carbs: 60, fat: 20, prep: 18, emoji: "🍝", ingredients: ["150g pasta", "150g chicken breast", "3 tbsp pesto", "grated parmesan", "handful cherry tomatoes"], steps: ["Cook pasta al dente according to package instructions. Drain.", "Grill chicken breast 6-7 minutes per side, then slice into strips.", "Toss pasta with pesto, add chicken and halved cherry tomatoes. Top with grated parmesan."] },
      { name: "Salmon with Mashed Potatoes", cal: 540, protein: 36, carbs: 40, fat: 22, prep: 20, emoji: "🐟", ingredients: ["150g salmon fillet", "400g potatoes", "1 tbsp butter", "splash of milk", "fresh dill"], steps: ["Bake salmon at 200°C for 12-15 minutes until it flakes easily with a fork.", "Peel and boil potatoes until soft. Mash with butter and milk until creamy.", "Serve salmon on a bed of mashed potatoes, garnished with fresh dill."] },
      { name: "Lamb Chops with Couscous", cal: 580, protein: 38, carbs: 45, fat: 26, prep: 25, emoji: "🍖", ingredients: ["4 lamb chops", "100g couscous", "fresh mint leaves", "juice of half lemon", "1 tbsp olive oil"], steps: ["Season lamb chops with salt, pepper, and olive oil. Grill on high heat 3-4 minutes per side.", "Prepare couscous by pouring boiling water over it, covering for 5 minutes, then fluffing with a fork.", "Mix finely chopped mint and lemon juice into the couscous. Serve alongside the lamb chops."] },
    ],
    balanced: [
      { name: "Chicken with Roasted Vegetables", cal: 380, protein: 35, carbs: 25, fat: 14, prep: 20, emoji: "🍗", ingredients: ["150g chicken breast", "1 bell pepper", "1 zucchini", "1 onion", "1 tbsp olive oil"], steps: ["Preheat oven to 200°C. Chop vegetables into large chunks.", "Toss vegetables with olive oil, salt, and pepper. Roast for 20-25 minutes, stirring halfway.", "Grill chicken breast 6-7 minutes per side. Slice and serve with the roasted vegetables."] },
      { name: "Baked Fish with Quinoa", cal: 360, protein: 32, carbs: 35, fat: 10, prep: 18, emoji: "🐠", ingredients: ["150g white fish", "100g quinoa", "juice of half lemon", "fresh herbs", "steamed greens"], steps: ["Cook quinoa for 15 minutes. Drain and fluff with a fork.", "Season fish with herbs, salt, and lemon juice. Bake at 200°C for 12-15 minutes.", "Steam greens for 3-4 minutes. Plate quinoa, fish, and greens together."] },
      { name: "Turkey Burger with Sweet Potato Fries", cal: 420, protein: 30, carbs: 40, fat: 14, prep: 20, emoji: "🍔", ingredients: ["200g ground turkey", "1 whole-wheat bun", "1 sweet potato", "lettuce", "1 tomato"], steps: ["Cut sweet potato into fries, drizzle with oil, and bake at 220°C for 20-25 minutes.", "Form turkey patties from ground turkey, season, and grill 5-6 minutes per side.", "Assemble the burger — bun, lettuce, turkey patty, tomato slice. Serve with sweet potato fries."] },
      { name: "Tofu Stir-Fry with Brown Rice", cal: 370, protein: 18, carbs: 48, fat: 12, prep: 15, emoji: "🍜", ingredients: ["200g tofu", "150g brown rice", "mixed vegetables", "2 tbsp soy sauce", "1 tsp sesame oil"], steps: ["Cook brown rice according to instructions (20-25 minutes). Drain tofu and cut into cubes.", "Fry tofu in sesame oil for 3-4 minutes until golden on all sides.", "Add sliced vegetables and soy sauce, cook for 3 more minutes. Serve over brown rice."] },
      { name: "Chicken with Steamed Broccoli", cal: 340, protein: 38, carbs: 15, fat: 10, prep: 15, emoji: "🥦", ingredients: ["150g chicken breast", "200g broccoli", "1 tbsp olive oil", "1 garlic clove", "juice of half lemon"], steps: ["Season chicken with crushed garlic, salt, and pepper. Grill 6-7 minutes per side.", "Separate broccoli into florets and steam for 3-4 minutes until al dente.", "Drizzle broccoli with lemon juice and olive oil. Serve alongside the chicken."] },
    ],
  },
  snack: {
    low_cal: [
      { name: "Greek Yogurt", cal: 120, protein: 15, carbs: 8, fat: 3, prep: 0, emoji: "🥛", ingredients: ["200g Greek yogurt"], steps: ["Serve 200g of Greek yogurt in a bowl. Optionally add a dash of vanilla or cinnamon for flavor."] },
      { name: "Apple Slices", cal: 95, protein: 0, carbs: 25, fat: 0, prep: 0, emoji: "🍎", ingredients: ["1 apple"], steps: ["Wash the apple, slice into wedges, and enjoy as a light and refreshing snack."] },
      { name: "Carrot Sticks with Hummus", cal: 130, protein: 4, carbs: 16, fat: 6, prep: 3, emoji: "🥕", ingredients: ["2 carrots", "2-3 tbsp hummus"], steps: ["Peel carrots and cut into thin sticks.", "Place 2-3 tablespoons of hummus in a small bowl. Dip carrot sticks and enjoy."] },
      { name: "Green Tea", cal: 0, protein: 0, carbs: 0, fat: 0, prep: 2, emoji: "🍵", ingredients: ["1 green tea bag", "hot water (80°C)"], steps: ["Heat water to 80°C (not boiling). Steep the tea bag for 3 minutes, remove, and drink."] },
      { name: "Cottage Cheese", cal: 110, protein: 14, carbs: 5, fat: 4, prep: 0, emoji: "🧀", ingredients: ["150g cottage cheese"], steps: ["Serve a portion of cottage cheese in a bowl. Season with pepper or add fresh herbs if desired."] },
    ],
    high_cal: [
      { name: "Protein Shake with Banana", cal: 350, protein: 30, carbs: 42, fat: 8, prep: 3, emoji: "🥤", ingredients: ["1 scoop protein powder", "1 banana", "250ml milk", "1 tbsp peanut butter"], steps: ["Add one scoop of protein powder, 1 banana, 250ml milk, and a tablespoon of peanut butter to a blender.", "Blend for 30-60 seconds until completely smooth. Pour into a glass and drink immediately."] },
      { name: "Trail Mix", cal: 280, protein: 8, carbs: 28, fat: 16, prep: 0, emoji: "🥜", ingredients: ["mixed nuts", "dried fruit", "dark chocolate chips"], steps: ["Mix all ingredients together in a bowl. Portion out one handful (about 40g) as a snack."] },
      { name: "Peanut Butter on Toast", cal: 300, protein: 10, carbs: 30, fat: 16, prep: 3, emoji: "🍞", ingredients: ["1 slice bread", "2 tbsp peanut butter"], steps: ["Toast bread until golden.", "Spread a thick layer of peanut butter and eat immediately."] },
      { name: "Almonds (30g)", cal: 170, protein: 6, carbs: 6, fat: 15, prep: 0, emoji: "🌰", ingredients: ["30g almonds (about 23 pieces)"], steps: ["Weigh out 30g of almonds (approximately 23 pieces). Enjoy as a quick and nutritious snack."] },
      { name: "Banana with Peanut Butter", cal: 260, protein: 7, carbs: 35, fat: 12, prep: 2, emoji: "🍌", ingredients: ["1 banana", "1 tbsp peanut butter"], steps: ["Peel and slice the banana into rounds.", "Add a tablespoon of peanut butter for dipping or spread it over the slices."] },
    ],
    balanced: [
      { name: "Apple with Peanut Butter", cal: 200, protein: 5, carbs: 28, fat: 8, prep: 2, emoji: "🍎", ingredients: ["1 apple", "1 tbsp peanut butter"], steps: ["Wash and slice the apple into wedges.", "Serve alongside a tablespoon of peanut butter for dipping."] },
      { name: "Mixed Nuts (25g)", cal: 160, protein: 5, carbs: 6, fat: 14, prep: 0, emoji: "🥜", ingredients: ["25g mixed nuts"], steps: ["Weigh out 25g of mixed nuts as a nutritious snack rich in healthy fats."] },
      { name: "Protein Bar", cal: 200, protein: 20, carbs: 22, fat: 6, prep: 0, emoji: "🍫", ingredients: ["1 protein bar"], steps: ["Unwrap and eat as a convenient post-workout snack or between meals."] },
      { name: "Yogurt with Berries", cal: 150, protein: 10, carbs: 18, fat: 4, prep: 2, emoji: "🫐", ingredients: ["150g yogurt", "handful of mixed berries"], steps: ["Scoop 150g of yogurt into a bowl.", "Top with a generous handful of fresh mixed berries (raspberries, blueberries, strawberries) and eat immediately."] },
      { name: "Hard-Boiled Egg", cal: 75, protein: 6, carbs: 1, fat: 5, prep: 10, emoji: "🥚", ingredients: ["1 egg"], steps: ["Place the egg in a pot of cold water. Bring to a boil and cook for exactly 10 minutes.", "Transfer to cold water, cool, peel, and enjoy."] },
    ],
  },
};

const EXTRA_FOOD_DB = {
  breakfast: {
    low_cal: [
      { name: "Chia Pudding with Kiwi", cal: 210, protein: 8, carbs: 24, fat: 8, prep: 6, emoji: "🥝", ingredients: ["3 tbsp chia seeds", "200ml almond milk", "1 kiwi", "1 tsp honey"], steps: ["Mix chia seeds with almond milk and let sit for 10 minutes or overnight until thick.", "Peel and dice the kiwi into small cubes.", "Top the pudding with kiwi and a little honey before serving."] },
      { name: "Cottage Cheese Berry Bowl", cal: 190, protein: 18, carbs: 16, fat: 5, prep: 3, emoji: "🫐", ingredients: ["150g cottage cheese", "mixed berries", "1 tsp flax seeds"], steps: ["Spoon cottage cheese into a bowl.", "Top with mixed berries and flax seeds.", "Serve chilled as a quick high-protein breakfast."] },
      { name: "Spinach Mushroom Scramble", cal: 200, protein: 17, carbs: 6, fat: 10, prep: 8, emoji: "🍄", ingredients: ["2 eggs", "handful spinach", "100g mushrooms", "olive oil spray"], steps: ["Slice mushrooms and saute briefly in a non-stick pan.", "Add spinach and cook until wilted.", "Pour beaten eggs into the pan and scramble until softly set."] },
    ],
    high_cal: [
      { name: "Breakfast Burrito", cal: 470, protein: 24, carbs: 44, fat: 20, prep: 12, emoji: "🌯", ingredients: ["1 tortilla", "3 eggs", "30g cheese", "half avocado", "salsa"], steps: ["Scramble the eggs in a pan until just set.", "Fill a tortilla with eggs, cheese, avocado slices, and salsa.", "Roll tightly and toast briefly on both sides."] },
      { name: "French Toast with Banana", cal: 430, protein: 18, carbs: 54, fat: 16, prep: 10, emoji: "🍞", ingredients: ["2 slices bread", "2 eggs", "100ml milk", "1 banana", "maple syrup"], steps: ["Whisk eggs and milk in a shallow bowl.", "Dip bread into the mixture and cook on a pan until golden on both sides.", "Top with sliced banana and maple syrup."] },
      { name: "Protein Overnight Oats", cal: 410, protein: 28, carbs: 46, fat: 12, prep: 5, emoji: "🥣", ingredients: ["60g oats", "1 scoop protein powder", "200ml milk", "1 tbsp peanut butter", "berries"], steps: ["Combine oats, protein powder, and milk in a jar.", "Stir in peanut butter and refrigerate overnight.", "Top with berries in the morning and serve cold."] },
    ],
    balanced: [
      { name: "Skyr Bowl with Fruit", cal: 300, protein: 20, carbs: 34, fat: 8, prep: 4, emoji: "🍓", ingredients: ["200g skyr", "1 banana", "berries", "20g granola"], steps: ["Spoon skyr into a bowl.", "Top with sliced banana, berries, and granola.", "Serve immediately for a balanced protein-rich breakfast."] },
      { name: "Egg and Avocado Sandwich", cal: 340, protein: 16, carbs: 28, fat: 18, prep: 8, emoji: "🥪", ingredients: ["2 slices whole-grain bread", "2 eggs", "half avocado", "lettuce"], steps: ["Boil or fry the eggs to your liking.", "Mash avocado onto the bread and add lettuce.", "Layer in the eggs and close the sandwich."] },
      { name: "Banana Walnut Oats", cal: 330, protein: 11, carbs: 44, fat: 12, prep: 6, emoji: "🍌", ingredients: ["60g oats", "250ml milk", "1 banana", "15g walnuts"], steps: ["Cook oats in milk until creamy.", "Slice in the banana and stir briefly.", "Top with chopped walnuts and serve warm."] },
    ],
  },
  lunch: {
    low_cal: [
      { name: "Chicken Quinoa Salad", cal: 340, protein: 34, carbs: 24, fat: 10, prep: 15, emoji: "🥗", ingredients: ["120g chicken breast", "80g quinoa", "mixed greens", "cherry tomatoes", "lemon"], steps: ["Cook quinoa and let it cool slightly.", "Grill chicken breast and slice into strips.", "Combine with greens and tomatoes, then finish with lemon juice."] },
      { name: "Egg Tuna Lettuce Boats", cal: 290, protein: 30, carbs: 6, fat: 14, prep: 10, emoji: "🥬", ingredients: ["1 can tuna", "1 boiled egg", "romaine leaves", "mustard"], steps: ["Mix tuna with chopped boiled egg and mustard.", "Spoon the mixture into romaine leaves.", "Serve immediately as a light protein-rich lunch."] },
      { name: "Turkey Veggie Bowl", cal: 330, protein: 32, carbs: 20, fat: 12, prep: 14, emoji: "🥙", ingredients: ["150g turkey mince", "zucchini", "bell pepper", "brown rice", "paprika"], steps: ["Cook the turkey mince with paprika until browned.", "Saute the vegetables until tender-crisp.", "Serve over a small scoop of brown rice."] },
    ],
    high_cal: [
      { name: "Chicken Pesto Rice", cal: 590, protein: 40, carbs: 62, fat: 18, prep: 18, emoji: "🍚", ingredients: ["150g chicken breast", "160g rice", "2 tbsp pesto", "spinach"], steps: ["Cook rice until fluffy.", "Grill chicken breast and slice it.", "Toss pesto through the rice, add spinach, and top with chicken."] },
      { name: "Beef Burrito Wrap", cal: 610, protein: 36, carbs: 58, fat: 24, prep: 18, emoji: "🌯", ingredients: ["150g lean beef", "1 tortilla", "rice", "beans", "cheese"], steps: ["Cook the beef with spices until browned.", "Warm the tortilla and fill with rice, beans, beef, and cheese.", "Roll tightly and toast for a minute per side."] },
      { name: "Creamy Chicken Pasta", cal: 640, protein: 38, carbs: 66, fat: 22, prep: 20, emoji: "🍝", ingredients: ["150g pasta", "150g chicken", "cooking cream", "parmesan", "peas"], steps: ["Cook pasta until al dente.", "Cook chicken pieces in a pan until golden.", "Add cream and peas, then toss with pasta and parmesan."] },
    ],
    balanced: [
      { name: "Mediterranean Chicken Couscous", cal: 430, protein: 34, carbs: 42, fat: 12, prep: 16, emoji: "🥙", ingredients: ["120g chicken breast", "100g couscous", "cucumber", "tomato", "olive oil"], steps: ["Prepare couscous according to package instructions.", "Cook the chicken and slice it thinly.", "Mix with chopped vegetables and drizzle with olive oil."] },
      { name: "Tofu Peanut Rice Bowl", cal: 410, protein: 22, carbs: 44, fat: 14, prep: 15, emoji: "🥜", ingredients: ["180g tofu", "120g rice", "broccoli", "1 tbsp peanut butter", "soy sauce"], steps: ["Cook the rice and set aside.", "Pan-fry tofu cubes until golden.", "Add broccoli and a quick sauce made from peanut butter and soy sauce."] },
      { name: "Turkey Pasta Salad", cal: 420, protein: 30, carbs: 38, fat: 14, prep: 14, emoji: "🥗", ingredients: ["100g pasta", "100g turkey", "corn", "tomato", "yogurt dressing"], steps: ["Cook pasta and cool it slightly.", "Mix with turkey pieces, corn, and tomato.", "Toss with a light yogurt dressing and serve."] },
    ],
  },
  dinner: {
    low_cal: [
      { name: "Cod with Green Beans", cal: 300, protein: 33, carbs: 12, fat: 9, prep: 16, emoji: "🐟", ingredients: ["150g cod", "green beans", "garlic", "olive oil"], steps: ["Season cod and bake or pan-sear until flaky.", "Steam green beans until tender-crisp.", "Finish with olive oil and garlic."] },
      { name: "Turkey Zucchini Skillet", cal: 320, protein: 31, carbs: 14, fat: 12, prep: 15, emoji: "🍳", ingredients: ["150g turkey mince", "1 zucchini", "passata", "onion"], steps: ["Brown turkey mince with chopped onion.", "Add zucchini slices and cook until softened.", "Pour in passata and simmer briefly before serving."] },
      { name: "Tofu Veggie Soup", cal: 280, protein: 20, carbs: 18, fat: 10, prep: 18, emoji: "🍲", ingredients: ["180g tofu", "vegetable broth", "bok choy", "carrot", "ginger"], steps: ["Bring broth to a simmer with ginger and carrot.", "Add tofu cubes and bok choy.", "Cook until vegetables are tender and serve hot."] },
    ],
    high_cal: [
      { name: "Beef Rice Stir-Fry", cal: 610, protein: 40, carbs: 58, fat: 22, prep: 18, emoji: "🥩", ingredients: ["180g beef strips", "150g rice", "mixed vegetables", "soy sauce"], steps: ["Cook rice and set aside.", "Stir-fry beef strips until browned.", "Add vegetables and rice, then toss with soy sauce."] },
      { name: "Chicken Alfredo Bake", cal: 630, protein: 42, carbs: 54, fat: 26, prep: 22, emoji: "🍗", ingredients: ["150g chicken", "120g pasta", "alfredo sauce", "mozzarella"], steps: ["Cook pasta until just under al dente.", "Cook chicken pieces and mix with pasta and sauce.", "Top with mozzarella and bake until bubbly."] },
      { name: "Salmon Rice Plate", cal: 560, protein: 36, carbs: 44, fat: 24, prep: 18, emoji: "🍣", ingredients: ["150g salmon", "140g rice", "avocado", "cucumber"], steps: ["Cook rice until fluffy.", "Pan-sear or bake salmon until cooked through.", "Serve with sliced avocado and cucumber."] },
    ],
    balanced: [
      { name: "Chicken Couscous Plate", cal: 410, protein: 34, carbs: 38, fat: 12, prep: 16, emoji: "🍽️", ingredients: ["150g chicken breast", "100g couscous", "roasted vegetables"], steps: ["Cook couscous and roast vegetables.", "Grill or pan-fry the chicken breast.", "Serve everything together on one plate."] },
      { name: "Shrimp Rice Bowl", cal: 390, protein: 28, carbs: 42, fat: 10, prep: 15, emoji: "🦐", ingredients: ["180g shrimp", "130g rice", "peas", "lemon"], steps: ["Cook rice and keep warm.", "Saute shrimp until pink and cooked through.", "Add peas and lemon, then serve over rice."] },
      { name: "Tofu Sesame Noodles", cal: 400, protein: 20, carbs: 46, fat: 14, prep: 15, emoji: "🍜", ingredients: ["180g tofu", "100g noodles", "sesame oil", "carrot", "soy sauce"], steps: ["Cook noodles and drain.", "Fry tofu cubes in sesame oil until golden.", "Add carrot and soy sauce, then toss with noodles."] },
    ],
  },
  snack: {
    low_cal: [
      { name: "Rice Cakes with Cottage Cheese", cal: 140, protein: 10, carbs: 16, fat: 4, prep: 2, emoji: "🍘", ingredients: ["2 rice cakes", "80g cottage cheese"], steps: ["Spread cottage cheese over the rice cakes.", "Serve immediately as a light snack."] },
      { name: "Berry Protein Pudding", cal: 150, protein: 16, carbs: 12, fat: 4, prep: 3, emoji: "🍓", ingredients: ["protein pudding", "berries"], steps: ["Spoon protein pudding into a bowl.", "Top with berries and serve cold."] },
    ],
    high_cal: [
      { name: "Peanut Butter Smoothie", cal: 320, protein: 22, carbs: 34, fat: 12, prep: 4, emoji: "🥤", ingredients: ["milk", "banana", "peanut butter", "protein powder"], steps: ["Add all ingredients to a blender.", "Blend until smooth and drink immediately."] },
      { name: "Date Nut Energy Bites", cal: 290, protein: 8, carbs: 30, fat: 14, prep: 8, emoji: "🌰", ingredients: ["dates", "nuts", "oats", "cocoa"], steps: ["Blend dates, nuts, oats, and cocoa into a sticky mixture.", "Roll into small balls.", "Chill briefly before serving."] },
    ],
    balanced: [
      { name: "Skyr with Honey", cal: 180, protein: 17, carbs: 16, fat: 3, prep: 1, emoji: "🍯", ingredients: ["150g skyr", "1 tsp honey"], steps: ["Spoon skyr into a bowl.", "Top with honey and serve."] },
      { name: "Mini Turkey Sandwich", cal: 210, protein: 14, carbs: 20, fat: 7, prep: 4, emoji: "🥪", ingredients: ["2 slices bread", "turkey slices", "lettuce"], steps: ["Layer turkey and lettuce between bread slices.", "Cut in half and serve."] },
    ],
  },
};

EXTRA_FOOD_DB.breakfast.low_cal.push(
  { name: "Apple Cinnamon Skyr Cup", cal: 205, protein: 17, carbs: 22, fat: 4, prep: 4, emoji: "🍎", ingredients: ["180g skyr", "half apple", "pinch of cinnamon", "1 tsp honey"], steps: ["Spoon skyr into a bowl or cup.", "Dice the apple into small cubes and place on top.", "Finish with cinnamon and a small drizzle of honey."] },
  { name: "Protein Berry Smoothie", cal: 215, protein: 22, carbs: 20, fat: 4, prep: 4, emoji: "🥤", ingredients: ["1 scoop protein powder", "mixed berries", "200ml almond milk", "ice"], steps: ["Add berries, protein powder, almond milk, and ice to a blender.", "Blend until smooth and creamy.", "Pour into a glass and serve immediately."] },
  { name: "Tomato Egg Toast", cal: 225, protein: 14, carbs: 20, fat: 9, prep: 7, emoji: "🍞", ingredients: ["1 slice whole-grain bread", "1 egg", "1 tomato", "salt", "pepper"], steps: ["Toast the bread until golden.", "Cook the egg to your liking in a small pan.", "Top the toast with sliced tomato and the egg, then season."] },
);

EXTRA_FOOD_DB.breakfast.high_cal.push(
  { name: "Peanut Butter Banana Bagel", cal: 490, protein: 18, carbs: 58, fat: 18, prep: 4, emoji: "🥯", ingredients: ["1 bagel", "2 tbsp peanut butter", "1 banana"], steps: ["Slice and lightly toast the bagel.", "Spread peanut butter over both halves.", "Top with banana slices and serve."] },
  { name: "Granola Yogurt Power Bowl", cal: 465, protein: 22, carbs: 52, fat: 16, prep: 4, emoji: "🥣", ingredients: ["200g Greek yogurt", "60g granola", "banana", "1 tbsp honey"], steps: ["Add yogurt to a bowl.", "Top with granola and sliced banana.", "Finish with honey for extra energy."] },
  { name: "Ham Cheese Omelette Plate", cal: 480, protein: 30, carbs: 24, fat: 26, prep: 10, emoji: "🍳", ingredients: ["3 eggs", "40g cheese", "50g ham", "2 slices bread"], steps: ["Whisk the eggs and pour into a hot pan.", "Add chopped ham and cheese, then fold the omelette.", "Serve with bread on the side."] },
);

EXTRA_FOOD_DB.breakfast.balanced.push(
  { name: "Berry Toast with Ricotta", cal: 320, protein: 14, carbs: 34, fat: 12, prep: 5, emoji: "🍓", ingredients: ["2 slices bread", "80g ricotta", "berries", "1 tsp honey"], steps: ["Toast the bread until lightly crisp.", "Spread ricotta over both slices.", "Top with berries and a little honey."] },
  { name: "Mango Yogurt Oats", cal: 345, protein: 16, carbs: 46, fat: 9, prep: 5, emoji: "🥭", ingredients: ["150g yogurt", "50g oats", "half mango", "chia seeds"], steps: ["Add oats and yogurt to a bowl.", "Dice mango and spoon it over the top.", "Finish with chia seeds and serve."] },
  { name: "Turkey Breakfast Wrap", cal: 350, protein: 22, carbs: 32, fat: 13, prep: 8, emoji: "🌯", ingredients: ["1 tortilla", "2 eggs", "turkey slices", "spinach"], steps: ["Scramble the eggs until softly set.", "Fill the tortilla with eggs, turkey, and spinach.", "Wrap tightly and warm briefly before serving."] },
);

EXTRA_FOOD_DB.lunch.low_cal.push(
  { name: "Salmon Spinach Plate", cal: 345, protein: 33, carbs: 18, fat: 13, prep: 14, emoji: "🍣", ingredients: ["120g salmon", "spinach", "boiled potatoes", "lemon"], steps: ["Bake or pan-sear the salmon until cooked through.", "Wilt spinach briefly in a pan.", "Serve with boiled potatoes and a squeeze of lemon."] },
  { name: "Chicken Soup Bowl", cal: 310, protein: 28, carbs: 20, fat: 9, prep: 18, emoji: "🍲", ingredients: ["chicken breast", "carrot", "celery", "broth", "parsley"], steps: ["Cook chopped chicken in broth until tender.", "Add chopped carrot and celery and simmer.", "Finish with parsley and serve hot."] },
  { name: "Cottage Cheese Veggie Toast", cal: 295, protein: 24, carbs: 22, fat: 11, prep: 6, emoji: "🥪", ingredients: ["2 slices bread", "120g cottage cheese", "cucumber", "tomato"], steps: ["Toast the bread lightly.", "Spread cottage cheese on top.", "Finish with cucumber and tomato slices."] },
);

EXTRA_FOOD_DB.lunch.high_cal.push(
  { name: "Turkey Potato Power Bowl", cal: 605, protein: 39, carbs: 57, fat: 22, prep: 20, emoji: "🍛", ingredients: ["turkey mince", "potatoes", "cheese", "corn", "yogurt sauce"], steps: ["Roast or boil potatoes until tender.", "Cook turkey mince with seasoning until browned.", "Build a bowl with potatoes, turkey, corn, cheese, and yogurt sauce."] },
  { name: "Salmon Avocado Wrap", cal: 590, protein: 34, carbs: 44, fat: 28, prep: 10, emoji: "🌯", ingredients: ["1 wrap", "120g salmon", "half avocado", "lettuce", "yogurt sauce"], steps: ["Cook or flake the salmon into bite-size pieces.", "Fill the wrap with salmon, avocado, lettuce, and sauce.", "Roll tightly and slice in half."] },
  { name: "Chicken Couscous Tray", cal: 575, protein: 40, carbs: 60, fat: 16, prep: 18, emoji: "🍽️", ingredients: ["150g chicken", "100g couscous", "roasted vegetables", "olive oil"], steps: ["Cook couscous according to package instructions.", "Roast vegetables until tender and grill the chicken.", "Serve everything together with a drizzle of olive oil."] },
);

EXTRA_FOOD_DB.lunch.balanced.push(
  { name: "Chicken Hummus Bowl", cal: 440, protein: 33, carbs: 38, fat: 15, prep: 12, emoji: "🥗", ingredients: ["120g chicken", "hummus", "cucumber", "tomato", "pita"], steps: ["Cook the chicken and slice it thinly.", "Spread hummus in the bowl as a base.", "Add chopped vegetables, pita pieces, and chicken on top."] },
  { name: "Rice Tuna Bowl", cal: 415, protein: 29, carbs: 42, fat: 11, prep: 10, emoji: "🍚", ingredients: ["1 can tuna", "120g rice", "cucumber", "sweetcorn"], steps: ["Cook or reheat the rice.", "Drain the tuna and prepare the vegetables.", "Assemble everything in a bowl and season to taste."] },
  { name: "Egg Chickpea Salad Plate", cal: 425, protein: 22, carbs: 34, fat: 18, prep: 12, emoji: "🥚", ingredients: ["2 eggs", "chickpeas", "greens", "tomato", "olive oil"], steps: ["Boil the eggs and let them cool slightly.", "Combine chickpeas, greens, and chopped tomato.", "Top with halved eggs and olive oil."] },
);

EXTRA_FOOD_DB.dinner.low_cal.push(
  { name: "Chicken Cauliflower Bowl", cal: 315, protein: 32, carbs: 16, fat: 11, prep: 16, emoji: "🍗", ingredients: ["150g chicken breast", "cauliflower", "spinach", "olive oil"], steps: ["Cook the chicken breast until golden and fully cooked.", "Roast or saute cauliflower until tender.", "Serve with spinach and a drizzle of olive oil."] },
  { name: "Egg Veggie Frittata", cal: 295, protein: 24, carbs: 10, fat: 16, prep: 14, emoji: "🍳", ingredients: ["3 eggs", "bell pepper", "spinach", "onion"], steps: ["Saute the vegetables in an oven-safe pan.", "Pour in beaten eggs and cook briefly on the stove.", "Finish in the oven or under a lid until set."] },
  { name: "Light Tuna Tomato Plate", cal: 285, protein: 29, carbs: 11, fat: 12, prep: 7, emoji: "🍅", ingredients: ["1 can tuna", "tomatoes", "greens", "olive oil"], steps: ["Drain the tuna well.", "Slice tomatoes and arrange them with greens.", "Add tuna on top and finish with olive oil."] },
);

EXTRA_FOOD_DB.dinner.high_cal.push(
  { name: "Turkey Pasta Bake", cal: 600, protein: 39, carbs: 56, fat: 21, prep: 20, emoji: "🍝", ingredients: ["turkey mince", "pasta", "tomato sauce", "mozzarella"], steps: ["Cook pasta until nearly done.", "Brown turkey mince and stir through tomato sauce.", "Combine with pasta, top with mozzarella, and bake until golden."] },
  { name: "Creamy Salmon Potatoes", cal: 585, protein: 35, carbs: 42, fat: 27, prep: 20, emoji: "🥔", ingredients: ["150g salmon", "potatoes", "yogurt sauce", "herbs"], steps: ["Cook or roast the potatoes until tender.", "Bake or pan-sear salmon until flaky.", "Serve with a creamy yogurt herb sauce."] },
  { name: "Chicken Noodle Bowl", cal: 570, protein: 37, carbs: 61, fat: 18, prep: 18, emoji: "🍜", ingredients: ["150g chicken", "100g noodles", "vegetables", "soy sauce"], steps: ["Cook noodles according to package instructions.", "Stir-fry chicken and vegetables until cooked.", "Toss everything together with soy sauce."] },
);

EXTRA_FOOD_DB.dinner.balanced.push(
  { name: "Turkey Rice Plate", cal: 430, protein: 33, carbs: 40, fat: 14, prep: 16, emoji: "🍛", ingredients: ["150g turkey", "130g rice", "vegetables"], steps: ["Cook rice until fluffy.", "Cook turkey strips until browned and cooked through.", "Serve with mixed vegetables on the side."] },
  { name: "Salmon Couscous Bowl", cal: 420, protein: 31, carbs: 35, fat: 16, prep: 16, emoji: "🍣", ingredients: ["120g salmon", "100g couscous", "cucumber", "lemon"], steps: ["Prepare couscous according to package instructions.", "Cook the salmon until tender and flaky.", "Serve with cucumber and lemon on top."] },
  { name: "Chicken Veggie Pasta", cal: 435, protein: 32, carbs: 41, fat: 13, prep: 16, emoji: "🍝", ingredients: ["120g chicken", "90g pasta", "zucchini", "tomato sauce"], steps: ["Cook pasta until al dente.", "Cook chicken pieces and zucchini in a pan.", "Add tomato sauce and combine everything together."] },
);

EXTRA_FOOD_DB.snack.low_cal.push(
  { name: "Apple Yogurt Cup", cal: 145, protein: 11, carbs: 17, fat: 3, prep: 3, emoji: "🍎", ingredients: ["100g yogurt", "half apple", "cinnamon"], steps: ["Spoon yogurt into a cup or bowl.", "Dice the apple and add on top.", "Finish with a little cinnamon."] },
  { name: "Boiled Egg Snack Plate", cal: 135, protein: 12, carbs: 2, fat: 8, prep: 2, emoji: "🥚", ingredients: ["2 boiled eggs"], steps: ["Peel the boiled eggs.", "Slice or serve whole with a pinch of salt."] },
  { name: "Mini Protein Smoothie", cal: 155, protein: 18, carbs: 10, fat: 4, prep: 3, emoji: "🥤", ingredients: ["half scoop protein powder", "berries", "150ml milk"], steps: ["Add all ingredients to a blender.", "Blend until smooth and serve immediately."] },
);

EXTRA_FOOD_DB.snack.high_cal.push(
  { name: "Trail Mix Yogurt Pot", cal: 305, protein: 16, carbs: 28, fat: 14, prep: 3, emoji: "🥣", ingredients: ["Greek yogurt", "trail mix", "honey"], steps: ["Add yogurt to a bowl.", "Top with trail mix and honey.", "Serve immediately."] },
  { name: "Banana Peanut Oat Cup", cal: 315, protein: 14, carbs: 36, fat: 13, prep: 4, emoji: "🍌", ingredients: ["banana", "oats", "peanut butter", "milk"], steps: ["Mash the banana lightly.", "Mix with oats, peanut butter, and a splash of milk.", "Serve as a quick dense snack."] },
  { name: "Ham Cheese Toastie", cal: 330, protein: 20, carbs: 26, fat: 16, prep: 6, emoji: "🥪", ingredients: ["2 slices bread", "ham", "cheese"], steps: ["Fill bread with ham and cheese.", "Toast in a pan or sandwich press until golden.", "Serve warm."] },
);

EXTRA_FOOD_DB.snack.balanced.push(
  { name: "Banana Almond Yogurt", cal: 205, protein: 13, carbs: 21, fat: 7, prep: 3, emoji: "🍌", ingredients: ["yogurt", "banana", "almonds"], steps: ["Add yogurt to a bowl.", "Top with sliced banana and chopped almonds.", "Serve chilled."] },
  { name: "Cottage Cheese Crackers", cal: 215, protein: 16, carbs: 18, fat: 8, prep: 4, emoji: "🍘", ingredients: ["cottage cheese", "whole-grain crackers", "cucumber"], steps: ["Spread cottage cheese on crackers.", "Top with thin cucumber slices.", "Serve as a quick balanced snack."] },
  { name: "Protein Cocoa Mug", cal: 195, protein: 15, carbs: 18, fat: 6, prep: 4, emoji: "☕", ingredients: ["milk", "cocoa", "protein powder", "honey"], steps: ["Warm the milk gently in a mug or saucepan.", "Whisk in cocoa and protein powder until smooth.", "Add a little honey and serve warm."] },
);

function getCalCategory(goal) {
  if (goal === "lose") return "low_cal";
  if (goal === "gain") return "high_cal";
  return "balanced";
}

for (const mealType of Object.keys(EXTRA_FOOD_DB)) {
  for (const category of Object.keys(EXTRA_FOOD_DB[mealType])) {
    FOOD_DB[mealType][category] = [
      ...(FOOD_DB[mealType][category] || []),
      ...EXTRA_FOOD_DB[mealType][category],
    ];
  }
}

const ALLERGEN_KEYWORDS = {
  gluten: ["bread", "toast", "pasta", "bagel", "tortilla", "pancake", "breadcrumbs", "couscous", "noodles", "granola", "oats", "wrap", "wheat", "flour", "brašno", "brasno", "pšenica", "psenica"],
  dairy: ["milk", "yogurt", "yoghurt", "jogurt", "cheese", "cream cheese", "butter", "sour cream", "parmesan", "cream", "vrhnje", "maslac", "lactose", "dairy"],
  nuts: ["peanut butter", "peanut", "almonds", "walnuts", "mixed nuts", "trail mix", "cashew"],
  eggs: ["egg", "eggs", "egg whites", "jaja", "jaje"],
  shellfish: ["shrimp", "shellfish", "prawns", "skampi", "škampi", "skoljke", "školjke"],
  soy: ["soy sauce", "tofu", "soy", "soja"],
  fish: ["salmon", "tuna", "fish", "shrimp", "riba"],
};

const MEAT_KEYWORDS = ["chicken", "beef", "turkey", "lamb", "steak", "ground beef", "ground turkey", "pork"];
const ANIMAL_KEYWORDS = [...MEAT_KEYWORDS, "salmon", "tuna", "fish", "shrimp", "milk", "yogurt", "cheese", "cream", "butter", "egg", "eggs", "honey", "parmesan"];

const DIETARY_CANONICAL_ALIASES = {
  eggs: ["jaja", "jaje", "egg", "eggs", "egg white", "egg whites"],
  milk: ["mlijeko", "milk", "lactose", "dairy", "jogurt", "yogurt", "yoghurt", "butter", "cream", "vrhnje", "maslac"],
  cheese: ["sir", "cheese"],
  chicken: ["piletina", "chicken"],
  beef: ["govedina", "beef"],
  pork: ["svinjetina", "pork"],
  tuna: ["tuna"],
  salmon: ["losos", "salmon"],
  peanuts: ["kikiriki", "peanut", "peanuts", "peanut butter"],
  nuts: ["orasasti", "nuts", "almonds", "walnuts"],
  gluten: ["gluten", "wheat", "flour", "brasno", "brašno", "pšenica", "psenica"],
  fish: ["riba", "fish"],
  shellfish: ["školjke", "skoljke", "shellfish", "shrimp", "škampi", "skampi", "prawns"],
  soy: ["soja", "soy", "tofu"],
  sesame: ["sezam", "sesame"],
  tomato: ["rajčica", "rajcica", "tomato", "tomatoes"],
  onion: ["luk", "onion", "onions"],
  garlic: ["češnjak", "cesnjak", "garlic"],
  avocado: ["avokado", "avocado"],
  honey: ["med", "honey"],
  liver: ["jetra", "liver"],
  parizer: ["parizer"],
  sushi: ["sushi"],
};

const DIETARY_CANONICAL_LOOKUP = new Map(
  Object.entries(DIETARY_CANONICAL_ALIASES).flatMap(([canonical, aliases]) =>
    aliases.map((alias) => [normalizeSearchText(alias), canonical]),
  ),
);

function normalizeSearchText(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegExp(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function tokenBoundaryRegex(term) {
  const normalized = normalizeSearchText(term);
  if (!normalized) return null;
  return new RegExp(`(^|[^a-z0-9])${escapeRegExp(normalized)}($|[^a-z0-9])`, "i");
}

function matchesNormalizedText(text, term) {
  const regex = tokenBoundaryRegex(term);
  if (!regex) return false;
  return regex.test(normalizeSearchText(text));
}

function canonicalizeDietaryTerm(term) {
  const normalized = normalizeSearchText(term);
  if (!normalized) return "";
  return DIETARY_CANONICAL_LOOKUP.get(normalized) || normalized;
}

function buildFoodMatchIndex(food) {
  const rawText = normalizeSearchText([food?.name, ...(food?.ingredients || [])].join(" "));
  const tokens = new Set(rawText.split(" ").filter(Boolean));
  const canonicalTokens = new Set();

  for (const [canonical, aliases] of Object.entries(DIETARY_CANONICAL_ALIASES)) {
    if (aliases.some((alias) => matchesNormalizedText(rawText, alias))) {
      canonicalTokens.add(canonical);
    }
  }

  return { rawText, tokens, canonicalTokens };
}

function foodMatchesTerm(foodIndex, term) {
  const canonical = canonicalizeDietaryTerm(term);
  if (!canonical) return false;

  if (DIETARY_CANONICAL_ALIASES[canonical]) {
    return foodIndex.canonicalTokens.has(canonical);
  }

  if (foodIndex.tokens.has(canonical)) return true;
  return matchesNormalizedText(foodIndex.rawText, canonical);
}

function isAllowed(food, dietary) {
  if (!dietary) return true;
  const { allergies = [], dislikes = [], diet = "none" } = dietary;
  const foodIndex = buildFoodMatchIndex(food);

  for (const allergy of allergies) {
    const keywords = ALLERGEN_KEYWORDS[allergy] || [];
    if (keywords.some((kw) => foodMatchesTerm(foodIndex, kw))) return false;
    if (foodMatchesTerm(foodIndex, allergy)) return false;
  }

  if (diet === "vegetarian" && MEAT_KEYWORDS.some((kw) => foodMatchesTerm(foodIndex, kw))) return false;
  if (diet === "vegan" && ANIMAL_KEYWORDS.some((kw) => foodMatchesTerm(foodIndex, kw))) return false;
  if (diet === "pescatarian" && MEAT_KEYWORDS.some((kw) => foodMatchesTerm(foodIndex, kw))) return false;

  for (const d of dislikes) {
    if (foodMatchesTerm(foodIndex, d)) return false;
  }

  return true;
}

function getMealBudget(targetCalories, goal, mealType) {
  const splits = goal === "gain"
    ? { breakfast: 0.27, lunch: 0.31, dinner: 0.27, snack: 0.15 }
    : goal === "lose"
      ? { breakfast: 0.25, lunch: 0.33, dinner: 0.27, snack: 0.15 }
      : { breakfast: 0.25, lunch: 0.31, dinner: 0.29, snack: 0.15 };
  return Math.round((targetCalories || 2000) * (splits[mealType] || 0.25));
}

export const DEFAULT_RECIPES_PER_MEAL = 3;

function clampRecipesPerMeal(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return DEFAULT_RECIPES_PER_MEAL;
  return Math.min(10, Math.max(1, Math.floor(n)));
}

function scoreFood(food, mealBudget, goal, usageCounts, mealType, recoveryMode = false) {
  const usagePenalty = (usageCounts?.get(food.name) || 0) * 18;
  const calorieDelta = Math.abs((food.cal || mealBudget) - mealBudget);
  const proteinBoost = goal === "gain"
    ? food.protein * 1.4
    : goal === "lose"
      ? food.protein * 1.1
      : food.protein;
  const prepBoost = mealType === "snack" ? Math.max(0, 6 - (food.prep || 0)) * 6 : 0;
  const text = [food.name, ...(food.ingredients || [])].join(" ").toLowerCase();
  const recoveryBoost = recoveryMode
    ? Math.max(0, 12 - (food.prep || 0)) * 2
      + (/(soup|yogurt|oat|smoothie|toast|eggs|egg|rice|banana|berries|salmon|fish|skyr|broth)/.test(text) ? 12 : 0)
    : 0;
  return proteinBoost + prepBoost + recoveryBoost - calorieDelta * 0.08 - usagePenalty;
}

function hashSeed(input) {
  let hash = 2166136261;
  const text = String(input || "nutrition");
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createSeededRandom(seedValue) {
  let seed = hashSeed(seedValue);
  return () => {
    seed += 0x6D2B79F5;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickOptions(mealType, category, count, dietary, options = {}) {
  const {
    usedNames = new Set(),
    usageCounts = new Map(),
    mealBudget = 400,
    recoveryMode = false,
    randomSeed = "nutrition",
    excludeNames = null,
    varietyBoost = 16,
    useNonDeterministic = false,
  } = options;
  const allAllowed = (FOOD_DB[mealType]?.[category] || []).filter((f) => isAllowed(f, dietary));
  if (allAllowed.length === 0) return [];

  let pool = allAllowed
    .filter((food) => !usedNames.has(food.name))
    .filter((food) => (excludeNames instanceof Set ? !excludeNames.has(food.name) : true));
  if (pool.length < count) {
    pool = allAllowed.filter((food) => !usedNames.has(food.name));
  }
  if (pool.length < count) {
    pool = allAllowed.filter((food) => (excludeNames instanceof Set ? !excludeNames.has(food.name) : true));
  }

  const goalForCategory = category === "high_cal" ? "gain" : category === "low_cal" ? "lose" : "only_training";
  const ranked = [...pool]
    .map((food, index) => {
      const seeded = createSeededRandom(`${randomSeed}-${mealType}-${category}-${food.name}-${index}`)();
      const random = useNonDeterministic ? Math.random() : seeded;
      const score = scoreFood(food, mealBudget, goalForCategory, usageCounts, mealType, recoveryMode);
      return { food, score, random };
    })
    .sort((a, b) => (b.score + b.random * varietyBoost) - (a.score + a.random * varietyBoost));

  const shortlistSize = Math.min(ranked.length, Math.max(count + 3, count * 2));
  const shortlist = ranked.slice(0, shortlistSize);
  const selectRandom = useNonDeterministic ? Math.random : createSeededRandom(`${randomSeed}-${mealType}-${category}-selection`);
  const picked = [];

  while (picked.length < count && shortlist.length > 0) {
    const index = Math.floor(selectRandom() * shortlist.length);
    picked.push(shortlist.splice(index, 1)[0].food);
  }

  for (const item of picked) {
    usedNames.add(item.name);
    usageCounts.set(item.name, (usageCounts.get(item.name) || 0) + 1);
  }
  return picked;
}

export function generateDayMeals(targetCalories, goal, dietary, options = {}) {
  const cat = getCalCategory(goal);
  const usedNames = options.usedNames || new Set();
  const usageCounts = options.usageCounts || new Map();
  const recoveryMode = !!options.recoveryMode;
  const randomSeed = options.randomSeed || "nutrition-day";
  const perMeal = clampRecipesPerMeal(options.recipesPerMeal ?? DEFAULT_RECIPES_PER_MEAL);

  const breakfast = pickOptions("breakfast", cat, perMeal, dietary, {
    usedNames,
    usageCounts,
    mealBudget: getMealBudget(targetCalories, goal, "breakfast"),
    recoveryMode,
    randomSeed: `${randomSeed}-breakfast`,
  });
  const lunch = pickOptions("lunch", cat, perMeal, dietary, {
    usedNames,
    usageCounts,
    mealBudget: getMealBudget(targetCalories, goal, "lunch"),
    recoveryMode,
    randomSeed: `${randomSeed}-lunch`,
  });
  const dinner = pickOptions("dinner", cat, perMeal, dietary, {
    usedNames,
    usageCounts,
    mealBudget: getMealBudget(targetCalories, goal, "dinner"),
    recoveryMode,
    randomSeed: `${randomSeed}-dinner`,
  });
  const snack = pickOptions("snack", cat, perMeal, dietary, {
    usedNames,
    usageCounts,
    mealBudget: getMealBudget(targetCalories, goal, "snack"),
    recoveryMode,
    randomSeed: `${randomSeed}-snack`,
  });

  return {
    Breakfast: breakfast,
    Lunch: lunch,
    Dinner: dinner,
    Snack: snack,
  };
}

export function generateMealOptions(mealType, targetCalories, goal, dietary, options = {}) {
  const cat = getCalCategory(goal);
  const perMeal = clampRecipesPerMeal(options.recipesPerMeal ?? DEFAULT_RECIPES_PER_MEAL);
  const randomSeed = options.randomSeed || `regen-${Date.now()}`;
  return pickOptions(mealType, cat, perMeal, dietary, {
    ...options,
    mealBudget: getMealBudget(targetCalories, goal, mealType),
    randomSeed: `${randomSeed}-${mealType}`,
    varietyBoost: options.varietyBoost ?? 60,
    useNonDeterministic: true,
  });
}

export function isFoodAllowedByDietary(food, dietary) {
  return isAllowed(food, dietary);
}

export function getMealRecipePool(mealType, dietary) {
  const key = String(mealType || "").toLowerCase();
  const byCategory = FOOD_DB[key] || {};
  const seen = new Set();
  const pool = [];
  for (const list of Object.values(byCategory)) {
    for (const food of list || []) {
      if (!food?.name || seen.has(food.name)) continue;
      if (!isAllowed(food, dietary)) continue;
      seen.add(food.name);
      pool.push(food);
    }
  }
  return pool;
}

function getWorkoutLoad(dayPlan) {
  const exercises = dayPlan?.exercises || [];
  if (exercises.length === 0) return "rest";

  const totalMinutes = exercises.reduce((sum, exercise) => sum + (exercise.duration || 0), 0);
  if (totalMinutes >= 45 || exercises.length >= 6) return "heavy";
  if (totalMinutes >= 30 || exercises.length >= 4) return "training";
  return "light";
}

function getWorkoutAdjustmentForDay(day, workoutAdjustments) {
  if (!workoutAdjustments) return null;

  if (workoutAdjustments.pauseWindow?.active) {
    const { startDate, endDate } = workoutAdjustments.pauseWindow;
    const isoDate = workoutAdjustments.dayIsoMap?.[day];
    if (isoDate && startDate && endDate && isoDate >= startDate && isoDate <= endDate) {
      return "pause";
    }
  }

  const isoDate = workoutAdjustments.dayIsoMap?.[day];
  if (isoDate && workoutAdjustments.dayAdjustments?.[isoDate] === "period_day_1") {
    return "period_day_1";
  }

  return null;
}

function getAdjustedGoal(goal, adjustment) {
  if (adjustment === "pause") return "only_training";
  if (adjustment === "period_day_1") {
    return goal === "gain" ? "only_training" : "lose";
  }
  return goal;
}

function getDailyCalorieTarget(targetCalories, goal, load) {
  const factors = {
    lose: { rest: 0.9, light: 0.96, training: 1, heavy: 1.05 },
    gain: { rest: 0.94, light: 1, training: 1.06, heavy: 1.12 },
    only_training: { rest: 0.92, light: 0.98, training: 1.02, heavy: 1.08 },
  };
  const goalFactors = factors[goal] || factors.only_training;
  const base = targetCalories || 2000;
  return Math.round(base * (goalFactors[load] || 1));
}

function applyRecoveryNutrition(dayTarget, adjustment) {
  if (adjustment === "pause") return Math.round(dayTarget * 0.92);
  if (adjustment === "period_day_1") return Math.round(dayTarget * 0.95);
  return dayTarget;
}

export function generateWeeklyMeals(targetCalories, goal, dietary, workoutWeeklyPlan = null, workoutAdjustments = null, options = {}) {
  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];
  const weekly = {};
  const usageCounts = new Map();
  const randomSeed = options.randomSeed || "nutrition-week";
  for (const day of days) {
    const load = getWorkoutLoad(workoutWeeklyPlan?.[day]);
    const adjustment = getWorkoutAdjustmentForDay(day, workoutAdjustments);
    const adjustedGoal = getAdjustedGoal(goal, adjustment);
    const baseTarget = getDailyCalorieTarget(targetCalories, goal, adjustment ? "rest" : load);
    const dayTarget = applyRecoveryNutrition(baseTarget, adjustment);
    weekly[day] = generateDayMeals(dayTarget, adjustedGoal, dietary, {
      usedNames: new Set(),
      usageCounts,
      recoveryMode: Boolean(adjustment),
      randomSeed: `${randomSeed}-${day}`,
      recipesPerMeal: options.recipesPerMeal,
    });
  }
  return weekly;
}

export function getRecipeSearchUrl(name, lang = "en") {
  const suffix = lang === "hr" ? "recept" : lang === "it" ? "ricetta" : lang === "es" ? "receta" : lang === "de" ? "Rezept" : lang === "fr" ? "recette" : lang === "pt" ? "receita" : "recipe";
  const hl = lang !== "en" ? `&hl=${lang}` : "";
  return `https://www.google.com/search?q=${encodeURIComponent(name + " " + suffix)}${hl}`;
}
