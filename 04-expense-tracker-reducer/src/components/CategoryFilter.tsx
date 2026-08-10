import type { FilteringCategory } from "../types";

type CategoryFilterProps = {
    value: FilteringCategory;
    onChange: (value: FilteringCategory) => void;
}

export default function CategoryFilter({value, onChange}: CategoryFilterProps) {
    return(
        <>
            <div>
                <label htmlFor="filter"> Filter by Category</label>
                
                <select id="filter" value={value} onChange={(e) => onChange(e.target.value as FilteringCategory)}>
                    <option value="All">All</option>
                    <option value="Food">Food</option>
                    <option value="Travel">Travel</option>
                    <option value="Shopping">Shopping</option>
                    <option value="Others">Others</option>
                </select>
            </div>
        </>
    );
}