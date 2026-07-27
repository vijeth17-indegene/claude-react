import { useState  } from "react";
import ExpenseForm from "./components/ExpenseForm";
import ExpenseList from "./components/ExpenseList";
import TotalExpense from "./components/TotalExpense";
import CategoryFilter from "./components/CategoryFilter";
import type { Expense, FilteringCategory } from "./types";

function App() {
  const [expenses, setExpenses] = useState<Expense[]>([]); // Initialize the expenses state as an empty array of Expense objects
  const [catFilter, setCatFilter] = useState<FilteringCategory>("All") //
  // The catFilter state is initialized with the value "All", which means that by default, all expenses will be displayed in the ExpenseList component. When the user selects a specific category from the CategoryFilter component, the catFilter state will be updated accordingly, and only the expenses that match the selected category will be displayed in the ExpenseList component.


  function addExpense(expense: Expense) {
    setExpenses((prevExpenses) => [...prevExpenses, expense] )
  }
  // The addExpense function takes an Expense object as an argument and updates the expenses state by adding the new expense to the existing array of expenses. It uses the functional form of setExpenses to ensure that the previous state is correctly captured and updated.

  function deleteExpense(id: string) {
    setExpenses((prevExpenses) => prevExpenses.filter((e) => e.id !== id));
  }
  // The deleteExpense function takes an id as an argument and updates the expenses state by filtering out the expense with the matching id. It uses the functional form of setExpenses to ensure that the previous state is correctly captured and updated.

  // The visibleExpenses variable is defined to determine which expenses should be displayed in the ExpenseList component based on the selected category filter. If the catFilter state is set to "All", all expenses will be displayed. Otherwise, only the expenses that match the selected category will be included in the visibleExpenses array.

  const visibleExpenses = catFilter === "All" ? expenses : expenses.filter((e) => e.category === catFilter);
  

  return(
    <div>
      <h1>Expense Tracker</h1>
      
      <ExpenseForm onAddExpense={addExpense} />
      <CategoryFilter value={catFilter} onChange={setCatFilter} />
      {/* since we defined visibleExpenses, we can use it to pass the filtered expenses to the ExpenseList component. This way, only the expenses that match the selected category will be displayed in the list. */}
      {/* if not we can pass the entire expenses array to the ExpenseList component, which will display all expenses regardless of the selected category. */}
      <ExpenseList expenses = {visibleExpenses} onDeleteExpense = { deleteExpense } />
      <TotalExpense expenses = {visibleExpenses} />
    </div>
  );
}

export default App;