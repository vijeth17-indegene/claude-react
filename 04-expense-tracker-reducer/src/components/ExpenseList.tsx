import type { Expense } from "../types";

type ExpenseListProps = {
  expenses: Expense[];
  onDeleteExpense: (id: string) => void;
};

export default function ExpenseList({ expenses, onDeleteExpense }: ExpenseListProps) {
    

    return(
        <div>
            <h2>Expenses</h2>
            {expenses.length === 0 
            ? (<p>No Expenses Added</p>)
            : (
                <ul>
                    {expenses.map((expense) => (
                        <li key={expense.id}>
                            {expense.name} - ₹{expense.amount} ({expense.category})
                            <button onClick={() => onDeleteExpense(expense.id )}>Delete</button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}