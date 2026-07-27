export type Category = "Food" | "Travel" | "Shopping" | "Others";
export type FilteringCategory = Category | "All";

export type Expense = {
    id: string;
    name: string;
    amount: number;
    category: Category;
}