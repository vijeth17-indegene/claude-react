import type { Expense } from "../types";

type TotalExpenseProps = {
  expenses: Expense[];
};

export default function TotalExpense({expenses}: TotalExpenseProps) {

    const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    return(
        <>
            Total Expense: {total}
        </>
    );
}