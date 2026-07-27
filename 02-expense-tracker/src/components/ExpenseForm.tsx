import { useState } from "react";
import type { Expense, Category } from "../types";
type ExpenseFormProps = {
    onAddExpense: (expense: Expense) => void;
}
export default function ExpenseForm({ onAddExpense }: ExpenseFormProps) {
    const [name, setName] = useState<string>("");
    const [amount, setAmount] = useState<string>("");
    const [category, setCategory] = useState<Category>("Food");
    const [errors, setErrors] = useState<{ name?: string; amount?: string }>({});


    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        const numericAmount = Number(amount);
        const trimmedName = name.trim();
        const nextErrors: { name?: string; amount?: string } = {};

        if (trimmedName === "") {
            nextErrors.name = "Name is required.";
        }
        if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
            nextErrors.amount = "Amount must be a positive number.";
        }
        
        // If there are any validation errors, we set the errors state and return early to prevent form submission. This allows us to display error messages to the user without adding an invalid expense.
        //nextErrors.name and nextErrors.amount will be set if there are validation errors for the name and amount fields, respectively. If either of these properties is present in the nextErrors object, we update the errors state with the new error messages and return early from the handleSubmit function to prevent the form from being submitted with invalid data.

        //nextErrors is an object that holds any validation errors for the form fields. If there are any validation errors, we set the errors state with the nextErrors object and return early from the handleSubmit function to prevent the form from being submitted with invalid data.
        if (nextErrors.name || nextErrors.amount) {
            setErrors(nextErrors);
            return; // stop — invalid
        }

        const newExpense: Expense = {
            id: crypto.randomUUID(),
            name: trimmedName,
            amount: numericAmount,
            category,
        };
        onAddExpense(newExpense)
        //clear the form
        setName("");
        setAmount("");
        setCategory("Food");
        setErrors({});

    }
    return (
        <div>
            <form action="" onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="Name">Expense Name</label>
                    <input 
                        type="text"
                        value={name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                        placeholder="Enter Expense"/>
                    {errors.name && <p style={{ color: "red" }}>{errors.name}</p>}
                </div>
                <div>
                    <label htmlFor="Amount">Amount</label>
                    <input 
                        type="number"
                        value={amount}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)}
                        placeholder="Enter Amount"/>
                    {errors.amount && <p style={{ color: "red" }}>{errors.amount}</p>}
                </div>
                <div>
                    <label htmlFor="Category">Category</label>
                    <select id="Category" value={category} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCategory(e.target.value as Category)}>
                        
                        <option value="Food">Food</option>
                        <option value="Travel">Travel</option>
                        <option value="Shopping">Shopping</option>
                        <option value="Others">Others</option>
                    </select>
                </div>

                <button type="submit">Add Expense</button>
            </form>
        </div>
    );
}