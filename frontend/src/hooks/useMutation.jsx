import { useState } from "react";
import { addRecipe, updateRecipe } from "../services/RecipeServices";
export const useAddMutation = () => {
  const [state, setState] = useState({
    isLoading: false,
    error: "",
  });

  const fn = async (data) => {
    setState({ isLoading: true, error: "" });
    try {
      const result = await addRecipe(data);
      return result;
    } catch (err) {
      setState({ isLoading: false, error: err.message });
    } finally {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  return {mutate: fn, ...state};
};

export const useUpdateMutation = () => {
  const [state, setState] = useState({
    isLoading: false,
    error: "",
  });

  const fn = async (recipeID, updateData) => {
    setState({ isLoading: true, error: "" });
    try {
      const result = await updateRecipe(recipeID, updateData);
      return result;
    } catch (err) {
      setState({ isLoading: false, error: err.message });
    } finally {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  return {mutate: fn, ...state};
};


