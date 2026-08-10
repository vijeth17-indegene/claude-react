import type { Expense, FilteringCategory} from "./types";

export type ExpenseState = {
    expenses: Expense[];
    catFilter: FilteringCategory;
};

export type ExpenseAction = 
    | { type: "ADD_Expense"; payload: Expense }
    | { type: "DELETE_EXPENSE"; payload: string } //payload = id
    | { type: "SET_FILTER"; payload: FilteringCategory };

export const  initialState: ExpenseState = {
    expenses: [],
    catFilter: "All",
};

export function expenseReducer(state: ExpenseState, action: ExpenseAction): ExpenseState {
    switch(action.type) {
        case "ADD_Expense": 
            return { ...state, expenses: [...state.expenses, action.payload] };
        case "DELETE_EXPENSE": 
            return { ...state, expenses: state.expenses.filter((e) => e.id !== action.payload) };
        case "SET_FILTER":
            return { ...state, catFilter: action.payload };

        default:
            return state;
    }
}