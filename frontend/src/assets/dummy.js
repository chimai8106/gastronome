// dummyData.js
export const dummyRecipes = [
  {
    id: 1,
    title: "Spaghetti Carbonara",
    image: "https://via.placeholder.com/200",
    readyInMinutes: 20,
    servings: 2,
    usedIngredients: [
      { id: 101, original: "spaghetti" },
      { id: 102, original: "eggs" },
    ],
    missedIngredients: [
      { id: 201, original: "parmesan cheese" },
      { id: 202, original: "bacon" },
    ],
    analyzedInstructions: [
      {
        name: "",
        steps: [
          { number: 1, step: "Boil spaghetti in salted water." },
          { number: 2, step: "Cook bacon until crispy." },
          { number: 3, step: "Mix eggs and cheese, then combine with pasta." },
        ],
      },
    ],
  },
  {
    id: 2,
    title: "Caprese Salad",
    image: "https://via.placeholder.com/200",
    readyInMinutes: 10,
    servings: 1,
    usedIngredients: [{ id: 103, original: "tomatoes" }],
    missedIngredients: [
      { id: 203, original: "mozzarella" },
      { id: 204, original: "basil" },
    ],
    analyzedInstructions: [
      {
        name: "",
        steps: [
          { number: 1, step: "Slice tomatoes and mozzarella." },
          { number: 2, step: "Arrange on a plate and top with basil." },
          { number: 3, step: "Drizzle with olive oil and serve." },
        ],
      },
    ],
  },
];
