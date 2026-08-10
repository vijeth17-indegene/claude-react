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