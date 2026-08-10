import { useReducer  } from "react";
import { expenseReducer, initialState } from "./reducer";
import ExpenseForm from "./components/ExpenseForm";
import ExpenseList from "./components/ExpenseList";
import TotalExpense from "./components/TotalExpense";
import CategoryFilter from "./components/CategoryFilter";

function App() {
  const [state, dispatch] = useReducer(expenseReducer, initialState);

  const visibleExpenses = 
    state.catFilter === "All" 
      ? state.expenses 
      : state.expenses.filter((e) => e.category === state.catFilter);
  
  return(
    <div>
      <h1>Expense Tracker</h1>
      
      <ExpenseForm onAddExpense={(expense) => dispatch({type: "ADD_Expense", payload: expense})} />
      <CategoryFilter value={state.catFilter} onChange={(filter) => dispatch({type: "SET_FILTER", payload: filter}) } />
      <ExpenseList expenses = {visibleExpenses} onDeleteExpense = { (id) => dispatch({ type: "DELETE_EXPENSE", payload: id}) } />
      <TotalExpense expenses = {visibleExpenses} />
    </div>
  );
}

export default App;